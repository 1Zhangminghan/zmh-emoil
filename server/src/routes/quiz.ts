import { Router, Request, Response } from 'express'
import db from '../db'
import { generateQuizAnalysis, generateAptitudeQuestions, generatePositionQuestions } from '../ai'
import { requireAuth } from '../middleware/auth'
import type { AIClientOptions } from '../aiClient'
import type { QuizRecord } from '../types'

const router = Router()
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

function getAIOptions(req: Request): AIClientOptions | undefined {
  const apiKey = (req.headers['x-ai-key'] as string | undefined) || process.env.AI_API_KEY
  const baseUrl = process.env.AI_API_BASE_URL || (req.headers['x-ai-base-url'] as string | undefined)
  const model = process.env.AI_MODEL || (req.headers['x-ai-model'] as string | undefined)
  if (apiKey || baseUrl || model) return { apiKey, baseUrl, model }
  return undefined
}

// 从数据库行映射为前端题目格式
function mapQuestion(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: row.question_type as 'choice' | 'multi',
    category: row.category as string,
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    question: row.question as string,
    options: typeof row.options === 'string' ? JSON.parse(row.options as string) : row.options,
    answer: typeof row.answer === 'string' ? JSON.parse(row.answer as string) : row.answer,
    analysis: row.analysis as string,
    knowledgePoint: row.knowledge_point as string,
  }
}

// GET /positions/stats —— 获取所有岗位的题目数量统计
router.get('/positions/stats', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(
      "SELECT position_id, COUNT(*) as count FROM questions WHERE type = 'quiz' GROUP BY position_id"
    ).all() as Array<{ position_id: string; count: number }>

    const stats: Record<string, number> = {}
    rows.forEach((r) => { stats[r.position_id] = r.count })
    res.json(stats)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /position/:positionId —— 获取某个岗位的笔试题
router.get('/position/:positionId', (req: Request, res: Response) => {
  try {
    const { positionId } = req.params
    const rows = db.prepare(
      "SELECT * FROM questions WHERE type = 'quiz' AND position_id = ?"
    ).all(positionId)

    const questions = rows.map(mapQuestion)
    res.json({ name: positionId, questions })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /position/:positionId/generate —— AI 生成岗位笔试题
router.post('/position/:positionId/generate', async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params
    const { count = 10 } = req.body as { count?: number }

    // 获取岗位名称
    const positionRow = db.prepare('SELECT name FROM positions WHERE id = ?').get(positionId) as Record<string, unknown> | undefined
    const positionName = (positionRow?.name as string) || positionId

    const generated = await generatePositionQuestions(
      positionName,
      positionId,
      Math.min(count, 15),
      getAIOptions(req),
    )

    if (!generated || generated.length === 0) {
      return res.status(500).json({ error: 'AI 生成题目失败，请稍后重试' })
    }

    // 将生成的题目存入数据库
    const questions = generated.map((q) => {
      const id = 'qz_' + genId()
      db.prepare(
        `INSERT INTO questions (id, type, question_type, position_id, category, difficulty, question, options, answer, analysis, knowledge_point)
         VALUES (?, 'quiz', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        q.type,
        positionId,
        q.category,
        q.difficulty,
        q.question,
        JSON.stringify(q.options),
        JSON.stringify(q.answer),
        q.analysis,
        q.knowledgePoint,
      )
      return mapQuestion(db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as Record<string, unknown>)
    })

    res.json({ questions, generated: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /aptitude —— 获取行测题库
router.get('/aptitude', (req: Request, res: Response) => {
  try {
    const filter = req.query.category as string | undefined
    let rows
    if (filter && filter !== 'all') {
      rows = db.prepare(
        "SELECT * FROM questions WHERE type = 'aptitude' AND category = ?"
      ).all(filter)
    } else {
      rows = db.prepare(
        "SELECT * FROM questions WHERE type = 'aptitude'"
      ).all()
    }

    const questions = rows.map(mapQuestion)
    res.json(questions)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /aptitude/generate —— AI 生成行测题
router.post('/aptitude/generate', async (req: Request, res: Response) => {
  try {
    const { category = 'all', count = 10, difficulty = 'all' } = req.body as {
      category?: string
      count?: number
      difficulty?: string
    }

    const generated = await generateAptitudeQuestions(
      category,
      Math.min(count, 20),
      difficulty,
      getAIOptions(req),
    )

    if (!generated || generated.length === 0) {
      return res.status(500).json({ error: 'AI 生成题目失败，请稍后重试' })
    }

    // 将生成的题目存入数据库
    const questions = generated
      .filter((q) => q.question && q.options && q.answer) // 过滤无效题目
      .map((q) => {
        const id = 'apt_' + genId()
        db.prepare(
          `INSERT INTO questions (id, type, question_type, position_id, category, difficulty, question, options, answer, analysis, knowledge_point)
           VALUES (?, 'aptitude', ?, 'aptitude', ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id,
          q.type || 'choice',
          q.category || category,
          q.difficulty || 'medium',
          q.question,
          JSON.stringify(q.options || []),
          JSON.stringify(q.answer || [0]),
          q.analysis || '',
          q.knowledgePoint || '',
        )
        return mapQuestion(db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as Record<string, unknown>)
      })

    if (questions.length === 0) {
      return res.status(500).json({ error: 'AI 生成的题目格式异常，请稍后重试' })
    }

    res.json({ questions, generated: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /answer —— 记录答题结果并返回 AI 分析
router.post('/answer', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { questionId, userAnswer, isCorrect } = req.body as {
      questionId: string
      userAnswer: number[]
      isCorrect: boolean
    }

    if (!questionId) {
      return res.status(400).json({ error: 'questionId 为必填项' })
    }

    // 保存答题记录
    const recordId = genId()
    db.prepare(
      'INSERT INTO quiz_records (id, user_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?, ?)'
    ).run(recordId, userId, questionId, JSON.stringify(userAnswer || []), isCorrect ? 1 : 0)

    // 查找题目信息以生成 AI 分析
    const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId)
    let question = ''
    let options: string[] = []
    let correctAnswer: number[] = []
    let knowledgePoint = ''

    if (row) {
      question = row.question as string
      options = typeof row.options === 'string' ? JSON.parse(row.options as string) : (row.options as string[]) || []
      correctAnswer = typeof row.answer === 'string' ? JSON.parse(row.answer as string) : (row.answer as number[]) || []
      knowledgePoint = row.knowledge_point as string || ''
    }

    // 生成 AI 分析
    const analysis = await generateQuizAnalysis(
      question,
      options,
      correctAnswer,
      userAnswer || [],
      isCorrect,
      knowledgePoint,
      getAIOptions(req),
    )

    res.json({
      id: recordId,
      isCorrect,
      analysis,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /stats —— 获取当前用户的刷题统计
router.get('/stats', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const records = db.prepare(
      'SELECT * FROM quiz_records WHERE user_id = ?'
    ).all(userId) as unknown as QuizRecord[]

    const totalAnswered = records.length
    const correctCount = records.filter((r) => r.is_correct === 1).length

    // 错题 ID 集合（去重）
    const wrongQuestionIds = [
      ...new Set(
        records.filter((r) => r.is_correct === 0).map((r) => r.question_id)
      ),
    ]

    // 收藏题 ID 集合（答对过且答过多次的题目视为"收藏"）
    const questionCountMap = new Map<string, number>()
    const questionCorrectMap = new Map<string, boolean>()
    records.forEach((r) => {
      questionCountMap.set(r.question_id, (questionCountMap.get(r.question_id) || 0) + 1)
      if (r.is_correct === 1) questionCorrectMap.set(r.question_id, true)
    })
    const favoriteQuestionIds = [...questionCountMap.entries()]
      .filter(([qid, count]) => count >= 2 && questionCorrectMap.get(qid))
      .map(([qid]) => qid)

    res.json({
      totalAnswered,
      correctCount,
      wrongQuestionIds,
      favoriteQuestionIds,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router