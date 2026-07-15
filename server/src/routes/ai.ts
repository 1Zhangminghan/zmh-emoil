import { Router, Request, Response } from 'express'
import { chat, isAIConfigured, type AIClientOptions } from '../aiClient'

const router = Router()

interface SuggestionsRequest {
  diagnosis?: {
    totalScore?: number
    dimensionScores?: Record<string, number>
    strengths?: string[]
    weaknesses?: string[]
  }
  learningProgress?: {
    totalTasks?: number
    completedTasks?: number
  }
  quizStats?: {
    totalQuestions?: number
    correctCount?: number
    accuracy?: number
  }
  interviewCount?: number
  targetPosition?: string
}

interface SuggestionsResponse {
  weeklySummary: string
  suggestions: string[]
  priorityAreas: string[]
  motivation: string
}

// ============ 本地规则引擎 ============

function generateSuggestionsLocal(data: SuggestionsRequest): SuggestionsResponse {
  const { diagnosis, learningProgress, quizStats, interviewCount = 0, targetPosition = '目标岗位' } = data
  const weaknesses = diagnosis?.weaknesses || []
  const strengths = diagnosis?.strengths || []
  const totalScore = diagnosis?.totalScore ?? 0
  const completedTasks = learningProgress?.completedTasks ?? 0
  const totalTasks = learningProgress?.totalTasks ?? 0
  const accuracy = quizStats?.accuracy ?? 0
  const correctCount = quizStats?.correctCount ?? 0
  const totalQuestions = quizStats?.totalQuestions ?? 0

  const suggestions: string[] = []

  // 基于诊断结果生成建议
  if (weaknesses.length > 0) {
    suggestions.push(`本周重点攻克薄弱维度：${weaknesses.slice(0, 3).join('、')}，建议每天安排至少 1 小时专项学习`)
  }
  if (strengths.length > 0) {
    suggestions.push(`继续保持${strengths.slice(0, 2).join('、')}等优势维度的训练，进一步巩固领先地位`)
  }
  if (totalScore < 60) {
    suggestions.push('当前综合能力评分偏低，建议优先夯实基础知识，系统学习核心技能后再进行专项练习')
  } else if (totalScore >= 75) {
    suggestions.push('综合能力表现良好，可以开始进行模拟面试和真题练习，提升实战能力')
  }

  // 基于学习进度生成建议
  const progressRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  if (progressRate < 30) {
    suggestions.push(`学习计划完成度仅 ${progressRate}%，建议加快学习节奏，每周至少完成 3-5 个学习任务`)
  } else if (progressRate >= 80) {
    suggestions.push(`学习计划完成度 ${progressRate}%，进展顺利！完成当前计划后建议进行模拟面试检验学习成果`)
  }
  if (completedTasks === 0 && totalTasks > 0) {
    suggestions.push('学习计划尚未启动，建议立即开始第一个学习任务，迈出第一步最重要')
  }

  // 基于刷题统计生成建议
  if (totalQuestions === 0) {
    suggestions.push('本周尚未开始刷题，建议每天至少完成 5-10 道笔试题，保持手感')
  } else if (accuracy < 60) {
    suggestions.push(`当前刷题正确率为 ${accuracy}%，建议在刷题的同时加强错题回顾和知识点归纳`)
  } else if (accuracy >= 80) {
    suggestions.push(`刷题正确率 ${accuracy}% 表现优秀，可以挑战更高难度的题目`)
  }

  // 基于面试记录生成建议
  if (interviewCount === 0) {
    suggestions.push('本周尚未进行模拟面试练习，建议至少完成 1 次模拟面试，锻炼临场表达能力')
  } else if (interviewCount >= 3) {
    suggestions.push(`本周已完成 ${interviewCount} 次模拟面试，建议回顾面试反馈，针对性地改进薄弱环节`)
  }

  // 确保至少有 3 条建议
  if (suggestions.length < 3) {
    suggestions.push(`持续关注${targetPosition}岗位的招聘动态，针对性准备高频面试题`)
    suggestions.push('每天保持 30 分钟的行业资讯阅读，了解最新的技术趋势和面试方向')
    suggestions.push('建议定期复盘学习进度，根据实际情况调整学习计划')
  }

  // 优先领域
  const priorityAreas: string[] = []
  if (weaknesses.length > 0) {
    priorityAreas.push(...weaknesses.slice(0, 3))
  }
  if (totalQuestions === 0) {
    priorityAreas.push('刷题训练')
  }
  if (interviewCount === 0) {
    priorityAreas.push('模拟面试')
  }
  if (progressRate < 30) {
    priorityAreas.push('学习计划推进')
  }
  if (priorityAreas.length < 3) {
    priorityAreas.push('简历优化', '行业知识储备')
  }

  // 周度总结
  let weeklySummary = ''
  if (totalScore >= 75) {
    weeklySummary = `本周你在${targetPosition}方向上表现良好，综合评分 ${totalScore} 分。`
  } else if (totalScore > 0) {
    weeklySummary = `本周综合评分 ${totalScore} 分，在${targetPosition}方向上还有提升空间。`
  } else {
    weeklySummary = `本周是${targetPosition}求职准备的新起点，坚持就是胜利！`
  }
  if (totalQuestions > 0) {
    weeklySummary += `共完成 ${totalQuestions} 道笔试题，正确率 ${accuracy}%。`
  }
  if (completedTasks > 0) {
    weeklySummary += `学习计划完成 ${completedTasks}/${totalTasks} 个任务。`
  }
  if (interviewCount > 0) {
    weeklySummary += `完成 ${interviewCount} 次模拟面试。`
  }

  // 激励语
  const motivations = [
    '每一次努力都在为未来的offer铺路，保持节奏，继续前进！💪',
    '求职是一场马拉松，不是短跑。坚持每天进步一点点，量变终将引起质变！',
    '你已经走在正确的路上了，按照计划稳步推进，理想的offer就在前方！',
    '不要和别人比较，只和昨天的自己比较。今天的你比昨天更优秀！',
  ]
  const motivation = motivations[Math.floor(Math.random() * motivations.length)]

  return {
    weeklySummary,
    suggestions: suggestions.slice(0, 6),
    priorityAreas: priorityAreas.slice(0, 5),
    motivation,
  }
}

// ============ AI 驱动 ============

async function generateSuggestionsAI(data: SuggestionsRequest, aiOptions?: AIClientOptions): Promise<SuggestionsResponse | null> {
  try {
    const prompt = `你是一位资深的求职辅导专家和职业规划师。请根据以下用户的求职准备数据，生成个性化的本周建议。

用户数据：
${JSON.stringify(data, null, 2)}

请返回一个JSON格式的建议报告：
{
  "weeklySummary": "本周整体评估总结（100-150字）",
  "suggestions": ["具体建议1", "具体建议2", ...],  // 3-6条具体可执行的建议
  "priorityAreas": ["优先领域1", "优先领域2", ...],  // 2-5个本周最需要关注的领域
  "motivation": "一句激励语（20字以内）"
}

要求：
- 建议要具体、可执行，针对用户的实际情况
- 优先领域要基于用户的薄弱环节和学习进度
- 激励语要真诚、有力量
- 如果用户某项数据为空，则该维度不做重点建议`

    const text = await chat([
      { role: 'system', content: '你是一位资深的求职辅导专家。请返回严格的JSON格式，不要包含任何markdown标记或额外说明。' },
      { role: 'user', content: prompt },
    ], { ...aiOptions, jsonMode: true })

    if (text) {
      // 尝试提取 JSON
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text
      return JSON.parse(jsonStr.trim()) as SuggestionsResponse
    }
    return null
  } catch (err) {
    console.error('[AI] suggestions 生成失败:', err)
    return null
  }
}

// ============ 路由 ============

// POST /api/ai/suggestions
router.post('/suggestions', async (req: Request, res: Response) => {
  try {
    const data: SuggestionsRequest = req.body

    // 获取 AI 配置
    const apiKey = (req.headers['x-ai-key'] as string | undefined) || process.env.AI_API_KEY
    const baseUrl = process.env.AI_API_BASE_URL || (req.headers['x-ai-base-url'] as string | undefined)
    const model = process.env.AI_MODEL || (req.headers['x-ai-model'] as string | undefined)
    const aiOptions: AIClientOptions | undefined = (apiKey || baseUrl || model)
      ? { apiKey, baseUrl, model }
      : undefined

    // 优先使用 AI
    if (isAIConfigured(aiOptions)) {
      const aiResult = await generateSuggestionsAI(data, aiOptions)
      if (aiResult) {
        return res.json(aiResult)
      }
    }

    // 降级到本地规则引擎
    const localResult = generateSuggestionsLocal(data)
    return res.json(localResult)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router