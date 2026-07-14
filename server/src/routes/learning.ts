import { Router, Request, Response } from 'express'
import db from '../db'
import { generateLearningPlan } from '../ai'
import { requireAuth } from '../middleware/auth'
import type { AIClientOptions } from '../aiClient'
import type { LearningPlan, LearningTaskCompletion } from '../types'

const router = Router()
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

// GET /materials?dimension=xxx —— 获取指定维度的学习材料（公开接口）
router.get('/materials', (req: Request, res: Response) => {
  try {
    const { dimension } = req.query

    if (!dimension) {
      return res.json([])
    }

    const materials = db.prepare(
      'SELECT * FROM learning_materials WHERE dimension = ? ORDER BY created_at ASC'
    ).all(String(dimension))

    res.json(materials)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// 所有路由需要登录
router.use(requireAuth)

function getAIOptions(req: Request): AIClientOptions | undefined {
  const apiKey = process.env.AI_API_KEY || (req.headers['x-ai-key'] as string | undefined)
  const baseUrl = process.env.AI_API_BASE_URL || (req.headers['x-ai-base-url'] as string | undefined)
  const model = process.env.AI_MODEL || (req.headers['x-ai-model'] as string | undefined)
  if (apiKey || baseUrl || model) return { apiKey, baseUrl, model }
  return undefined
}

// GET /plans —— 获取当前用户的所有学习计划，包含任务完成记录
router.get('/plans', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const plans = db.prepare(
      'SELECT * FROM learning_plans WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as unknown as LearningPlan[]

    const result = plans.map((plan) => {
      const stages = JSON.parse(plan.stages)
      const completions = db.prepare(
        'SELECT * FROM learning_task_completions WHERE plan_id = ?'
      ).all(plan.id) as unknown as LearningTaskCompletion[]
      return { ...plan, stages, completions }
    })

    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /plans —— 创建新的学习计划
router.post('/plans', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { positionName, recruitmentType, weaknesses } = req.body as {
      positionName: string
      recruitmentType: string
      weaknesses: string[]
    }

    if (!positionName || !recruitmentType) {
      return res.status(400).json({ error: 'positionName 和 recruitmentType 为必填项' })
    }

    const planResult = await generateLearningPlan(positionName, recruitmentType, weaknesses || [], getAIOptions(req))
    const id = genId()
    const stagesJson = JSON.stringify(planResult.stages)

    db.prepare(
      'INSERT INTO learning_plans (id, user_id, position_name, recruitment_type, stages) VALUES (?, ?, ?, ?, ?)'
    ).run(id, userId, positionName, recruitmentType, stagesJson)

    const plan = db.prepare('SELECT * FROM learning_plans WHERE id = ?').get(id) as unknown as LearningPlan
    res.status(201).json({ ...plan, stages: planResult.stages, completions: [] })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /plans/:id —— 获取单个学习计划，包含任务完成记录
router.get('/plans/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const plan = db.prepare(
      'SELECT * FROM learning_plans WHERE id = ? AND user_id = ?'
    ).get(req.params.id, userId) as LearningPlan | undefined

    if (!plan) {
      return res.status(404).json({ error: '学习计划不存在' })
    }

    const stages = JSON.parse(plan.stages)
    const completions = db.prepare(
      'SELECT * FROM learning_task_completions WHERE plan_id = ?'
    ).all(plan.id) as unknown as LearningTaskCompletion[]

    res.json({ ...plan, stages, completions })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /plans/:id/tasks —— 切换任务完成状态
router.put('/plans/:id/tasks', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const planId = req.params.id
    const { taskId } = req.body as { taskId: string }

    if (!taskId) {
      return res.status(400).json({ error: 'taskId 为必填项' })
    }

    // 验证计划属于当前用户
    const plan = db.prepare(
      'SELECT id FROM learning_plans WHERE id = ? AND user_id = ?'
    ).get(planId, userId) as { id: string } | undefined

    if (!plan) {
      return res.status(404).json({ error: '学习计划不存在' })
    }

    // 检查是否已存在完成记录
    const existing = db.prepare(
      'SELECT id FROM learning_task_completions WHERE plan_id = ? AND task_id = ?'
    ).get(planId, taskId) as { id: string } | undefined

    if (existing) {
      // 已存在 → 删除（取消完成）
      db.prepare('DELETE FROM learning_task_completions WHERE id = ?').run(existing.id)
    } else {
      // 不存在 → 插入（标记完成）
      db.prepare(
        'INSERT INTO learning_task_completions (id, plan_id, task_id) VALUES (?, ?, ?)'
      ).run(genId(), planId, taskId)
    }

    // 返回更新后的完成记录
    const completions = db.prepare(
      'SELECT * FROM learning_task_completions WHERE plan_id = ?'
    ).all(planId) as unknown as LearningTaskCompletion[]

    res.json(completions)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router