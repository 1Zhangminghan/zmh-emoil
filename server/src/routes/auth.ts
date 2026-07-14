import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db'
import { signToken, requireAuth } from '../middleware/auth'

const router = Router()

const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

const SALT_ROUNDS = 10

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any

  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' })
  }

  // 如果密码哈希以 $2 开头（bcrypt），使用 bcrypt 比较
  // 否则是旧版明文密码，做一次性兼容后升级为哈希
  const passwordHash = user.password_hash
  let passwordValid = false

  if (passwordHash.startsWith('$2')) {
    passwordValid = bcrypt.compareSync(password, passwordHash)
  } else {
    // 兼容旧版明文密码
    passwordValid = password === passwordHash
    if (passwordValid) {
      // 自动升级为 bcrypt 哈希
      const newHash = bcrypt.hashSync(password, SALT_ROUNDS)
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id)
    }
  }

  if (!passwordValid) {
    return res.status(401).json({ error: '邮箱或密码错误' })
  }

  const token = signToken(user.id, user.email)

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      targetPosition: user.target_position,
      targetIndustry: user.target_industry,
    },
    token,
  })
})

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { email, password, nickname } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少 6 位' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ error: '该邮箱已被注册' })
  }

  const userId = id()
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS)

  db.prepare(
    'INSERT INTO users (id, email, password_hash, nickname) VALUES (?, ?, ?, ?)'
  ).run(userId, email, passwordHash, nickname || '')

  const token = signToken(userId, email)

  return res.json({
    user: {
      id: userId,
      email,
      nickname: nickname || '',
      avatar: '',
      targetPosition: '',
      targetIndustry: '',
    },
    token,
  })
})

// GET /api/auth/me — 需要 JWT 认证
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any

  if (!user) {
    return res.status(401).json({ error: '用户不存在' })
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      targetPosition: user.target_position,
      targetIndustry: user.target_industry,
    },
  })
})

export default router