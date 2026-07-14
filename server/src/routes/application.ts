import { Router, Request, Response } from 'express'
import db from '../db'
import { requireAuth } from '../middleware/auth'

const router = Router()
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

// 所有路由需要登录
router.use(requireAuth)

function getUserId(req: Request): string {
  return (req as any).userId
}

// ==================== 投递记录 ====================

// GET /api/applications - 获取所有投递记录
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const rows = db.prepare(`
      SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId)

    return res.json(rows)
  } catch (err: any) {
    console.error('[application] list error:', err)
    return res.status(500).json({ error: '获取投递记录失败' })
  }
})

// POST /api/applications - 创建投递记录
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { company, position, status, appliedDate, notes } = req.body

    if (!company || !position) {
      return res.status(400).json({ error: '缺少必要参数：company, position' })
    }

    const id = genId()
    db.prepare(`
      INSERT INTO applications (id, user_id, company, position, status, applied_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, company, position, status || 'applied', appliedDate || new Date().toISOString().slice(0, 10), notes || '')

    const record = db.prepare('SELECT * FROM applications WHERE id = ?').get(id)

    return res.status(201).json(record)
  } catch (err: any) {
    console.error('[application] create error:', err)
    return res.status(500).json({ error: '创建投递记录失败' })
  }
})

// PUT /api/applications/:id - 更新投递记录
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { company, position, status, appliedDate, notes } = req.body

    const existing = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any
    if (!existing) {
      return res.status(404).json({ error: '投递记录不存在' })
    }

    db.prepare(`
      UPDATE applications SET company = ?, position = ?, status = ?, applied_date = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `).run(
      company ?? existing.company,
      position ?? existing.position,
      status ?? existing.status,
      appliedDate ?? existing.applied_date,
      notes ?? existing.notes,
      req.params.id,
      userId,
    )

    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)

    return res.json(updated)
  } catch (err: any) {
    console.error('[application] update error:', err)
    return res.status(500).json({ error: '更新投递记录失败' })
  }
})

// DELETE /api/applications/:id - 删除投递记录
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const result = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(req.params.id, userId)

    if (result.changes === 0) {
      return res.status(404).json({ error: '投递记录不存在' })
    }

    return res.json({ success: true })
  } catch (err: any) {
    console.error('[application] delete error:', err)
    return res.status(500).json({ error: '删除投递记录失败' })
  }
})

// ==================== 日历事件 ====================

// GET /api/applications/calendar - 获取日历事件
router.get('/calendar', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const rows = db.prepare(`
      SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date ASC
    `).all(userId)

    return res.json(rows)
  } catch (err: any) {
    console.error('[application] calendar list error:', err)
    return res.status(500).json({ error: '获取日历事件失败' })
  }
})

// POST /api/applications/calendar - 创建日历事件
router.post('/calendar', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { title, date, type, company, position } = req.body

    if (!title || !date) {
      return res.status(400).json({ error: '缺少必要参数：title, date' })
    }

    const id = genId()
    db.prepare(`
      INSERT INTO calendar_events (id, user_id, title, date, type, company, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, title, date, type || 'other', company || '', position || '')

    const event = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id)

    return res.status(201).json(event)
  } catch (err: any) {
    console.error('[application] calendar create error:', err)
    return res.status(500).json({ error: '创建日历事件失败' })
  }
})

// DELETE /api/applications/calendar/:id - 删除日历事件
router.delete('/calendar/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const result = db.prepare('DELETE FROM calendar_events WHERE id = ? AND user_id = ?').run(req.params.id, userId)

    if (result.changes === 0) {
      return res.status(404).json({ error: '日历事件不存在' })
    }

    return res.json({ success: true })
  } catch (err: any) {
    console.error('[application] calendar delete error:', err)
    return res.status(500).json({ error: '删除日历事件失败' })
  }
})

// ==================== 动态 ====================

// GET /api/applications/activities - 获取最近动态
router.get('/activities', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const rows = db.prepare(`
      SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(userId)

    return res.json(rows)
  } catch (err: any) {
    console.error('[application] activities list error:', err)
    return res.status(500).json({ error: '获取动态失败' })
  }
})

// POST /api/applications/activities - 添加动态
router.post('/activities', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { type, content } = req.body

    if (!type || !content) {
      return res.status(400).json({ error: '缺少必要参数：type, content' })
    }

    const id = genId()
    db.prepare(`
      INSERT INTO activities (id, user_id, type, content)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, type, content)

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id)

    return res.status(201).json(activity)
  } catch (err: any) {
    console.error('[application] activity create error:', err)
    return res.status(500).json({ error: '添加动态失败' })
  }
})

export default router