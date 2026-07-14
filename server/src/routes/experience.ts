import { Router, Request, Response } from 'express'
import db from '../db'
import { requireAuth } from '../middleware/auth'
import { generateExperience } from '../ai'
import type { AIClientOptions } from '../aiClient'

const router = Router()
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

// AI 配置：优先使用 .env 中的 API Key
function getAIOptions(req: Request): AIClientOptions {
  return {
    apiKey: process.env.AI_API_KEY || (req.headers['x-ai-key'] as string) || '',
    baseUrl: process.env.AI_API_BASE_URL || (req.headers['x-ai-base-url'] as string) || '',
    model: process.env.AI_MODEL || (req.headers['x-ai-model'] as string) || '',
  }
}

// 所有写操作需要登录，读操作公开
function getUserId(req: Request): string {
  return (req as any).userId || ''
}

// GET /api/experiences - 获取所有面经
router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM experiences ORDER BY created_at DESC
    `).all() as any[]

    const experiences = rows.map((r) => ({
      ...r,
      questions: typeof r.questions === 'string' ? JSON.parse(r.questions) : r.questions,
    }))

    return res.json(experiences)
  } catch (err: any) {
    console.error('[experience] list error:', err)
    return res.status(500).json({ error: '获取面经列表失败' })
  }
})

// GET /api/experiences/search - 搜索面经（按公司、职位、行业、面试轮次）
router.get('/search', (req: Request, res: Response) => {
  try {
    const { company, position, industry, interview_round } = req.query

    let sql = 'SELECT * FROM experiences WHERE 1=1'
    const params: (string | number)[] = []

    if (company && typeof company === 'string' && company.trim()) {
      sql += ' AND company LIKE ?'
      params.push(`%${company.trim()}%`)
    }
    if (position && typeof position === 'string' && position.trim()) {
      sql += ' AND position LIKE ?'
      params.push(`%${position.trim()}%`)
    }
    if (industry && typeof industry === 'string' && industry.trim() && industry !== '全部') {
      sql += ' AND industry = ?'
      params.push(industry.trim())
    }
    if (interview_round && typeof interview_round === 'string' && interview_round !== '全部') {
      sql += ' AND interview_round = ?'
      params.push(interview_round)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params) as any[]

    const experiences = rows.map((r) => ({
      ...r,
      questions: typeof r.questions === 'string' ? JSON.parse(r.questions) : r.questions,
    }))

    return res.json(experiences)
  } catch (err: any) {
    console.error('[experience] search error:', err)
    return res.status(500).json({ error: '搜索面经失败' })
  }
})

// POST /api/experiences - 创建面经
router.post('/', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { company, position, industry, summary, content, questions, interview_round } = req.body

    if (!company || !position) {
      return res.status(400).json({ error: '缺少必要参数：company, position' })
    }

    // 获取用户昵称
    const user = db.prepare('SELECT nickname FROM users WHERE id = ?').get(userId) as any
    const authorNickname = user?.nickname || '匿名用户'

    const id = genId()
    const questionsJson = JSON.stringify(questions || [])

    db.prepare(`
      INSERT INTO experiences (id, user_id, company, position, industry, interview_round, author_nickname, summary, content, questions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, company, position, industry || '互联网', interview_round || '一面', authorNickname, summary || '', content || '', questionsJson)

    const record = db.prepare('SELECT * FROM experiences WHERE id = ?').get(id) as any

    return res.status(201).json({
      ...record,
      questions: JSON.parse(record.questions),
    })
  } catch (err: any) {
    console.error('[experience] create error:', err)
    return res.status(500).json({ error: '创建面经失败' })
  }
})

// GET /api/experiences/:id - 获取单个面经（含评论）
router.get('/:id', (req: Request, res: Response) => {
  try {
    const experience = db.prepare('SELECT * FROM experiences WHERE id = ?').get(req.params.id) as any

    if (!experience) {
      return res.status(404).json({ error: '面经不存在' })
    }

    const comments = db.prepare(
      'SELECT * FROM experience_comments WHERE experience_id = ? ORDER BY created_at ASC'
    ).all(req.params.id) as any[]

    return res.json({
      ...experience,
      questions: typeof experience.questions === 'string' ? JSON.parse(experience.questions) : experience.questions,
      comments,
    })
  } catch (err: any) {
    console.error('[experience] detail error:', err)
    return res.status(500).json({ error: '获取面经详情失败' })
  }
})

// POST /api/experiences/:id/comments - 添加评论
router.post('/:id/comments', (req: Request, res: Response) => {
  try {
    const { content, authorNickname } = req.body
    const experienceId = req.params.id

    if (!content) {
      return res.status(400).json({ error: '缺少必要参数：content' })
    }

    const experience = db.prepare('SELECT id FROM experiences WHERE id = ?').get(experienceId)
    if (!experience) {
      return res.status(404).json({ error: '面经不存在' })
    }

    const id = genId()
    db.prepare(`
      INSERT INTO experience_comments (id, experience_id, author_nickname, content)
      VALUES (?, ?, ?, ?)
    `).run(id, experienceId, authorNickname || '匿名用户', content)

    const comment = db.prepare('SELECT * FROM experience_comments WHERE id = ?').get(id) as any

    return res.status(201).json(comment)
  } catch (err: any) {
    console.error('[experience] comment error:', err)
    return res.status(500).json({ error: '添加评论失败' })
  }
})

// PUT /api/experiences/:id/like - 点赞
router.put('/:id/like', (req: Request, res: Response) => {
  try {
    const result = db.prepare(
      'UPDATE experiences SET likes = likes + 1 WHERE id = ?'
    ).run(req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({ error: '面经不存在' })
    }

    const updated = db.prepare('SELECT likes FROM experiences WHERE id = ?').get(req.params.id) as any

    return res.json({ likes: updated.likes })
  } catch (err: any) {
    console.error('[experience] like error:', err)
    return res.status(500).json({ error: '点赞失败' })
  }
})

// POST /api/experiences/generate - AI 生成面经
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { company, position, industry, interview_round } = req.body

    if (!company || !position) {
      return res.status(400).json({ error: '缺少必要参数：company, position' })
    }

    const aiOptions = getAIOptions(req)
    const generated = await generateExperience(
      company.trim(),
      position.trim(),
      (industry || '互联网').trim(),
      (interview_round || '一面').trim(),
      aiOptions,
    )

    if (!generated) {
      return res.status(503).json({ error: 'AI 生成失败，请检查 AI 服务是否正常运行' })
    }

    // 获取用户昵称
    const user = db.prepare('SELECT nickname FROM users WHERE id = ?').get(userId) as any
    const authorNickname = user?.nickname || '匿名用户'

    const id = genId()
    const questionsJson = JSON.stringify(generated.questions)
    const round = generated.interview_round || interview_round || '一面'

    db.prepare(`
      INSERT INTO experiences (id, user_id, company, position, industry, interview_round, author_nickname, summary, content, questions, likes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, company.trim(), position.trim(), (industry || '互联网').trim(), round, authorNickname, generated.summary, generated.content, questionsJson, Math.floor(Math.random() * 30) + 5)

    const record = db.prepare('SELECT * FROM experiences WHERE id = ?').get(id) as any

    return res.status(201).json({
      ...record,
      questions: JSON.parse(record.questions),
      aiGenerated: true,
    })
  } catch (err: any) {
    console.error('[experience] generate error:', err)
    return res.status(500).json({ error: 'AI 生成面经失败' })
  }
})

export default router