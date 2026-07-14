import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import db from '../db'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'ai-job-coach-jwt-secret-change-in-production'

function getUserId(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    return payload.userId
  } catch {
    return null
  }
}

// GET /api/profile
router.get('/', (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
  if (!user) {
    return res.status(401).json({ error: '用户不存在' })
  }

  return res.json({
    targetPosition: user.target_position,
    targetIndustry: user.target_industry,
    graduationYear: user.graduation_year || '',
  })
})

// PUT /api/profile
router.put('/', (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
  if (!user) {
    return res.status(401).json({ error: '用户不存在' })
  }

  const { targetPosition, targetIndustry, graduationYear } = req.body

  const newTargetPosition = targetPosition !== undefined ? targetPosition : user.target_position
  const newTargetIndustry = targetIndustry !== undefined ? targetIndustry : user.target_industry
  const newGraduationYear = graduationYear !== undefined ? graduationYear : (user.graduation_year || '')

  db.prepare(
    'UPDATE users SET target_position = ?, target_industry = ?, graduation_year = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(newTargetPosition, newTargetIndustry, newGraduationYear, userId)

  return res.json({
    targetPosition: newTargetPosition,
    targetIndustry: newTargetIndustry,
    graduationYear: newGraduationYear,
  })
})

export default router