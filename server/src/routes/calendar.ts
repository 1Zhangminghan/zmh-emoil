import { Router, Request, Response } from 'express'
import db from '../db'

const router = Router()

// GET /api/calendar/events?type=fall|spring|intern
// 返回预设日历事件，按 recruitment_type 筛选，按 date 排序
router.get('/events', (req: Request, res: Response) => {
  try {
    const { type } = req.query

    let events: Record<string, unknown>[]
    if (type && ['fall', 'spring', 'intern'].includes(String(type))) {
      events = db.prepare(
        'SELECT * FROM preset_calendar_events WHERE recruitment_type = ? ORDER BY date ASC'
      ).all(String(type))
    } else {
      events = db.prepare(
        'SELECT * FROM preset_calendar_events ORDER BY date ASC'
      ).all()
    }

    res.json(events)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router