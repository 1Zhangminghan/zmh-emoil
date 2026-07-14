import { Router, Request, Response } from 'express'
import db from '../db'
import { generateDiagnosisScores } from '../ai'
import { diagnosticQuestions } from '../data/questions'
import { requireAuth } from '../middleware/auth'
import type { AIClientOptions } from '../aiClient'

const router = Router()
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

// 所有路由需要登录
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

// 为没有专门诊断题的岗位生成通用题目
function generateGenericQuestions(positionId: string, positionName: string, dimensions: string[]) {
  const genericTemplates = [
    { type: 'choice' as const, difficulty: 'basic' as const, template: (dim: string) => `请选择你认为${dim}最核心的能力要求：` },
    { type: 'short' as const, difficulty: 'basic' as const, template: (dim: string) => `请简述你对${dim}的理解。` },
    { type: 'short' as const, difficulty: 'intermediate' as const, template: (dim: string) => `请描述一个你在${dim}方面的实际项目经验。` },
    { type: 'essay' as const, difficulty: 'intermediate' as const, template: (dim: string) => `请详细介绍你在${dim}方面的能力，包括你的学习方法、实践经验和成果。` },
    { type: 'short' as const, difficulty: 'intermediate' as const, template: (dim: string) => `在${dim}方面，你认为自己最大的优势和不足是什么？` },
  ]

  const questions: Array<{
    id: string
    dimension: string
    type: 'choice' | 'short' | 'essay'
    difficulty: 'basic' | 'intermediate' | 'advanced'
    question: string
    options?: string[]
  }> = []

  // 为每个维度生成1-2道题
  dimensions.forEach((dim, dimIdx) => {
    const count = dimIdx === 0 ? 2 : 1 // 第一个维度多一道
    for (let i = 0; i < count && i < genericTemplates.length; i++) {
      const t = genericTemplates[(dimIdx + i) % genericTemplates.length]
      const q: typeof questions[0] = {
        id: `gen_${positionId}_${dimIdx}_${i}`,
        dimension: dim,
        type: t.type,
        difficulty: t.difficulty,
        question: t.template(dim),
      }
      if (t.type === 'choice') {
        q.options = ['基础入门', '熟练应用', '深入理解', '专家级别']
      }
      questions.push(q)
    }
  })

  // 至少保证5道题
  while (questions.length < 5) {
    const dim = dimensions[questions.length % dimensions.length]
    const t = genericTemplates[questions.length % genericTemplates.length]
    questions.push({
      id: `gen_${positionId}_extra_${questions.length}`,
      dimension: dim,
      type: t.type,
      difficulty: t.difficulty,
      question: t.template(dim),
      ...(t.type === 'choice' ? { options: ['基础入门', '熟练应用', '深入理解', '专家级别'] } : {}),
    })
  }

  return questions
}

// GET /questions/:positionId —— 获取某岗位的诊断测试题
router.get('/questions/:positionId', (req: Request, res: Response) => {
  try {
    const { positionId } = req.params

    // 先检查是否有预设题目
    const presetQuestions = diagnosticQuestions[positionId]
    if (presetQuestions && presetQuestions.length > 0) {
      return res.json(presetQuestions.map((q) => ({
        id: q.id,
        dimension: q.dimension,
        type: q.type,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
      })))
    }

    // 无预设题目时，从数据库获取岗位信息生成通用题目
    const positionRow = db.prepare('SELECT name, dimensions FROM positions WHERE id = ?').get(positionId) as Record<string, unknown> | undefined
    if (!positionRow) {
      return res.json([])
    }

    const positionName = (positionRow.name as string) || positionId
    const dimensions = typeof positionRow.dimensions === 'string'
      ? JSON.parse(positionRow.dimensions as string)
      : (positionRow.dimensions as string[]) || []

    if (dimensions.length === 0) {
      return res.json([])
    }

    const genericQuestions = generateGenericQuestions(positionId, positionName, dimensions)
    res.json(genericQuestions)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST / - 提交诊断答题
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { positionId, positionName, type, answers } = req.body as {
      positionId: string
      positionName: string
      type: string
      answers: string[]
    }

    if (!positionId || !positionName || !type || !answers) {
      res.status(400).json({ error: '缺少必要参数：positionId, positionName, type, answers' })
      return
    }

    // 获取该岗位的题目
    const questions = diagnosticQuestions[positionId]
    if (!questions) {
      res.status(400).json({ error: '无效的岗位ID' })
      return
    }

    // 提取维度列表
    const dimensions = [...new Set(questions.map((q) => q.dimension))]

    // 调用 AI 评分
    const diagnosisResult = await generateDiagnosisScores(
      answers,
      questions.map((q) => ({ dimension: q.dimension, question: q.question })),
      dimensions,
      getAIOptions(req),
    )

    // 保存记录
    const id = genId()
    const now = new Date().toISOString()
    db.prepare(
      'INSERT INTO diagnosis_records (id, user_id, position_id, position_name, type, scores, results, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      id,
      userId,
      positionId,
      positionName,
      type,
      JSON.stringify(diagnosisResult.dimensionScores),
      JSON.stringify(diagnosisResult),
      now,
    )

    res.json({ id, ...diagnosisResult })
  } catch (error) {
    res.status(500).json({ error: '诊断提交失败' })
  }
})

// GET / - 获取当前用户的所有诊断记录
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const rows = db
      .prepare('SELECT * FROM diagnosis_records WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as Array<Record<string, unknown>>

    const result = rows.map((row) => {
      let scores: Record<string, number> = {}
      let results: Record<string, unknown> = {}
      try { scores = JSON.parse(String(row.scores ?? '{}')) } catch { /* keep default */ }
      try { results = JSON.parse(String(row.results ?? '{}')) } catch { /* keep default */ }
      return { ...row, scores, results }
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取诊断记录失败' })
  }
})

// GET /:id - 获取单个诊断记录
router.get('/:id', (req: Request, res: Response) => {
  try {
    const row = db
      .prepare('SELECT * FROM diagnosis_records WHERE id = ?')
      .get(req.params.id) as Record<string, unknown> | undefined

    if (!row) {
      res.status(404).json({ error: '诊断记录不存在' })
      return
    }

    res.json({
      ...row,
      scores: (() => { try { return JSON.parse(String(row.scores ?? '{}')) } catch { return {} } })(),
      results: (() => { try { return JSON.parse(String(row.results ?? '{}')) } catch { return {} } })(),
    })
  } catch (error) {
    res.status(500).json({ error: '获取诊断记录失败' })
  }
})

export default router