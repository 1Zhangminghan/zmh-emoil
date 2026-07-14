import { Router, Request, Response } from 'express'
import db from '../db'

const router = Router()

// GET / —— 获取所有职位（层级结构：行业 > 大类 > 岗位）
router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(
      'SELECT id, name, industry, category, icon, description, skills, dimensions FROM positions ORDER BY industry, category, name'
    ).all() as Array<{
      id: string
      name: string
      industry: string
      category: string
      icon: string
      description: string
      skills: string
      dimensions: string
    }>

    // 构建层级结构
    const industryMap = new Map<string, Map<string, Record<string, unknown>[]>>()

    for (const row of rows) {
      if (!industryMap.has(row.industry)) {
        industryMap.set(row.industry, new Map())
      }
      const catMap = industryMap.get(row.industry)!
      if (!catMap.has(row.category)) {
        catMap.set(row.category, [])
      }
      catMap.get(row.category)!.push({
        id: row.id,
        name: row.name,
        industry: row.industry,
        category: row.category,
        icon: row.icon,
        description: row.description,
        skills: JSON.parse(row.skills || '[]'),
        dimensions: JSON.parse(row.dimensions || '[]'),
      })
    }

    const industries = Array.from(industryMap.entries()).map(([industry, catMap]) => ({
      name: industry,
      categories: Array.from(catMap.entries()).map(([name, positions]) => ({
        name,
        positions,
      })),
    }))

    res.json({ industries })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /flat —— 获取扁平职位列表（兼容旧版）
router.get('/flat', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(
      'SELECT id, name, industry, category, icon, description, skills, dimensions FROM positions ORDER BY industry, category, name'
    ).all() as Array<{
      id: string
      name: string
      industry: string
      category: string
      icon: string
      description: string
      skills: string
      dimensions: string
    }>

    const positions = rows.map((row) => ({
      id: row.id,
      name: row.name,
      industry: row.industry,
      category: row.category,
      icon: row.icon,
      description: row.description,
      skills: JSON.parse(row.skills || '[]'),
      dimensions: JSON.parse(row.dimensions || '[]'),
    }))

    res.json(positions)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router