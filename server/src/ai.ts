// ============ AI 服务层 ============
// 优先使用真实 AI API（DeepSeek / 通义千问等），未配置时降级为规则引擎

import { chat, chatJSON, isAIConfigured, getLastAIError, type AIClientOptions } from './aiClient'
import type { ResumeAnalysis, OptimizedResume, InterviewEvaluation, InterviewReport, DiagnosisResult, LearningPlanResult } from './types'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function analyzeTextRichness(text: string): number {
  if (!text) return 0
  const len = text.length
  if (len < 10) return 20
  if (len < 30) return 40
  if (len < 60) return 60
  if (len < 100) return 75
  if (len < 200) return 85
  return 90
}

function hasQuantifiedData(text: string): boolean {
  return /\d+%|\d+\s*万|\d+\s*倍|\d+\s*人|\d+\s*次|\d+\+|[0-9]+\.?[0-9]*\s*[百千万亿]/.test(text)
}

function hasStarKeywords(text: string): boolean {
  const keywords = ['负责', '主导', '参与', '优化', '提升', '降低', '实现', '设计', '开发', '完成', '解决', '落地']
  return keywords.filter((k) => text.includes(k)).length >= 2
}

// ============ 简历分析 ============

export async function analyzeResume(data: Record<string, unknown>, aiOptions?: AIClientOptions): Promise<ResumeAnalysis> {
  // 尝试真实 AI
  if (isAIConfigured(aiOptions)) {
    console.log('[AI analyzeResume] 使用真实 AI 分析简历...')
    try {
      const result = await chatJSON<ResumeAnalysis>([
      {
        role: 'system',
        content: `你是一位资深HR和职业规划专家。请全面分析以下简历数据，返回JSON格式的评估结果。

返回格式：
{
  "overallScore": 数字(0-100),
  "summary": "综合评估总结（150-300字），包括整体评价、核心优势、主要短板、改进方向",
  "dimensions": [
    {"label": "内容完整性", "score": 数字, "comment": "简短评语"},
    {"label": "关键词匹配", "score": 数字, "comment": "简短评语"},
    {"label": "排版规范", "score": 数字, "comment": "简短评语"},
    {"label": "语言表达", "score": 数字, "comment": "简短评语"},
    {"label": "量化成果", "score": 数字, "comment": "简短评语"},
    {"label": "岗位匹配度", "score": 数字, "comment": "简短评语"}
  ],
  "suggestions": [
    {"section": "简历模块", "original": "原始内容", "suggested": "改进后的具体内容", "reason": "改进原因"}
  ],
  "optimizedResume": {
    "name": "姓名",
    "email": "邮箱",
    "phone": "电话",
    "targetPosition": "目标岗位",
    "targetIndustry": "目标行业",
    "education": [{"school": "学校", "degree": "学历", "major": "专业", "time": "时间"}],
    "workExperience": [{"company": "公司", "position": "岗位", "time": "时间", "description": "优化后的描述（使用STAR法则，加入量化数据）"}],
    "projectExperience": [{"name": "项目名", "role": "角色", "description": "优化后的描述", "techStack": "技术栈"}],
    "skills": "优化后的技能列表",
    "certifications": "优化后的证书列表"
  }
}

评估标准：
- 内容完整性：检查基本信息、教育、实习、项目、技能等是否齐全
- 关键词匹配：检查是否包含目标岗位相关的技术/行业关键词
- 排版规范：检查描述是否清晰、结构是否合理
- 语言表达：检查是否使用STAR法则、是否有量化数据
- 量化成果：是否有具体数字和成果描述
- 岗位匹配度：简历内容与目标岗位的匹配程度

优化原则：
- 对每个经历描述使用STAR法则重写，加入具体行动和量化成果
- 保留用户原始信息的真实性，不要编造不存在的经历
- 优化措辞使其更专业、更有影响力
- 最多8条改进建议

请只返回JSON对象，不要包含任何其他文字或markdown标记。`,
      },
      {
        role: 'user',
        content: JSON.stringify(data),
      },
    ], { ...aiOptions, jsonMode: false, maxTokens: 4096 })
    if (result) {
      console.log('[AI analyzeResume] AI 分析成功')
      return { ...result, aiPowered: true }
    }
    const aiErr = getLastAIError()
    console.log(`[AI analyzeResume] AI 返回为空（${aiErr}），降级到规则引擎`)
    return { ...analyzeResumeLocal(data), aiPowered: false, aiError: aiErr || 'AI 模型调用失败' }
  } catch {
    const aiErr = getLastAIError()
    console.log(`[AI analyzeResume] AI 调用异常（${aiErr}），降级到规则引擎`)
    return { ...analyzeResumeLocal(data), aiPowered: false, aiError: aiErr || 'AI 服务异常' }
  }
  } else {
    console.log('[AI analyzeResume] AI 未配置，使用规则引擎')
    return { ...analyzeResumeLocal(data), aiPowered: false, aiError: 'AI 模型未配置，请在 server/.env 中配置 AI_API_KEY' }
  }
}

function analyzeResumeLocal(data: Record<string, unknown>): ResumeAnalysis {
  const suggestions: ResumeAnalysis['suggestions'] = []
  const allText = JSON.stringify(data)
  const education = (data.education as Array<Record<string, unknown>>) || []
  const workExp = (data.workExperience as Array<Record<string, unknown>>) || []
  const projExp = (data.projectExperience as Array<Record<string, unknown>>) || []

  let completeness = 100
  if (!data.name) completeness -= 15
  if (!data.email) completeness -= 10
  if (!data.phone) completeness -= 5
  if (education.length === 0) completeness -= 20
  if (education.length > 0 && !education[0].school) completeness -= 10
  if (workExp.length === 0) completeness -= 10
  if (projExp.length === 0) completeness -= 10
  if (!data.skills) completeness -= 15
  if (!data.targetPosition) completeness -= 5
  completeness = clamp(completeness, 30, 100)

  let keywordScore = 40
  const techKeywords = ['Java', 'Python', 'Spring', 'React', 'Vue', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'Linux', 'Git', '微服务', '分布式', '高并发', 'AI', '大数据', 'TypeScript', 'Go', 'C++', 'HTML', 'CSS', 'JavaScript', 'Node', 'Kafka', 'ES', 'MongoDB', '负载均衡', '安全', 'CI/CD', '自动化']
  const matched = techKeywords.filter((k) => allText.toLowerCase().includes(k.toLowerCase()))
  keywordScore += matched.length * 3
  keywordScore = clamp(keywordScore, 30, 100)

  let layoutScore = 85
  workExp.forEach((w: Record<string, unknown>) => {
    if (w.description && String(w.description).length < 30) layoutScore -= 5
  })
  layoutScore = clamp(layoutScore, 50, 100)

  let expressScore = 60
  workExp.forEach((w: Record<string, unknown>) => {
    if (w.description) expressScore = Math.max(expressScore, analyzeTextRichness(String(w.description)))
  })
  projExp.forEach((p: Record<string, unknown>) => {
    if (p.description) expressScore = Math.max(expressScore, analyzeTextRichness(String(p.description)))
  })
  expressScore = clamp(expressScore + 10, 50, 95)

  let quantScore = 40
  let quantCount = 0
  workExp.forEach((w: Record<string, unknown>) => {
    if (w.description && hasQuantifiedData(String(w.description))) quantCount++
  })
  projExp.forEach((p: Record<string, unknown>) => {
    if (p.description && hasQuantifiedData(String(p.description))) quantCount++
  })
  quantScore += quantCount * 15
  quantScore = clamp(quantScore, 30, 95)

  let matchScore = 50
  if (data.targetPosition && String(data.targetPosition).length > 2) matchScore += 10
  if (data.targetIndustry && String(data.targetIndustry).length > 1) matchScore += 5
  if (workExp.length > 0) matchScore += 10
  if (data.skills && String(data.skills).length > 5) matchScore += 10
  matchScore += matched.length * 2
  matchScore = clamp(matchScore, 35, 95)

  const overallScore = Math.round((completeness + keywordScore + layoutScore + expressScore + quantScore + matchScore) / 6)

  const dimComments: Record<string, string> = {
    '内容完整性': completeness >= 80 ? '信息较为完整' : completeness >= 60 ? '部分信息缺失' : '信息不完整，需补充',
    '关键词匹配': keywordScore >= 80 ? '关键词覆盖良好' : keywordScore >= 60 ? '关键词可进一步丰富' : '缺少行业关键词',
    '排版规范': layoutScore >= 80 ? '排版结构清晰' : layoutScore >= 60 ? '排版基本规范' : '排版有待优化',
    '语言表达': expressScore >= 80 ? '表达专业流畅' : expressScore >= 60 ? '表达基本通顺' : '建议使用STAR法则',
    '量化成果': quantScore >= 80 ? '量化数据充分' : quantScore >= 60 ? '可增加量化数据' : '缺少量化成果描述',
    '岗位匹配度': matchScore >= 80 ? '与目标岗位匹配度高' : matchScore >= 60 ? '与目标岗位有一定匹配' : '需提升岗位匹配度',
  }

  // 生成建议
  if (education.length === 0 || (education.length > 0 && !education[0].school)) {
    suggestions.push({ section: '教育经历', original: '教育经历缺失', suggested: '请补充你的教育背景，包括学校名称、学历、专业和就读时间', reason: '教育经历是简历的基础信息，HR会首先关注' })
  }
  workExp.forEach((w: Record<string, unknown>) => {
    if (!w.description || String(w.description).length < 30) {
      suggestions.push({ section: '实习经历', original: String(w.description || '（空）'), suggested: `建议补充${w.company || '公司'}${w.position || '岗位'}的具体工作内容和成果，使用STAR法则来描述`, reason: '缺乏具体描述，无法体现实际贡献和能力' })
    } else if (!hasQuantifiedData(String(w.description))) {
      suggestions.push({ section: '实习经历', original: String(w.description), suggested: `${w.description}，建议增加量化成果，如"优化了XX功能，使接口响应时间降低XX%"`, reason: '增加量化数据可以增强说服力' })
    }
  })
  projExp.forEach((p: Record<string, unknown>) => {
    if (!p.description || String(p.description).length < 30) {
      suggestions.push({ section: '项目经验', original: String(p.description || '（空）'), suggested: `建议补充项目"${p.projectName || '（未命名）'}"的背景、你的角色、技术难点和最终成果`, reason: '项目描述过于简略，无法展示技术深度' })
    }
    if (!p.techStack) {
      suggestions.push({ section: '项目经验', original: '技术栈未填写', suggested: `建议为项目补充使用的技术栈，如框架、数据库、中间件等`, reason: '技术栈是面试官快速了解技术广度的关键信息' })
    }
  })
  if (!data.skills) {
    suggestions.push({ section: '技能证书', original: '（空）', suggested: '建议补充专业技能，按熟练程度排列', reason: '技能部分是ATS系统关键词匹配重点' })
  }
  if (suggestions.length === 0) {
    suggestions.push({ section: '整体评价', original: '简历内容完整', suggested: '简历整体质量不错，建议根据不同公司定制化调整重点突出内容', reason: '针对不同公司的JD，突出匹配的经历和技能可以进一步提高面试率' })
  }

  // 生成综合评估总结
  let summary = ''
  if (overallScore >= 80) {
    summary = `简历整体质量优秀，综合评分${overallScore}分。在内容完整性、关键词匹配和语言表达方面表现突出。建议持续关注目标岗位的JD变化，针对性地调整简历重点，保持竞争力。`
  } else if (overallScore >= 60) {
    summary = `简历整体质量良好，综合评分${overallScore}分。具备基本的简历框架，但在部分维度仍有提升空间。建议重点关注量化成果和岗位匹配度的提升，根据下方建议逐项优化。`
  } else {
    summary = `简历综合评分${overallScore}分，存在较多可改进之处。建议从内容完整性入手，补充缺失的关键信息，然后逐项优化各模块的描述，使用STAR法则和量化数据来增强说服力。`
  }

  // 生成优化后的简历
  const optimizedResume: OptimizedResume = {
    name: String(data.name || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    targetPosition: String(data.targetPosition || ''),
    targetIndustry: String(data.targetIndustry || ''),
    education: education.map((e) => ({
      school: String(e.school || ''),
      degree: String(e.degree || ''),
      major: String(e.major || ''),
      time: [e.startDate, e.endDate].filter(Boolean).join(' - ') || '待补充',
    })),
    workExperience: workExp.map((w) => {
      const desc = String(w.description || '')
      const optimized = desc.length < 30
        ? `在${w.company || '公司'}担任${w.position || '岗位'}，负责相关业务工作，通过优化流程和提升效率，为团队创造了显著价值。（建议补充具体量化成果）`
        : desc
      return {
        company: String(w.company || ''),
        position: String(w.position || ''),
        time: [w.startDate, w.endDate].filter(Boolean).join(' - ') || '待补充',
        description: optimized,
      }
    }),
    projectExperience: projExp.map((p) => {
      const desc = String(p.description || '')
      const optimized = desc.length < 30
        ? `项目"${p.projectName || '未命名'}"中担任${p.role || '核心成员'}，负责项目关键模块的设计与开发，通过技术方案优化解决了核心问题，最终成功交付项目。（建议补充具体量化成果）`
        : desc
      return {
        name: String(p.projectName || ''),
        role: String(p.role || ''),
        description: optimized,
        techStack: String(p.techStack || ''),
      }
    }),
    skills: String(data.skills || ''),
    certifications: String(data.certifications || ''),
  }

  return {
    overallScore,
    summary,
    dimensions: [
      { label: '内容完整性', score: completeness, comment: dimComments['内容完整性'] },
      { label: '关键词匹配', score: keywordScore, comment: dimComments['关键词匹配'] },
      { label: '排版规范', score: layoutScore, comment: dimComments['排版规范'] },
      { label: '语言表达', score: expressScore, comment: dimComments['语言表达'] },
      { label: '量化成果', score: quantScore, comment: dimComments['量化成果'] },
      { label: '岗位匹配度', score: matchScore, comment: dimComments['岗位匹配度'] },
    ],
    suggestions: suggestions.slice(0, 8),
    optimizedResume,
    aiPowered: false,
  }
}

// ============ 面试评估 ============

export async function evaluateInterviewAnswer(
  question: string,
  answer: string,
  dimension: string,
  targetPosition: string,
  interviewType: string,
  aiOptions?: AIClientOptions,
): Promise<InterviewEvaluation> {
  if (!answer || answer.trim().length === 0) {
    return { score: 30, feedback: '回答内容为空，建议尝试作答，即使不完整也可以获得部分反馈。', highlights: [], improvements: ['尝试作答，不要留空', '先理清思路再回答'] }
  }

  // 尝试真实 AI
  if (isAIConfigured(aiOptions)) {
    try {
      const result = await chatJSON<InterviewEvaluation>([
      {
        role: 'system',
        content: `你是一位资深技术面试官。请评估以下面试回答，返回JSON格式：
{
  "score": 数字(0-100),
  "feedback": "综合评价（100字以内）",
  "highlights": ["亮点1", "亮点2"],
  "improvements": ["改进建议1", "改进建议2"]
}
评估维度：${dimension}
目标岗位：${targetPosition || '通用'}
面试类型：${interviewType === 'technical' ? '技术面' : interviewType === 'hr' ? 'HR面' : '通用'}
评估标准：技术准确性、表达清晰度、逻辑结构、回答深度、是否包含实例/量化数据`,
      },
      {
        role: 'user',
        content: `面试问题：${question}\n\n候选人回答：${answer}`,
      },
    ], aiOptions)
    if (result) return result
  } catch { /* 降级 */ }
  }

  return evaluateInterviewLocal(question, answer, dimension, targetPosition, interviewType)
}

function evaluateInterviewLocal(
  question: string,
  answer: string,
  dimension: string,
  targetPosition: string,
  interviewType: string,
): InterviewEvaluation {
  const answerLen = answer.length
  const hasStruct = hasStarKeywords(answer)
  const hasData = hasQuantifiedData(answer)

  let score = 50
  if (answerLen > 500) score += 15
  else if (answerLen > 300) score += 12
  else if (answerLen > 150) score += 8
  else if (answerLen > 80) score += 5
  else if (answerLen > 30) score += 2
  if (hasStruct) score += 10
  if (hasData) score += 8

  const dimensionKeywords: Record<string, string[]> = {
    'Java基础': ['JVM', 'GC', '多线程', '集合', 'HashMap', 'ArrayList', 'synchronized', 'volatile', '线程池'],
    '数据库': ['MySQL', '索引', 'B+Tree', '事务', 'SQL', 'Redis', '缓存', '分库分表', '慢查询'],
    '框架应用': ['Spring', 'Spring Boot', 'MyBatis', 'IOC', 'AOP', 'Bean', 'Controller'],
    '系统设计': ['架构', '高并发', '分布式', '微服务', '负载均衡', '熔断', '限流', 'CAP'],
    '算法': ['时间复杂度', '空间复杂度', '排序', '动态规划', 'DFS', 'BFS', '二叉树'],
    '项目经验': ['项目', '实现', '设计', '优化', '上线', '调研', '重构', '团队'],
  }
  const keywords = dimensionKeywords[dimension] || []
  const matchedKeywords = keywords.filter((k) => answer.toLowerCase().includes(k.toLowerCase()))
  score += matchedKeywords.length * 2
  if (interviewType === 'technical' && matchedKeywords.length >= 5) score += 5
  if (interviewType === 'hr' && answerLen > 200 && hasStruct) score += 5
  score = clamp(score, 40, 98)

  const highlights: string[] = []
  const improvements: string[] = []
  if (hasStruct) highlights.push('回答结构清晰，使用了STAR法则或类似结构')
  if (hasData) highlights.push('回答中包含了量化数据，增强了说服力')
  if (matchedKeywords.length >= 5) highlights.push(`对"${dimension}"领域的核心概念掌握扎实`)
  else if (matchedKeywords.length >= 3) highlights.push(`对"${dimension}"有一定了解，可以进一步深入`)
  else improvements.push(`建议在回答中多涉及"${dimension}"相关的核心概念和技术要点`)
  if (answerLen < 80) improvements.push('回答内容较短，建议展开论述')
  if (!hasStruct) improvements.push('建议使用更清晰的逻辑结构')
  if (!hasData) improvements.push('建议加入具体的量化数据或实例来支撑观点')
  if (highlights.length === 0) highlights.push('态度积极，敢于尝试作答')

  let feedback = ''
  if (score >= 85) feedback = `优秀！你对"${dimension}"的理解非常深入，回答结构清晰、内容充实。${pickRandom(['继续保持这个水平！', '建议在面试中多展示这样的深度思考。'])}`
  else if (score >= 70) feedback = `良好！整体回答质量不错。${pickRandom(['可以在技术深度上进一步展开。', '建议补充更多具体案例。'])}`
  else if (score >= 55) feedback = `一般。${pickRandom(['建议加强"${dimension}"方面的学习。', '回答方向正确但不够深入。'])}`
  else feedback = `需要加强。"${dimension}"是你的薄弱环节，建议先系统学习基础知识。`

  return { score, feedback, highlights, improvements }
}

// ============ 面试报告汇总 ============

export async function generateInterviewReport(
  answers: Array<{
    question: string
    answer: string
    score: number
    dimension: string
    highlights: string[]
    improvements: string[]
  }>,
  interviewType: string,
  targetPosition: string,
  aiOptions?: AIClientOptions,
): Promise<InterviewReport> {
  // 尝试真实 AI
  if (isAIConfigured(aiOptions)) {
    try {
      const result = await chatJSON<InterviewReport>([
        {
          role: 'system',
          content: `你是一位资深面试官和职业规划专家。请根据以下面试答题记录，生成一份全面的面试报告，返回JSON格式：

{
  "overallScore": 数字(0-100),
  "summary": "面试整体评价（150-300字），包括综合表现、核心优势、主要短板、提升方向",
  "dimensionScores": [
    {"dimension": "维度名称", "score": 数字}
  ],
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["不足1", "不足2", "不足3"],
  "suggestions": ["提升建议1", "提升建议2", "提升建议3", "提升建议4"]
}

要求：
- 综合评分基于各题得分和整体表现
- 维度评分按实际考察维度汇总
- 优势基于AI点评中的highlights提炼
- 不足基于AI点评中的improvements提炼
- 建议要具体、可执行，针对性强`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            interviewType,
            targetPosition,
            answers,
          }),
        },
      ], { ...aiOptions, maxTokens: 3000 })
      if (result) return result
    } catch { /* 降级 */ }
  }

  return generateInterviewReportLocal(answers, interviewType)
}

function generateInterviewReportLocal(
  answers: Array<{
    question: string
    answer: string
    score: number
    dimension: string
    highlights: string[]
    improvements: string[]
  }>,
  interviewType: string,
): InterviewReport {
  if (answers.length === 0) {
    return {
      overallScore: 0,
      summary: '暂无答题记录。',
      dimensionScores: [],
      strengths: [],
      weaknesses: [],
      suggestions: ['建议完成一次完整的模拟面试来获得评估报告。'],
    }
  }

  const overallScore = Math.round(answers.reduce((sum, a) => sum + a.score, 0) / answers.length)

  // 按维度汇总
  const dimMap = new Map<string, number[]>()
  answers.forEach((a) => {
    const dim = a.dimension || '综合'
    if (!dimMap.has(dim)) dimMap.set(dim, [])
    dimMap.get(dim)!.push(a.score)
  })
  const dimensionScores = Array.from(dimMap.entries()).map(([dimension, scores]) => ({
    dimension,
    score: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
  }))

  // 汇总优势和不足
  const allHighlights = answers.flatMap((a) => a.highlights || [])
  const allImprovements = answers.flatMap((a) => a.improvements || [])

  const strengths = [...new Set(allHighlights)].slice(0, 3)
  const weaknesses = [...new Set(allImprovements)].slice(0, 3)

  if (strengths.length === 0) {
    strengths.push('能够完成面试答题', '具备基本的表达能力', '对面试流程有一定了解')
  }
  if (weaknesses.length === 0) {
    weaknesses.push('部分回答深度不够', '建议使用STAR法则组织回答', '可增加量化数据和具体案例')
  }

  // 生成建议
  const suggestions: string[] = []
  if (overallScore < 60) {
    suggestions.push('建议针对薄弱维度进行系统学习，夯实基础知识')
    suggestions.push('每天进行至少一次模拟面试练习，提升回答熟练度')
    suggestions.push('阅读面试经验分享，了解常见面试题型和答题技巧')
  } else if (overallScore < 80) {
    suggestions.push('针对得分较低的维度进行专项提升训练')
    suggestions.push('在回答中多使用STAR法则（情境-任务-行动-结果）来组织内容')
    suggestions.push('多阅读行业技术博客和前沿论文，拓展知识面')
  } else {
    suggestions.push('继续保持当前水平，针对性地提升个别薄弱环节')
    suggestions.push('可以尝试更高级别的面试模拟，挑战更高难度的问题')
    suggestions.push('录制自己的回答并回听，注意语速和表达的流畅度')
  }
  suggestions.push('定期回顾面试记录，跟踪自己的进步和不足')

  const typeLabel = interviewType === 'technical' ? '技术面' : interviewType === 'hr' ? 'HR面' : '综合面'
  let summary = ''
  if (overallScore >= 85) {
    summary = `在本次${typeLabel}模拟面试中表现优秀，综合评分${overallScore}分。回答结构清晰，内容充实，展现了扎实的专业功底和良好的表达能力。建议继续保持，并针对性地挑战更高难度的问题。`
  } else if (overallScore >= 70) {
    summary = `在本次${typeLabel}模拟面试中表现良好，综合评分${overallScore}分。整体回答质量不错，但在部分维度还有提升空间。建议重点关注薄弱环节，通过专项练习来提升。`
  } else if (overallScore >= 55) {
    summary = `本次${typeLabel}模拟面试综合评分${overallScore}分，表现一般。部分回答方向正确但深度不够，建议加强相关维度的系统学习，并多做练习来提升回答质量。`
  } else {
    summary = `本次${typeLabel}模拟面试综合评分${overallScore}分，有较大的提升空间。建议从基础知识点入手，系统学习后再进行模拟练习，逐步提升面试能力。`
  }

  return { overallScore, summary, dimensionScores, strengths, weaknesses, suggestions }
}

// ============ 诊断评分 ============

export async function generateDiagnosisScores(
  answers: string[],
  questions: Array<{ dimension: string; question: string }>,
  dimensions: string[],
  aiOptions?: AIClientOptions,
): Promise<DiagnosisResult> {
  // 尝试真实 AI
  if (isAIConfigured(aiOptions)) {
    try {
      const qaText = questions.map((q, i) => `[${q.dimension}] ${q.question}\n回答：${answers[i] || '（未作答）'}`).join('\n\n')
      const result = await chatJSON<DiagnosisResult>([
      {
        role: 'system',
        content: `你是一位资深技术面试官和职业能力评估专家。请根据候选人对各维度问题的回答，评估其能力水平。
返回JSON格式：
{
  "totalScore": 数字(0-100),
  "dimensionScores": { "维度名": 数字 },
  "strengths": ["优势维度1"],
  "weaknesses": ["薄弱维度1"],
  "gapAnalysis": "综合分析（200字以内）"
}
评估维度：${dimensions.join('、')}
评分标准：根据回答的深度、准确性、结构化程度评分。60分以下为薄弱，75分以上为优势。`,
      },
      {
        role: 'user',
        content: qaText,
      },
    ], aiOptions)
    if (result) return result
  } catch { /* 降级 */ }
  }

  return generateDiagnosisScoresLocal(answers, questions, dimensions)
}

function generateDiagnosisScoresLocal(
  answers: string[],
  questions: Array<{ dimension: string; question: string }>,
  dimensions: string[],
): DiagnosisResult {
  const dimensionScores: Record<string, number> = {}

  dimensions.forEach((dim) => {
    const dimAnswers = questions
      .map((q, i) => ({ question: q.question, answer: answers[i] || '' }))
      .filter((_, i) => questions[i].dimension === dim)

    if (dimAnswers.length === 0) {
      dimensionScores[dim] = 60 + Math.floor(Math.random() * 20)
      return
    }

    let totalScore = 0
    dimAnswers.forEach((qa) => {
      const len = qa.answer.length
      let itemScore = 40
      if (len > 200) itemScore += 25
      else if (len > 100) itemScore += 20
      else if (len > 50) itemScore += 12
      else if (len > 20) itemScore += 5
      const qKeywords = qa.question.replace(/[？?，,。.、\s]/g, '').slice(0, 20)
      if (qKeywords.split('').some((ch) => qa.answer.includes(ch))) itemScore += 10
      if (hasStarKeywords(qa.answer)) itemScore += 10
      if (hasQuantifiedData(qa.answer)) itemScore += 8
      totalScore += clamp(itemScore, 30, 95)
    })
    dimensionScores[dim] = Math.round(totalScore / dimAnswers.length)
  })

  const totalScore = Math.round(
    Object.values(dimensionScores).reduce((sum, s) => sum + s, 0) / Object.values(dimensionScores).length,
  )
  const strengths = dimensions.filter((d) => dimensionScores[d] >= 75)
  const weaknesses = dimensions.filter((d) => dimensionScores[d] < 60)

  let gapAnalysis = ''
  if (weaknesses.length > 0) {
    gapAnalysis = `根据测试结果，你的薄弱维度主要集中在${weaknesses.join('、')}，这些领域的得分低于60分，建议优先补强。`
    if (strengths.length > 0) gapAnalysis += `优势维度${strengths.join('、')}表现突出，可以在面试中作为亮点展示。`
    gapAnalysis += `通过系统性的学习计划，预计可以在1-2个月内将综合评分提升10-15分。`
  } else if (strengths.length > 0) {
    gapAnalysis = `你的各项能力较为均衡，优势维度${strengths.join('、')}表现突出。建议继续深化优势领域，同时保持其他维度的训练。`
  } else {
    gapAnalysis = '你的各项能力较为均衡，建议继续保持并深化各个维度的训练。'
  }

  return { totalScore, dimensionScores, strengths, weaknesses, gapAnalysis }
}

// ============ 学习计划生成 ============

export async function generateLearningPlan(
  positionName: string,
  recruitmentType: string,
  weaknesses: string[],
  aiOptions?: AIClientOptions,
): Promise<LearningPlanResult> {
  // 尝试真实 AI
  if (isAIConfigured(aiOptions)) {
    try {
      const typeLabel = recruitmentType === 'fall' ? '秋招' : recruitmentType === 'spring' ? '春招' : '实习'
      const result = await chatJSON<LearningPlanResult>([
      {
        role: 'system',
        content: `你是一位资深的求职辅导专家。请根据用户的目标岗位和薄弱维度，生成一个${typeLabel}学习计划。
返回JSON格式：
{
  "stages": [
    {
      "title": "阶段名称",
      "description": "阶段描述",
      "duration": "约X周",
      "tasks": [
        {"id": "task_1", "dimension": "所属维度", "title": "任务标题", "description": "任务描述", "type": "learn|practice|project|review", "duration": "预计时间"}
      ]
    }
  ]
}
要求：
- 生成3个阶段，前两个阶段聚焦薄弱维度，最后一个阶段为面试冲刺
- 每个阶段3-5个任务
- 任务要具体可执行，有明确的类型和时间预估
- ${weaknesses.length > 0 ? `重点针对薄弱维度：${weaknesses.join('、')}` : '通用学习计划'}`,
      },
      {
        role: 'user',
        content: `目标岗位：${positionName}\n招聘类型：${typeLabel}\n薄弱维度：${weaknesses.length > 0 ? weaknesses.join('、') : '无特定薄弱项'}`,
      },
    ], aiOptions)
    if (result) return result
  } catch { /* 降级 */ }
  }

  return generateLearningPlanLocal(positionName, recruitmentType, weaknesses)
}

function generateLearningPlanLocal(
  positionName: string,
  recruitmentType: string,
  weaknesses: string[],
): LearningPlanResult {
  const weakTaskMap: Record<string, Array<{ id: string; dimension: string; title: string; description: string; type: string; duration: string }>> = {
    'Java基础': [
      { id: 'java_1', dimension: 'Java基础', title: '系统学习Java核心：JVM内存模型、GC算法、多线程编程', description: '深入理解JVM内存结构、垃圾回收算法、并发编程模型', type: 'learn', duration: '3天' },
      { id: 'java_2', dimension: 'Java基础', title: '完成Java基础专项练习题50道', description: '通过练习巩固Java核心概念', type: 'practice', duration: '2天' },
      { id: 'java_3', dimension: 'Java基础', title: '阅读《深入理解Java虚拟机》核心章节', description: '重点阅读内存管理、类加载、并发编程章节', type: 'learn', duration: '3天' },
    ],
    '数据库': [
      { id: 'db_1', dimension: '数据库', title: '深入理解MySQL索引原理和SQL优化', description: '学习B+Tree索引、EXPLAIN执行计划、慢查询优化', type: 'learn', duration: '2天' },
      { id: 'db_2', dimension: '数据库', title: '完成LeetCode数据库专项练习30道', description: '练习SQL编写和优化技巧', type: 'practice', duration: '2天' },
      { id: 'db_3', dimension: '数据库', title: '学习Redis数据结构与缓存策略', description: '掌握常用数据结构、缓存穿透/击穿/雪崩解决方案', type: 'learn', duration: '2天' },
    ],
    '框架应用': [
      { id: 'fw_1', dimension: '框架应用', title: '掌握Spring Boot/IOC/AOP核心原理', description: '理解依赖注入、面向切面编程的实现原理', type: 'learn', duration: '2天' },
      { id: 'fw_2', dimension: '框架应用', title: '阅读Spring源码关键模块', description: '重点阅读Bean生命周期、自动配置原理', type: 'learn', duration: '3天' },
      { id: 'fw_3', dimension: '框架应用', title: '完成一个基于Spring Boot的CRUD项目', description: '实践RESTful API设计、数据校验、异常处理', type: 'project', duration: '2天' },
    ],
    '系统设计': [
      { id: 'sys_1', dimension: '系统设计', title: '学习分布式系统设计原则和常见方案', description: '掌握CAP理论、一致性协议、微服务架构设计', type: 'learn', duration: '3天' },
      { id: 'sys_2', dimension: '系统设计', title: '完成5个系统设计案例分析', description: '分析短链接、秒杀、feed流、IM等经典系统设计', type: 'practice', duration: '3天' },
      { id: 'sys_3', dimension: '系统设计', title: '阅读《数据密集型应用系统设计》', description: '重点阅读数据模型、存储、分布式章节', type: 'learn', duration: '5天' },
    ],
    '算法': [
      { id: 'algo_1', dimension: '算法', title: '完成LeetCode Hot 100题目', description: '系统刷题，覆盖数组、链表、树、DP等核心题型', type: 'practice', duration: '7天' },
      { id: 'algo_2', dimension: '算法', title: '重点训练动态规划、二叉树、DFS/BFS', description: '针对高频题型进行专项训练', type: 'practice', duration: '3天' },
      { id: 'algo_3', dimension: '算法', title: '每日坚持刷题，保持手感', description: '每天至少刷3道题，保持算法思维', type: 'practice', duration: '持续' },
    ],
    '项目经验': [
      { id: 'proj_1', dimension: '项目经验', title: '复盘过往项目，整理技术亮点和难点', description: '梳理项目中的技术选型、架构设计、难点攻克', type: 'review', duration: '2天' },
      { id: 'proj_2', dimension: '项目经验', title: '准备1-2个高质量项目展示', description: '用STAR法则描述项目经历，准备技术深挖问题', type: 'review', duration: '2天' },
      { id: 'proj_3', dimension: '项目经验', title: '练习用STAR法则描述项目经历', description: '模拟面试场景，练习项目介绍和技术问答', type: 'practice', duration: '1天' },
    ],
  }

  const weakTasks: Array<{ id: string; dimension: string; title: string; description: string; type: string; duration: string }> = []
  weaknesses.forEach((dim) => {
    const tasks = weakTaskMap[dim] || [
      { id: `gen_${dim}_1`, dimension: dim, title: `系统学习${dim}相关核心知识`, description: `掌握${dim}的核心概念和常见面试题`, type: 'learn', duration: '2天' },
      { id: `gen_${dim}_2`, dimension: dim, title: `完成${dim}专项练习`, description: `通过练习巩固${dim}知识点`, type: 'practice', duration: '2天' },
      { id: `gen_${dim}_3`, dimension: dim, title: `整理${dim}常见面试题`, description: `收集并整理${dim}方向的高频面试题`, type: 'review', duration: '1天' },
    ]
    weakTasks.push(...tasks)
  })

  const isFall = recruitmentType === 'fall'
  const isSpring = recruitmentType === 'spring'

  if (isFall) {
    return {
      stages: [
        { title: '基础补强', description: '系统学习核心知识点，补齐技术短板', duration: '约3-4周', tasks: weaknesses.length > 0 ? weakTasks.slice(0, 4) : [{ id: 'base_1', dimension: '通用', title: '完成薄弱维度的核心知识点系统学习', description: '系统学习基础知识', type: 'learn', duration: '1周' }, { id: 'base_2', dimension: '通用', title: '刷题100+', description: '完成100道以上算法和基础题', type: 'practice', duration: '1周' }, { id: 'base_3', dimension: '通用', title: '整理面试常见八股文', description: '整理高频面试题', type: 'review', duration: '3天' }] },
        { title: '专项提升', description: '深入训练核心技能，进行项目实战和模拟笔试', duration: '约3-4周', tasks: weaknesses.length > 0 ? [...weakTasks.slice(4, 7), { id: 'mock_1', dimension: '通用', title: '进行秋招模拟笔试5次以上', description: '全真模拟笔试', type: 'practice', duration: '持续' }] : [{ id: 'adv_1', dimension: '通用', title: '完成2个高质量项目实战', description: '实践项目', type: 'project', duration: '1周' }, { id: 'adv_2', dimension: '通用', title: '进行秋招模拟笔试5次以上', description: '模拟笔试', type: 'practice', duration: '持续' }, { id: 'adv_3', dimension: '通用', title: '深入学习目标公司的技术栈', description: '研究目标公司技术', type: 'learn', duration: '3天' }] },
        { title: '面试冲刺', description: '集中面试模拟训练，备战秋招正式面试', duration: '约2-3周', tasks: [{ id: 'final_1', dimension: '通用', title: '进行10次以上模拟面试练习', description: '高强度模拟面试', type: 'practice', duration: '持续' }, { id: 'final_2', dimension: '通用', title: '参加各公司提前批面试', description: '实战面试积累经验', type: 'practice', duration: '持续' }, { id: 'final_3', dimension: '通用', title: '持续优化简历和自我介绍', description: '不断迭代优化', type: 'review', duration: '持续' }] },
      ],
    }
  }

  if (isSpring) {
    return {
      stages: [
        { title: '快速诊断', description: '快速评估当前水平，明确差距和优先级', duration: '约1周', tasks: [{ id: 'sp_1', dimension: '通用', title: '完成薄弱维度诊断', description: '评估当前能力水平', type: 'review', duration: '1天' }, { id: 'sp_2', dimension: '通用', title: '制定针对性学习计划', description: '根据诊断结果制定计划', type: 'learn', duration: '1天' }, { id: 'sp_3', dimension: '通用', title: '整理目标公司春招岗位信息', description: '收集春招信息', type: 'review', duration: '1天' }] },
        { title: '精准补强', description: '针对薄弱环节集中突破', duration: '约2-3周', tasks: weaknesses.length > 0 ? weakTasks.slice(0, 5) : [{ id: 'sp2_1', dimension: '通用', title: '集中攻克薄弱维度的核心知识点', description: '针对性学习', type: 'learn', duration: '1周' }, { id: 'sp2_2', dimension: '通用', title: '重点刷目标公司常考题目', description: '刷目标公司题', type: 'practice', duration: '1周' }, { id: 'sp2_3', dimension: '通用', title: '准备2-3个拿得出手的项目经历', description: '准备项目', type: 'review', duration: '3天' }] },
        { title: '面试冲刺', description: '密集面试训练，快速提升面试表现', duration: '约1-2周', tasks: [{ id: 'sp3_1', dimension: '通用', title: '进行5次以上高强度模拟面试', description: '模拟面试', type: 'practice', duration: '持续' }, { id: 'sp3_2', dimension: '通用', title: '整理春招面试高频问题', description: '高频题整理', type: 'review', duration: '2天' }, { id: 'sp3_3', dimension: '通用', title: '投递简历并跟进面试反馈', description: '实战投递', type: 'practice', duration: '持续' }] },
      ],
    }
  }

  return {
    stages: [
      { title: '基础夯实', description: '扎实掌握核心基础知识', duration: '约2-3周', tasks: weaknesses.length > 0 ? weakTasks.slice(0, 4) : [{ id: 'in_1', dimension: '通用', title: '系统学习目标岗位的核心技术栈', description: '系统学习', type: 'learn', duration: '1周' }, { id: 'in_2', dimension: '通用', title: '完成基础练习题50道', description: '基础练习', type: 'practice', duration: '3天' }, { id: 'in_3', dimension: '通用', title: '了解目标公司的技术体系', description: '研究目标公司', type: 'learn', duration: '2天' }] },
      { title: '项目实战', description: '通过实际项目练习，提升动手能力', duration: '约2-3周', tasks: [{ id: 'in2_1', dimension: '通用', title: '完成1-2个个人项目或课程项目', description: '项目实战', type: 'project', duration: '1周' }, { id: 'in2_2', dimension: '通用', title: '学习Git协作和代码规范', description: '工程规范', type: 'learn', duration: '3天' }, { id: 'in2_3', dimension: '通用', title: '参与开源项目贡献代码', description: '开源贡献', type: 'project', duration: '持续' }] },
      { title: '面试准备', description: '准备实习面试，展示学习能力和潜力', duration: '约1-2周', tasks: [{ id: 'in3_1', dimension: '通用', title: '进行3-5次模拟面试练习', description: '模拟面试', type: 'practice', duration: '持续' }, { id: 'in3_2', dimension: '通用', title: '准备好自我介绍和项目介绍', description: '自我介绍准备', type: 'review', duration: '2天' }, { id: 'in3_3', dimension: '通用', title: '了解实习面试常见问题和技巧', description: '面试技巧', type: 'learn', duration: '1天' }] },
    ],
  }
}

// ============ 刷题解析 ============

export async function generateQuizAnalysis(
  question: string,
  options: string[],
  correctAnswer: number[],
  userAnswer: number[],
  isCorrect: boolean,
  knowledgePoint: string,
  aiOptions?: AIClientOptions,
): Promise<string> {
  // 尝试真实 AI
  if (isAIConfigured(aiOptions)) {
    try {
      const correctLabel = options.length > 0 ? correctAnswer.map((i) => String.fromCharCode(65 + i)).join('、') : ''
      const userLabel = options.length > 0 && userAnswer.length > 0 ? userAnswer.map((i) => String.fromCharCode(65 + i)).join('、') : ''

      const text = await chat([
      {
        role: 'system',
        content: `你是一位专业的笔试题解析导师。请为以下题目生成详细的解析，包括：
1. 考点分析
2. 解题思路
3. ${isCorrect ? '知识点巩固建议' : '错误原因分析和正确解法'}
4. 相关知识点扩展
请用中文回答，控制在200字以内。`,
      },
      {
        role: 'user',
        content: `题目：${question}
${options.length > 0 ? `选项：${options.map((o, i) => String.fromCharCode(65 + i) + '. ' + o).join('\n')}` : ''}
正确答案：${correctLabel}
用户答案：${userLabel || '（未作答）'}
答题结果：${isCorrect ? '正确' : '错误'}
知识点：${knowledgePoint}`,
      },
    ], aiOptions)
    if (text) return text
  } catch { /* 降级 */ }
  }

  return generateQuizAnalysisLocal(question, options, correctAnswer, userAnswer, isCorrect, knowledgePoint)
}

// ============ 简历文本解析 ============

export interface ParsedResumeData {
  name: string
  email: string
  phone: string
  targetPosition: string
  targetIndustry: string
  education: Array<{ school: string; degree: string; major: string; startDate: string; endDate: string }>
  workExperience: Array<{ company: string; position: string; startDate: string; endDate: string; description: string }>
  projectExperience: Array<{ projectName: string; role: string; description: string; techStack: string }>
  skills: string
  certifications: string
}

export async function parseResumeText(resumeText: string, aiOptions?: AIClientOptions): Promise<ParsedResumeData> {
  // 尝试真实 AI
  if (isAIConfigured(aiOptions)) {
    try {
      const result = await chatJSON<ParsedResumeData>([
        {
          role: 'system',
          content: `你是一位专业的简历解析专家。请从以下简历文本中提取结构化信息，返回JSON格式。

返回格式：
{
  "name": "姓名",
  "email": "邮箱地址",
  "phone": "手机号码",
  "targetPosition": "求职意向/目标岗位",
  "targetIndustry": "目标行业",
  "education": [
    {"school": "学校名称", "degree": "学历（本科/硕士/博士）", "major": "专业", "startDate": "开始时间(YYYY-MM)", "endDate": "结束时间(YYYY-MM)"}
  ],
  "workExperience": [
    {"company": "公司名称", "position": "职位", "startDate": "开始时间(YYYY-MM)", "endDate": "结束时间(YYYY-MM)", "description": "工作描述"}
  ],
  "projectExperience": [
    {"projectName": "项目名称", "role": "担任角色", "description": "项目描述", "techStack": "技术栈"}
  ],
  "skills": "技能列表（用逗号分隔）",
  "certifications": "证书/资质（用逗号分隔）"
}

提取规则：
- 如果简历中某项信息缺失，对应字段设为空字符串或空数组
- 教育经历按时间倒序排列
- 工作经历和项目经历按时间倒序
- 自动识别常见的日期格式（如2024.06-2024.09、2024年6月-9月等），统一转为YYYY-MM格式
- 技能部分提取所有技术关键词，用逗号分隔`,
        },
        {
          role: 'user',
          content: resumeText,
        },
      ], { ...aiOptions, temperature: 0.3, maxTokens: 3000 })
      if (result) return result
    } catch { /* 降级到规则引擎 */ }
  }

  return parseResumeTextLocal(resumeText)
}

function parseResumeTextLocal(text: string): ParsedResumeData {
  // 统一换行符
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const result: ParsedResumeData = {
    name: '',
    email: '',
    phone: '',
    targetPosition: '',
    targetIndustry: '',
    education: [],
    workExperience: [],
    projectExperience: [],
    skills: '',
    certifications: '',
  }

  const lines = normalizedText.split('\n').map((l) => l.trim()).filter(Boolean)

  // 提取姓名（第一行非空内容，通常是名字）
  const nameCandidates = lines.filter((l) => /^[\u4e00-\u9fa5]{2,4}$/.test(l) && !/公司|大学|学院|项目|经历|技能|证书|实习|工作|教育|求职|联系|邮箱|电话|手机|自我|评价|个人|性别|年龄|出生|民族|政治|籍贯|地址/.test(l))
  if (nameCandidates.length > 0) {
    result.name = nameCandidates[0]
  }

  // 提取邮箱
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) result.email = emailMatch[0]

  // 提取手机号
  const phoneMatch = text.match(/1[3-9]\d{9}/)
  if (phoneMatch) result.phone = phoneMatch[0]

  // 提取求职意向（支持 | 分隔符，如 "求职意向：产品经理实习生 | 到岗时间：随时到岗"）
  const targetMatch = text.match(/求职意向[：:]\s*(.+?)(?:\n|$)/)
  if (targetMatch) {
    const parts = targetMatch[1].split('|')
    result.targetPosition = parts[0].trim()
  } else {
    const posMatch = text.match(/目标岗位[：:]\s*(.+?)(?:\n|$)/)
    if (posMatch) result.targetPosition = posMatch[1].trim()
  }

  // 提取教育经历（支持 | 分隔符和内联格式）
  const eduSection = extractSection(text, ['教育经历', '教育背景', '学习经历'])
  if (eduSection) {
    const eduLines = eduSection.split('\n').filter(Boolean)
    for (const line of eduLines) {
      // 跳过不相关的行（联系方式、邮箱、电话等）
      if (/^(教育经历|教育背景|学习经历)[：:]?\s*$/.test(line.trim())) continue
      if (/联系方式|邮箱|电话|手机|地址|微信|QQ|生日|性别|年龄|出生|民族|政治|籍贯/.test(line)) continue

      // 支持 | 分隔符（如 "首都经济贸易大学 | 信息管理与信息系统 | 本科大三 (2023.09-2027.7)"）
      let parts = line.split('|').map((p) => p.trim()).filter(Boolean)
      if (parts.length < 2) {
        parts = line.split(/[\s]{2,}|\t+/).map((p) => p.trim()).filter(Boolean)
      }

      let school = ''
      let degree = ''
      let major = ''
      let startDate = ''
      let endDate = ''

      for (const part of parts) {
        const dateInPart = part.match(/(\d{4}[.\-/年]\d{1,2})[.\-/月至]*\s*[-~至到]\s*(\d{4}[.\-/年]\d{1,2}|至今|现在)/)
        if (dateInPart) {
          startDate = normalizeDate(dateInPart[1])
          endDate = normalizeDate(dateInPart[2])
          const beforeDate = part.slice(0, dateInPart.index).trim()
          if (beforeDate && !major) major = beforeDate
          if (beforeDate && !degree && /本科|硕士|博士|大专|学士|研究生|MBA|EMBA|大三|大四|大一|大二/.test(beforeDate)) degree = beforeDate
        } else if (!school && /大学|学院|学校/.test(part)) {
          school = part
        } else if (!degree && /本科|硕士|博士|大专|学士|研究生|MBA|EMBA|大三|大四|大一|大二/.test(part)) {
          degree = part
        } else if (!major && /[\u4e00-\u9fa5]{2,}/.test(part) && !/GPA|成绩|时间|日期/.test(part)) {
          major = part
        }
      }

      // 单独提取日期
      const dateMatch = line.match(/(\d{4}[.\-/年]\d{1,2})[.\-/月至]*\s*[-~至到]\s*(\d{4}[.\-/年]\d{1,2}|至今|现在)/)
      if (dateMatch && !startDate) {
        startDate = normalizeDate(dateMatch[1])
        endDate = normalizeDate(dateMatch[2])
      }

      if (school || degree || major) {
        result.education.push({ school, degree, major, startDate, endDate })
      }
    }
  }

  // 提取实习/工作经历
  const workSection = extractSection(text, ['工作经历', '实习经历', '工作经验', '实习经验', '工作履历'])
  if (workSection) {
    result.workExperience = parseWorkExperience(workSection)
  }

  // 提取项目经历（如果没有则尝试校园经历）
  let projSection = extractSection(text, ['项目经历', '项目经验'])
  if (!projSection) {
    projSection = extractSection(text, ['校园经历', '在校经历', '社团经历', '组织经历'])
  }
  if (projSection) {
    result.projectExperience = parseProjectExperience(projSection)
  }

  // 提取技能
  const skillSection = extractSection(text, ['专业技能', '技能', '技术栈', '掌握技能', '个人优势'])
  if (skillSection) {
    result.skills = skillSection.replace(/\n/g, '，').replace(/\s+/g, ' ').trim()
  } else {
    // 尝试从全文提取技能关键词
    const techPatterns = [
      'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'C\\+\\+', 'C#', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
      'Spring', 'Spring Boot', 'MyBatis', 'Hibernate', 'Django', 'Flask', 'FastAPI', 'Express', 'Koa', 'Nest',
      'React', 'Vue', 'Angular', 'Next\\.js', 'Nuxt', 'Svelte', 'jQuery',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Oracle', 'SQL Server',
      'Docker', 'Kubernetes', 'K8s', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Nginx', 'Apache',
      'Linux', 'Shell', 'Bash', 'AWS', 'Azure', '阿里云', '腾讯云', '华为云',
      'Git', 'SVN', 'Maven', 'Gradle', 'Webpack', 'Vite', 'Babel', 'ESLint',
      '微服务', '分布式', '高并发', '大数据', '机器学习', '深度学习', 'NLP', 'CV',
      'HTML', 'CSS', 'Sass', 'Less', 'Tailwind', 'Bootstrap', 'Element', 'Ant Design',
      // 产品经理相关
      'Axure', 'Xmind', 'Visio', 'Figma', 'Sketch', '墨刀', '蓝湖', '摹客',
      'PRD', 'MRD', 'BRD', 'SOP', 'SLA', 'SQL', 'Excel', 'PPT', 'PS', '剪映',
      '用户画像', '用户调研', '竞品分析', '数据分析', 'A/B测试', '漏斗分析',
      '需求分析', '产品设计', '原型设计', '交互设计', '信息架构',
    ]
    const found = techPatterns.filter((p) => new RegExp(p, 'i').test(text))
    if (found.length > 0) {
      result.skills = found.join(', ')
    }
  }

  // 提取证书
  const certSection = extractSection(text, ['证书', '资质', '资格证书', '证书资质', '荣誉证书'])
  if (certSection) {
    result.certifications = certSection.replace(/\n/g, '，').replace(/\s+/g, ' ').trim()
  } else {
    // 尝试从全文提取常见证书
    const certPatterns = [
      'CET-[46]', '大学英语[四六]级', 'TEM-[48]', '雅思', '托福', 'GRE', 'GMAT',
      '软考', 'PMP', 'CPA', 'CFA', 'FRM', 'ACCA', '律师资格', '教师资格',
      '计算机[一二三四]级', '全国计算机等级', 'NCRE',
      'AWS Certified', 'Azure Certified', 'Google Cloud', 'CKA', 'CKAD', 'RHCE', 'RHCSA',
      '证券从业', '基金从业', '银行从业', '期货从业',
    ]
    const found = certPatterns.filter((p) => new RegExp(p, 'i').test(text))
    if (found.length > 0) {
      result.certifications = found.join(', ')
    }
  }

  return result
}

/** 将章节文本拆分为多个条目（优先按空行拆分，其次按日期行拆分） */
function splitEntries(text: string): string[] {
  // 策略1：按空行（连续两个换行）拆分
  const doubleNewlineParts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  if (doubleNewlineParts.length > 1) {
    // 合并被过度拆分的条目（如果某部分以列表符号开头，合并到前一个条目）
    const merged: string[] = []
    for (const part of doubleNewlineParts) {
      if (/^[-•·●○◆◇▪▸▹►▻\d+.]/.test(part) && merged.length > 0) {
        merged[merged.length - 1] += '\n' + part
      } else {
        merged.push(part)
      }
    }
    if (merged.length > 1) return merged
  }

  // 策略2：按日期行拆分（以 YYYY.MM 或 YYYY-MM 或 YYYY年 开头的行）
  const lines = text.split('\n')
  const dateLineIndices: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (/\d{4}[.\-/年]\d{1,2}/.test(lines[i])) {
      dateLineIndices.push(i)
    }
  }
  if (dateLineIndices.length > 1) {
    const entries: string[] = []
    for (let j = 0; j < dateLineIndices.length; j++) {
      const start = dateLineIndices[j]
      const end = j + 1 < dateLineIndices.length ? dateLineIndices[j + 1] : lines.length
      const entry = lines.slice(start, end).join('\n').trim()
      if (entry) entries.push(entry)
    }
    if (entries.length > 1) return entries
  }

  return [text]
}

/** 从字符串中提取日期范围 */
function extractDateRange(text: string): { startDate: string; endDate: string; matchStr: string } | null {
  const patterns = [
    /(\d{4}[.\-/年]\d{1,2})[.\-/月至日号]*\s*[-~至到]\s*(\d{4}[.\-/年]\d{1,2}|至今|现在)/,
    /(\d{4}[.\-/年]\d{1,2})[.\-/月至日号]*\s*[-~至到]\s*(至今|现在)/,
    /(\d{4}[.\-/年]\d{1,2})[.\-/月至日号]*/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      return {
        startDate: normalizeDate(m[1]),
        endDate: m[2] ? normalizeDate(m[2]) : '',
        matchStr: m[0],
      }
    }
  }
  return null
}

/** 解析实习/工作经历条目 */
function parseWorkExperience(text: string): ParsedResumeData['workExperience'] {
  const result: ParsedResumeData['workExperience'] = []
  const entries = splitEntries(text)

  for (const entry of entries) {
    const lines = entry.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    // 第一行通常包含：公司名、职位、日期（用空格/tab分隔）
    const firstLine = lines[0]
    const dateInfo = extractDateRange(firstLine)
    let firstLineClean = firstLine
    if (dateInfo) firstLineClean = firstLine.replace(dateInfo.matchStr, '').trim()

    // 按 | 或连续空白（2个以上空格或tab）拆分
    const parts = firstLineClean.split(/\s*\|\s*|\s{2,}|\t+/).map((p) => p.trim()).filter(Boolean)

    // 公司名后缀识别
    const companySuffixes = '(?:有限公司|有限责任公司|股份有限公司|公司|集团|科技|网络|软件|信息|数据|互联|金融|银行|证券|保险|基金|投资|咨询|传媒|文化|教育|医疗|医药|汽车|能源|制造|通信|电子|地产|物业|物流|餐饮|酒店|旅游|事务所|实验室|研究院|中心|工作室|律所|会计|审计|设计|广告|贸易|电商|零售|快递|航空|铁路|招聘|培训|留学|移民|旅游|食品|饮料|农业|建筑|装饰|安保|环保|环卫|绿化|物业|速运|货运|港口|机场|高速|地铁|公交|出租|共享|外卖|团购|点评|猎头|票务|民宿|餐饮|烟草|茶业|咖啡|乳业|肉类|水产|蔬菜|水果|花卉|苗木|种子|农药|化肥|饲料|兽药|农机|农具|农膜|农资|工厂|农场|养殖|种植|公关|会展|翻译|评估|拍卖|典当|租赁|担保|信托|期货|外汇|支付|征信|评级|认证|检测|测绘|勘察|监理|造价|招标|代理|经纪|商贸|进出口|批发|连锁|超市|商场|百货|母婴|美妆|服饰|家纺|家居|建材|五金|机电|化工|塑料|橡胶|玻璃|陶瓷|水泥|钢材|煤炭|石油|天然气|电力|水利|消防|救援|单车)'

    let company = ''
    let position = ''

    for (const part of parts) {
      if (!company && new RegExp(`[\\u4e00-\u9fa5]{2,}${companySuffixes}`).test(part)) {
        company = part
      } else if (!position) {
        const posPattern = /(?:工程师|实习生|经理|主管|专员|总监|开发|测试|运维|产品|设计|运营|前端|后端|算法|架构|分析师|助理|顾问|编辑|策划|销售|市场|客服|行政|财务|人力|法务|采购|质检|研发|研究员|架构师|培训生|管培生|见习生|负责人|成员|组长|队长)/
        if (posPattern.test(part)) {
          position = part
        }
      }
    }

    // 如果没识别到公司，取第一个非职位部分
    if (!company && parts.length > 0) {
      for (const part of parts) {
        if (part !== position) { company = part; break }
      }
    }

    // 如果没识别到职位，尝试从整行匹配
    if (!position) {
      const posMatch = firstLine.match(/([\u4e00-\u9fa5]{2,}(?:工程师|实习生|经理|主管|专员|总监|开发|测试|运维|产品|设计|运营|前端|后端|算法|架构|分析师|助理|顾问|编辑|策划|销售|市场|客服|行政|财务|人力|法务|采购|质检|研发|研究员|架构师|培训生|管培生|见习生))/)
      if (posMatch) position = posMatch[1]
    }

    // 描述：第一行之后的所有行
    const descLines = lines.slice(1)
      .map((l) => l.replace(/^[-•·●○◆◇▪▸▹►▻\-\–\—\*]\s*/, '').trim())
      .filter(Boolean)
    const description = descLines.join('\n')

    if (company || position || description) {
      result.push({
        company,
        position,
        startDate: dateInfo?.startDate || '',
        endDate: dateInfo?.endDate || '',
        description: description.slice(0, 500),
      })
    }
  }

  return result
}

/** 解析项目经历条目 */
function parseProjectExperience(text: string): ParsedResumeData['projectExperience'] {
  const result: ParsedResumeData['projectExperience'] = []
  const entries = splitEntries(text)

  for (const entry of entries) {
    const lines = entry.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    // 第一行：项目名、角色、日期
    const firstLine = lines[0]
    const dateInfo = extractDateRange(firstLine)
    let firstLineClean = firstLine
    if (dateInfo) firstLineClean = firstLine.replace(dateInfo.matchStr, '').trim()

    const parts = firstLineClean.split(/\s*\|\s*|\s{2,}|\t+/).map((p) => p.trim()).filter(Boolean)

    let projectName = ''
    let role = ''

    const projNamePattern = /(?:系统|平台|项目|应用|网站|工具|App|APP|小程序|服务|引擎|框架|组件|模块|方案|助手|管家|后台|中台|前台|客户端)/
    for (const part of parts) {
      if (!projectName && projNamePattern.test(part)) {
        projectName = part
      } else if (!role) {
        const rolePattern = /(?:开发|工程师|负责人|成员|组长|队长|设计|前端|后端|全栈|架构|测试|运维|产品|运营|算法)/
        if (rolePattern.test(part)) {
          role = part
        }
      }
    }

    // 如果没识别到项目名，取第一个非角色部分
    if (!projectName && parts.length > 0) {
      for (const part of parts) {
        if (part !== role) { projectName = part; break }
      }
    }

    // 如果还没识别到角色，尝试从整行匹配
    if (!role) {
      const roleMatch = firstLine.match(/([\u4e00-\u9fa5]+(?:开发|工程师|负责人|成员|组长|队长|前端|后端|全栈|架构))/)
      if (roleMatch) role = roleMatch[1]
    }

    // 提取技术栈（通常在第二行或独立一行）
    let techStack = ''
    let descStartIndex = 1
    for (let i = 1; i < lines.length; i++) {
      const techMatch = lines[i].match(/(?:技术栈|技术|使用技术|工具|技术选型)[：:]\s*(.+)/)
      if (techMatch) {
        techStack = techMatch[1].trim()
        descStartIndex = i + 1
        break
      }
      // 也检查是否整行都是技术关键词
      if (/^[\u4e00-\u9fa5\w\s,，、+.#()]+$/.test(lines[i]) &&
          /(?:React|Vue|Angular|Spring|Django|Flask|Node|TypeScript|JavaScript|Python|Java|Go|Rust|MySQL|Redis|MongoDB|Docker|Kubernetes|Nginx|AWS|Azure|Webpack|Vite|Git)/i.test(lines[i]) &&
          !/^[-•·●○]/.test(lines[i])) {
        techStack = lines[i]
        descStartIndex = i + 1
        break
      }
    }

    // 描述：剩余行
    const descLines = lines.slice(descStartIndex)
      .map((l) => l.replace(/^[-•·●○◆◇▪▸▹►▻\-\–\—\*]\s*/, '').trim())
      .filter(Boolean)
    const description = descLines.join('\n')

    if (projectName || description) {
      result.push({
        projectName,
        role,
        description: description.slice(0, 500),
        techStack,
      })
    }
  }

  return result
}

/** 所有可能的简历章节标题（按长度降序排列，避免短标题误匹配） */
const ALL_SECTION_HEADERS = [
  '教育经历', '教育背景', '学习经历',
  '工作经历', '实习经历', '工作经验', '实习经验', '工作履历',
  '项目经历', '项目经验',
  '专业技能', '技术栈', '掌握技能',
  '资格证书', '证书资质', '荣誉证书', '语言能力',
  '自我评价', '个人总结', '个人简介', '个人优势',
  '在校经历', '校园经历', '社团经历', '组织经历',
  '求职意向', '联系方式',
  '技能', '证书', '资质', '项目',
]

/** 提取简历中某个章节的内容（行号定位法，避免正则 multiline 问题） */
function extractSection(text: string, headers: string[]): string | null {
  // 统一换行符
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalizedText.split('\n')

  // 为每个章节标题构建匹配器（支持无括号和【】括号两种格式）
  const headerPatterns: { header: string; regex: RegExp }[] = []
  for (const h of ALL_SECTION_HEADERS) {
    const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // 匹配：标题、标题：、【标题】、标题 四种格式（独占一行）
    headerPatterns.push({
      header: h,
      regex: new RegExp(`^\\s*(?:【${escaped}】|${escaped})\\s*[：:]?\\s*$`),
    })
  }

  for (const targetHeader of headers) {
    const targetPattern = headerPatterns.find((p) => p.header === targetHeader)
    if (!targetPattern) continue

    // 找到目标章节标题所在行
    let startLine = -1
    let inlineContent = ''
    for (let i = 0; i < lines.length; i++) {
      if (targetPattern.regex.test(lines[i])) {
        startLine = i + 1 // 内容从下一行开始
        break
      }
      // 也检查内联格式：标题后跟内容（如 "教育背景：首都经济贸易大学..."）
      const escaped = targetHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const inlineMatch = lines[i].match(new RegExp(`^\\s*(?:【${escaped}】|${escaped})\\s*[：:]\\s*(.+)$`))
      if (inlineMatch) {
        inlineContent = inlineMatch[1].trim()
        startLine = i + 1
        break
      }
    }
    if (startLine < 0) continue

    // 找到下一个章节标题所在行作为结束位置
    let endLine = lines.length
    for (let i = startLine; i < lines.length; i++) {
      const isHeader = headerPatterns.some((p) => {
        if (p.header === targetHeader) return false
        return p.regex.test(lines[i])
      })
      if (isHeader) {
        endLine = i
        break
      }
    }

    let sectionText = lines.slice(startLine, endLine).join('\n').trim()
    // 如果有内联内容，拼接到前面
    if (inlineContent) {
      sectionText = inlineContent + '\n' + sectionText
    }
    sectionText = sectionText.trim()
    if (sectionText) return sectionText
  }
  return null
}

/** 统一日期格式为 YYYY-MM */
function normalizeDate(dateStr: string): string {
  if (!dateStr || dateStr === '至今' || dateStr === '现在') return dateStr
  const cleaned = dateStr.replace(/[年月]/g, '-').replace(/[.\/]/g, '-').replace(/[日号]/g, '')
  const parts = cleaned.split('-')
  if (parts.length >= 2) {
    const year = parts[0].trim()
    const month = parts[1].trim().padStart(2, '0')
    return `${year}-${month}`
  }
  return dateStr
}

function generateQuizAnalysisLocal(
  question: string,
  options: string[],
  correctAnswer: number[],
  userAnswer: number[],
  isCorrect: boolean,
  knowledgePoint: string,
): string {
  if (isCorrect) {
    const correctResponses = [
      `回答正确！这道题考察的是"${knowledgePoint}"。${options.length > 0 ? `正确答案是${correctAnswer.map((i) => String.fromCharCode(65 + i)).join('、')}，你的理解很到位。` : ''}建议回顾一下相关知识点，确保理解背后的原理。`,
      `很好！你对"${knowledgePoint}"的掌握很扎实。${options.length > 0 ? `选项${correctAnswer.map((i) => String.fromCharCode(65 + i)).join('、')}是正确答案。` : ''}可以尝试向他人解释这道题的解题思路。`,
      `正确！"${knowledgePoint}"是面试中的高频考点。${options.length > 0 ? `你正确选择了${correctAnswer.map((i) => String.fromCharCode(65 + i)).join('、')}。` : ''}建议查阅相关文档，深入了解底层实现原理。`,
    ]
    return pickRandom(correctResponses)
  }

  const correctLabel = options.length > 0 ? correctAnswer.map((i) => String.fromCharCode(65 + i)).join('、') : ''
  const userLabel = options.length > 0 && userAnswer.length > 0 ? userAnswer.map((i) => String.fromCharCode(65 + i)).join('、') : ''

  const wrongResponses = [
    `这道题考察的是"${knowledgePoint}"。${correctLabel ? `正确答案是${correctLabel}，你选择了${userLabel || '（未选）'}。` : ''}建议回到"${knowledgePoint}"的基础知识，重新梳理概念。`,
    `本题考点是"${knowledgePoint}"。${correctLabel ? `正确选项是${correctLabel}。` : ''}常见错误原因是对"${knowledgePoint}"的理解不够深入。建议先理解核心概念的定义，再通过做同类型题目来巩固。`,
    `这道"${knowledgePoint}"相关的题目你做错了。${correctLabel ? `正确答案是${correctLabel}。` : ''}这类题目在笔面试中经常出现，建议把"${knowledgePoint}"作为重点复习内容。`,
  ]
  return pickRandom(wrongResponses)
}

// ============ AI 生成行测题 ============

export interface GeneratedAptitudeQuestion {
  type: 'choice' | 'multi'
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  answer: number[]
  analysis: string
  knowledgePoint: string
}

export async function generateAptitudeQuestions(
  category: string,
  count: number,
  difficulty: string,
  aiOptions?: AIClientOptions,
): Promise<GeneratedAptitudeQuestion[] | null> {
  if (!isAIConfigured(aiOptions)) {
    console.log('[AI generateAptitudeQuestions] AI 未配置，无法生成题目')
    return null
  }

  const standardCategories = ['言语理解', '数量关系', '判断推理', '资料分析', '常识判断']
  const isStandardCategory = standardCategories.includes(category) || category === 'all'
  const targetCategory = category && category !== 'all' ? category : standardCategories.join('、')
  const targetCount = Math.min(count, 20)

  console.log(`[AI generateAptitudeQuestions] 生成 ${targetCount} 道题，分类：${targetCategory}，难度：${difficulty}`)

  // 维度映射：将弱项维度映射到合适的题目类型
  const dimensionPromptMap: Record<string, string> = {
    '技术能力': '技术基础知识、编程语言特性、框架原理、数据结构与算法、系统设计等IT技术类选择题',
    '沟通表达': '职场沟通场景题、表达逻辑题、团队协作情境判断题、书面表达规范题',
    '项目经验': '项目管理知识（敏捷/瀑布）、需求分析、技术方案设计、项目风险识别等场景题',
    '逻辑思维': '逻辑推理、批判性思维、问题分析、数据推理、因果判断等思维类题目',
    '团队协作': '团队角色认知、冲突处理、协作流程、领导力情境判断题',
    '行业理解': '互联网行业趋势、技术发展史、行业术语、商业模式分析等常识类题目',
    '学习能力': '学习方法论、知识体系构建、技术文档阅读理解、新概念快速掌握类题目',
    '解决问题': '故障排查思路、根因分析、方案设计、技术选型决策等场景题',
    '创新能力': '技术方案创新、设计思维、产品思维、技术趋势判断等开放性问题',
    '抗压能力': '时间管理、优先级排序、多任务处理、压力情境应对等场景判断题',
  }

  const isDimension = !isStandardCategory && category
  const dimensionPrompt = isDimension
    ? (dimensionPromptMap[category] || `与"${category}"相关的职场技能类选择题`)
    : null

  try {
    const systemPrompt = isDimension
      ? `你是一位资深的职场技能考评专家。请根据以下要求生成${targetCount}道高质量的职场技能测评题目。

考察维度：${category}
题目类型：${dimensionPrompt}
题目数量：${targetCount}道

返回JSON格式：
{
  "questions": [
    {
      "type": "choice",
      "category": "${category}",
      "difficulty": "easy/medium/hard",
      "question": "完整的题目内容，包含必要的题干信息",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": [0],
      "analysis": "详细的解析，包括：1.考点分析 2.解题思路 3.易错点提醒 4.知识点扩展（150-250字）",
      "knowledgePoint": "具体知识点名称"
    }
  ]
}

出题要求：
1. 题目必须真实、严谨，贴合职场实际场景
2. 每道题必须有4个选项，其中1个正确答案（answer数组只包含正确答案的索引）
3. 解析必须详细、有深度，真正帮助求职者理解
4. 难度分布合理（简单30%、中等50%、困难20%）
5. 题目要原创，结合真实职场案例`
      : `你是一位资深的公务员考试行测命题专家。请根据以下要求生成${targetCount}道高质量的行测题目。

分类范围：${targetCategory}
难度要求：${difficulty === 'all' ? '简单、中等、困难均匀分布' : difficulty}
题目数量：${targetCount}道

返回JSON格式：
{
  "questions": [
    {
      "type": "choice",
      "category": "分类名称（言语理解/数量关系/判断推理/资料分析/常识判断）",
      "difficulty": "easy/medium/hard",
      "question": "完整的题目内容，包含必要的题干信息",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": [0],
      "analysis": "详细的解析，包括：1.考点分析 2.解题思路 3.易错点提醒 4.知识点扩展（150-250字）",
      "knowledgePoint": "具体知识点名称"
    }
  ]
}

出题要求：
1. 题目必须真实、严谨，符合行测考试标准
2. 言语理解：包含阅读理解、逻辑填空、语句表达等
3. 数量关系：包含数学运算、数字推理等
4. 判断推理：包含图形推理、定义判断、类比推理、逻辑判断等
5. 资料分析：包含图表分析、数据计算、趋势判断等
6. 常识判断：包含政治、经济、法律、历史、文化、科技等
7. 每道题必须有4个选项，其中1个正确答案（answer数组只包含正确答案的索引）
8. 解析必须详细、有深度，真正帮助考生理解
9. 难度分布合理，不要全部是简单题或困难题
10. 题目要原创，不要照搬网上已有的真题`

    const result = await chatJSON<{ questions: GeneratedAptitudeQuestion[] }>([
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `请生成${targetCount}道${isDimension ? `${category}维度的测评` : '行测'}题目${isDimension ? '' : `，分类：${targetCategory}，难度：${difficulty}`}`,
      },
    ], { ...aiOptions, temperature: 0.8, maxTokens: 8000 })

    if (result && Array.isArray(result.questions) && result.questions.length > 0) {
      console.log(`[AI generateAptitudeQuestions] 成功生成 ${result.questions.length} 道题目`)
      return result.questions
    }
    console.log('[AI generateAptitudeQuestions] AI 返回格式异常，生成失败')
    return null
  } catch (err: any) {
    console.error('[AI generateAptitudeQuestions] 生成异常:', err.message || err)
    return null
  }
}

// ============ AI 生成岗位笔试题 ============

export interface GeneratedPositionQuestion {
  type: 'choice' | 'multi'
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  answer: number[]
  analysis: string
  knowledgePoint: string
}

// ============ AI 生成面经 ============

export interface GeneratedExperience {
  summary: string
  content: string
  questions: string[]
  interview_round: string
}

export async function generateExperience(
  company: string,
  position: string,
  industry: string,
  interviewRound: string,
  aiOptions?: AIClientOptions,
): Promise<GeneratedExperience | null> {
  if (!isAIConfigured(aiOptions)) {
    console.log('[AI generateExperience] AI 未配置，无法生成面经')
    return null
  }

  console.log(`[AI generateExperience] 为 "${company} - ${position}" 生成面经...`)

  try {
    const result = await chatJSON<GeneratedExperience>([
      {
        role: 'system',
        content: `你是一位经验丰富的求职者，刚刚完成了${company}公司${position}岗位的面试。请以第一人称写一篇详细的面试经验分享。

返回JSON格式：
{
  "summary": "简短摘要（50字以内），概括面试体验和核心收获",
  "content": "详细的面试经验正文（Markdown格式，500-800字），包括：\n## 面试流程\n- 整体流程（几轮面试、时间跨度）\n\n## 面试内容\n- 每一轮面试的具体问题、考察点、回答思路\n\n## 面试心得\n- 面试准备建议、注意事项、避坑指南\n\n## 总结\n- 整体感受和建议",
  "questions": ["面试问题1", "面试问题2", "面试问题3", "面试问题4", "面试问题5"],
  "interview_round": "${interviewRound || '一面'}"
}

要求：
1. 内容要真实可信，符合${company}公司${industry}行业的实际面试风格
2. 问题要具体、有深度，体现${position}岗位的专业要求
3. 面试流程描述要完整，包括面试轮次、每轮时长、面试官风格
4. 心得部分要有实用价值，给出可操作的建议
5. questions数组包含5-8个具体的面试问题
6. 使用Markdown格式组织content，层次分明`,
      },
      {
        role: 'user',
        content: `请生成${company}公司${position}岗位的${interviewRound || '一面'}面试经验分享。`,
      },
    ], { ...aiOptions, temperature: 0.8, maxTokens: 4000 })

    if (result && result.content && result.questions && result.questions.length > 0) {
      console.log(`[AI generateExperience] 成功生成面经（${result.questions.length} 个问题）`)
      return result
    }
    console.log('[AI generateExperience] AI 返回格式异常，生成失败')
    return null
  } catch (err: any) {
    console.error('[AI generateExperience] 生成异常:', err.message || err)
    return null
  }
}

export async function generatePositionQuestions(
  positionName: string,
  positionId: string,
  count: number,
  aiOptions?: AIClientOptions,
): Promise<GeneratedPositionQuestion[] | null> {
  if (!isAIConfigured(aiOptions)) {
    console.log('[AI generatePositionQuestions] AI 未配置，无法生成题目')
    return null
  }

  const targetCount = Math.min(count, 15)
  console.log(`[AI generatePositionQuestions] 为 "${positionName}" 生成 ${targetCount} 道笔试题`)

  try {
    const result = await chatJSON<{ questions: GeneratedPositionQuestion[] }>([
      {
        role: 'system',
        content: `你是一位资深的技术面试官和笔试命题专家。请根据以下岗位信息，生成${targetCount}道高质量的笔试题。

岗位名称：${positionName}
题目数量：${targetCount}道

返回JSON格式：
{
  "questions": [
    {
      "type": "choice",
      "category": "题目分类（如：基础知识/框架应用/系统设计/算法逻辑/场景分析等）",
      "difficulty": "easy/medium/hard",
      "question": "完整题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": [0],
      "analysis": "详细解析，包括：1.考点 2.解题思路 3.易错点 4.知识扩展（150-250字）",
      "knowledgePoint": "具体知识点名称"
    }
  ]
}

出题要求：
1. 题目必须与该岗位的实际笔试内容高度相关
2. 覆盖该岗位的核心技术栈和常见考点
3. 难度分布：约30%简单、50%中等、20%困难
4. 每道题4个选项，1个正确答案
5. 解析要详细，帮助求职者真正理解
6. 题目要原创，有实际考察价值
7. 适当包含该岗位面试中的高频考点`,
      },
      {
        role: 'user',
        content: `请为"${positionName}"岗位生成${targetCount}道笔试题，覆盖该岗位核心技术栈。`,
      },
    ], { ...aiOptions, temperature: 0.8, maxTokens: 8000 })

    if (result && Array.isArray(result.questions) && result.questions.length > 0) {
      console.log(`[AI generatePositionQuestions] 成功生成 ${result.questions.length} 道题目`)
      return result.questions
    }
    console.log('[AI generatePositionQuestions] AI 返回格式异常，生成失败')
    return null
  } catch (err: any) {
    console.error('[AI generatePositionQuestions] 生成异常:', err.message || err)
    return null
  }
}