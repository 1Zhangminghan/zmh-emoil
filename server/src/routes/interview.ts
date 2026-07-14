import { Router, Request, Response } from 'express'
import db from '../db'
import { evaluateInterviewAnswer, generateInterviewReport } from '../ai'
import { requireAuth } from '../middleware/auth'
import type { AIClientOptions } from '../aiClient'

const router = Router()
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

// GET /questions 不需要登录（公开接口）
router.get('/questions', (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'technical'
    const rows = db.prepare(
      "SELECT * FROM questions WHERE type = 'interview' AND category = ?"
    ).all(type)

    const questions = rows.map((row) => ({
      id: row.id,
      question: row.question as string,
      dimension: row.dimension as string,
    }))

    res.json(questions)
  } catch (err: any) {
    console.error('[interview] questions error:', err)
    return res.status(500).json({ error: '获取面试题失败' })
  }
})

// 以下路由需要登录
router.use(requireAuth)

function getUserId(req: Request): string {
  return (req as any).userId
}

function getAIOptions(req: Request): AIClientOptions | undefined {
  const apiKey = process.env.AI_API_KEY || (req.headers['x-ai-key'] as string | undefined)
  const baseUrl = process.env.AI_API_BASE_URL || (req.headers['x-ai-base-url'] as string | undefined)
  const model = process.env.AI_MODEL || (req.headers['x-ai-model'] as string | undefined)
  if (apiKey || baseUrl || model) return { apiKey, baseUrl, model }
  return undefined
}

// POST /api/interview/evaluate - 评估面试回答
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { question, answer, dimension, targetPosition, interviewType } = req.body

    if (!question || !answer || !dimension) {
      return res.status(400).json({ error: '缺少必要参数：question, answer, dimension' })
    }

    const result = await evaluateInterviewAnswer(
      question, answer, dimension, targetPosition || '', interviewType || 'general',
      getAIOptions(req),
    )

    const id = genId()
    db.prepare(`
      INSERT INTO interview_records (id, user_id, question, answer, dimension, interview_type, score, feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, question, answer, dimension, interviewType || 'general', result.score, JSON.stringify(result))

    return res.json({
      id,
      ...result,
      created_at: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[interview] evaluate error:', err)
    return res.status(500).json({ error: '评估失败，请稍后重试' })
  }
})

// POST /api/interview/report - 生成面试总结报告
router.post('/report', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { answers, interviewType, targetPosition } = req.body

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: '缺少答题记录' })
    }

    const result = await generateInterviewReport(
      answers,
      interviewType || 'general',
      targetPosition || '',
      getAIOptions(req),
    )

    return res.json(result)
  } catch (err: any) {
    console.error('[interview] report error:', err)
    return res.status(500).json({ error: '生成报告失败，请稍后重试' })
  }
})

// GET /api/interview/history - 获取面试历史
router.get('/history', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const rows = db.prepare(`
      SELECT * FROM interview_records WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as any[]

    const records = rows.map((r) => ({
      ...r,
      feedback: typeof r.feedback === 'string' ? JSON.parse(r.feedback) : r.feedback,
    }))

    return res.json(records)
  } catch (err: any) {
    console.error('[interview] history error:', err)
    return res.status(500).json({ error: '获取历史记录失败' })
  }
})

export default router