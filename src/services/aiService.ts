/**
 * AI 服务层
 * 优先调用后端 API，API 不可用时降级为本地 Mock 引擎
 */

import { resumeApi, interviewApi, diagnosisApi, learningApi } from '@/api/index'
import type { InterviewReport } from '@/api/index'

// ============================================================
// 类型定义
// ============================================================

export interface ResumeFormData {
  name: string
  email: string
  phone: string
  targetPosition: string
  targetIndustry: string
  education: Array<{ school: string; degree: string; major: string }>
  workExperience: Array<{ company: string; position: string; description: string }>
  projectExperience: Array<{ projectName: string; role: string; description: string; techStack: string }>
  skills: string
  certifications: string
}

export interface OptimizedResume {
  name: string
  email: string
  phone: string
  targetPosition: string
  targetIndustry: string
  education: Array<{ school: string; degree: string; major: string; time: string }>
  workExperience: Array<{ company: string; position: string; time: string; description: string }>
  projectExperience: Array<{ name: string; role: string; description: string; techStack: string }>
  skills: string
  certifications: string
}

export interface ResumeAnalysis {
  overallScore: number
  summary: string
  dimensions: Array<{ label: string; score: number; comment: string }>
  suggestions: Array<{
    section: string
    original: string
    suggested: string
    reason: string
  }>
  optimizedResume: OptimizedResume
  aiPowered: boolean
  aiError?: string
}

export interface InterviewEvaluation {
  score: number
  feedback: string
  highlights: string[]
  improvements: string[]
}

export interface DiagnosisResult {
  totalScore: number
  dimensionScores: Record<string, number>
  strengths: string[]
  weaknesses: string[]
  gapAnalysis: string
}

export interface LearningPlanStage {
  title: string
  description: string
  duration: string
  tasks: string[]
}

export interface LearningPlan {
  stages: LearningPlanStage[]
}

// ============================================================
// 工具函数
// ============================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** 计算文本的丰富度得分 (0-100)，基于长度、关键词密度等 */
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

/** 检测是否包含量化数据 */
function hasQuantifiedData(text: string): boolean {
  return /\d+%|\d+\s*万|\d+\s*倍|\d+\s*人|\d+\s*次|\d+\+|[0-9]+\.?[0-9]*\s*[百千万亿]/.test(text)
}

/** 检测是否使用了 STAR 法则关键词 */
function hasStarKeywords(text: string): boolean {
  const keywords = ['负责', '主导', '参与', '优化', '提升', '降低', '实现', '设计', '开发', '完成', '解决', '落地']
  return keywords.filter((k) => text.includes(k)).length >= 2
}

// ============================================================
// 1. 简历分析 AI
// ============================================================

export async function analyzeResume(data: ResumeFormData): Promise<ResumeAnalysis> {
  try {
    return await resumeApi.analyze(data as unknown as Record<string, unknown>)
  } catch {
    return { ...analyzeResumeMock(data), aiPowered: false, aiError: '无法连接后端服务，使用本地规则引擎' }
  }
}

function analyzeResumeMock(data: ResumeFormData): ResumeAnalysis {
  const suggestions: ResumeAnalysis['suggestions'] = []
  const allText = JSON.stringify(data)

  // --- 维度评分 ---
  let completeness = 100
  if (!data.name) completeness -= 15
  if (!data.email) completeness -= 10
  if (!data.phone) completeness -= 5
  if (data.education.length === 0) completeness -= 20
  if (data.education.length > 0 && !data.education[0].school) completeness -= 10
  if (data.workExperience.length === 0) completeness -= 10
  if (data.projectExperience.length === 0) completeness -= 10
  if (!data.skills) completeness -= 15
  if (!data.targetPosition) completeness -= 5
  completeness = clamp(completeness, 30, 100)

  let keywordScore = 40
  const techKeywords = ['Java', 'Python', 'Spring', 'React', 'Vue', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'Linux', 'Git', '微服务', '分布式', '高并发', 'AI', '大数据', 'TypeScript', 'Go', 'C++', 'HTML', 'CSS', 'JavaScript', 'Node', 'Kafka', 'ES', 'MongoDB', '负载均衡', '安全', 'CI/CD', '自动化']
  const matched = techKeywords.filter((k) => allText.toLowerCase().includes(k.toLowerCase()))
  keywordScore += matched.length * 3
  keywordScore = clamp(keywordScore, 30, 100)

  let layoutScore = 85
  data.workExperience.forEach((w) => {
    if (w.description && w.description.length < 30) layoutScore -= 5
  })
  layoutScore = clamp(layoutScore, 50, 100)

  let expressScore = 60
  data.workExperience.forEach((w) => {
    if (w.description) expressScore = Math.max(expressScore, analyzeTextRichness(w.description))
  })
  data.projectExperience.forEach((p) => {
    if (p.description) expressScore = Math.max(expressScore, analyzeTextRichness(p.description))
  })
  expressScore = clamp(expressScore + 10, 50, 95)

  let quantScore = 40
  let quantCount = 0
  data.workExperience.forEach((w) => { if (w.description && hasQuantifiedData(w.description)) quantCount++ })
  data.projectExperience.forEach((p) => { if (p.description && hasQuantifiedData(p.description)) quantCount++ })
  quantScore += quantCount * 15
  quantScore = clamp(quantScore, 30, 95)

  let matchScore = 50
  if (data.targetPosition && data.targetPosition.length > 2) matchScore += 10
  if (data.targetIndustry && data.targetIndustry.length > 1) matchScore += 5
  if (data.workExperience.length > 0) matchScore += 10
  if (data.skills && data.skills.length > 5) matchScore += 10
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

  // --- 生成建议 ---
  if (data.education.length === 0 || (data.education.length > 0 && !data.education[0].school)) {
    suggestions.push({
      section: '教育经历', original: '教育经历缺失',
      suggested: '请补充你的教育背景，包括学校名称、学历、专业和就读时间',
      reason: '教育经历是简历的基础信息，HR会首先关注',
    })
  }
  data.workExperience.forEach((w) => {
    if (!w.description || w.description.length < 30) {
      suggestions.push({
        section: '实习经历', original: w.description || '（空）',
        suggested: `建议补充${w.company || '公司'}${w.position || '岗位'}的具体工作内容和成果，使用STAR法则（情境-任务-行动-结果）来描述`,
        reason: '缺乏具体描述，无法体现你的实际贡献和能力',
      })
    } else if (!hasQuantifiedData(w.description)) {
      suggestions.push({
        section: '实习经历', original: w.description,
        suggested: `${w.description}，建议增加量化成果，如"优化了XX功能，使接口响应时间降低XX%"`,
        reason: '增加量化数据可以增强说服力，让HR更直观地了解你的贡献',
      })
    }
  })
  data.projectExperience.forEach((p) => {
    if (!p.description || p.description.length < 30) {
      suggestions.push({
        section: '项目经验', original: p.description || '（空）',
        suggested: `建议补充项目"${p.projectName || '（未命名）'}"的背景、你的角色、技术难点和最终成果`,
        reason: '项目描述过于简略，无法展示你的技术深度',
      })
    }
    if (!p.techStack) {
      suggestions.push({
        section: '项目经验', original: '技术栈未填写',
        suggested: `建议为项目"${p.projectName || '（未命名）'}"补充使用的技术栈，如框架、数据库、中间件等`,
        reason: '技术栈是面试官快速了解你技术广度的关键信息',
      })
    }
  })
  if (!data.skills) {
    suggestions.push({
      section: '技能证书', original: '（空）',
      suggested: '建议补充你的专业技能，按熟练程度排列，如：精通Java，熟练掌握Spring Boot、MySQL、Redis',
      reason: '技能部分是ATS系统的关键词匹配重点，缺失会大幅降低简历通过率',
    })
  }
  if (data.targetPosition && data.targetPosition.length < 4) {
    suggestions.push({
      section: '求职意向', original: `目标岗位：${data.targetPosition}`,
      suggested: `建议细化求职方向，如"${data.targetPosition}${data.targetIndustry ? '（' + data.targetIndustry + '行业）' : ''}"并补充应届生身份`,
      reason: '明确的求职意向有助于HR快速匹配岗位',
    })
  }
  if (suggestions.length === 0) {
    suggestions.push({
      section: '整体评价', original: '简历内容完整',
      suggested: '简历整体质量不错，建议根据不同公司定制化调整重点突出内容',
      reason: '针对不同公司的JD，突出匹配的经历和技能可以进一步提高面试率',
    })
  }

  // 综合评估总结
  let summary = ''
  if (overallScore >= 80) {
    summary = `简历整体质量优秀，综合评分${overallScore}分。在内容完整性、关键词匹配和语言表达方面表现突出。建议持续关注目标岗位的JD变化，针对性地调整简历重点，保持竞争力。`
  } else if (overallScore >= 60) {
    summary = `简历整体质量良好，综合评分${overallScore}分。具备基本的简历框架，但在部分维度仍有提升空间。建议重点关注量化成果和岗位匹配度的提升，根据下方建议逐项优化。`
  } else {
    summary = `简历综合评分${overallScore}分，存在较多可改进之处。建议从内容完整性入手，补充缺失的关键信息，然后逐项优化各模块的描述，使用STAR法则和量化数据来增强说服力。`
  }

  // 优化后的简历
  const optimizedResume: OptimizedResume = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    targetPosition: data.targetPosition,
    targetIndustry: data.targetIndustry,
    education: data.education.map((e) => ({
      school: e.school,
      degree: e.degree,
      major: e.major,
      time: '待补充',
    })),
    workExperience: data.workExperience.map((w) => ({
      company: w.company,
      position: w.position,
      time: '待补充',
      description: w.description && w.description.length >= 30
        ? w.description
        : `在${w.company || '公司'}担任${w.position || '岗位'}，负责相关业务工作，通过优化流程和提升效率，为团队创造了显著价值。（建议补充具体量化成果）`,
    })),
    projectExperience: data.projectExperience.map((p) => ({
      name: p.projectName,
      role: p.role,
      description: p.description && p.description.length >= 30
        ? p.description
        : `项目"${p.projectName || '未命名'}"中担任${p.role || '核心成员'}，负责项目关键模块的设计与开发，通过技术方案优化解决了核心问题，最终成功交付项目。（建议补充具体量化成果）`,
      techStack: p.techStack,
    })),
    skills: data.skills,
    certifications: data.certifications,
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

// ============================================================
// 2. 面试回答评估 AI
// ============================================================

export async function evaluateInterviewAnswer(
  question: string,
  answer: string,
  dimension: string,
  targetPosition: string,
  interviewType: string,
): Promise<InterviewEvaluation> {
  try {
    return await interviewApi.evaluate({ question, answer, dimension, targetPosition, interviewType })
  } catch {
    return evaluateInterviewAnswerMock(question, answer, dimension, targetPosition, interviewType)
  }
}

function evaluateInterviewAnswerMock(
  question: string,
  answer: string,
  dimension: string,
  targetPosition: string,
  interviewType: string,
): InterviewEvaluation {
  if (!answer || answer.trim().length === 0) {
    return {
      score: 30,
      feedback: '回答内容为空，建议尝试作答，即使不完整也可以获得部分反馈。',
      highlights: [],
      improvements: ['尝试作答，不要留空', '先理清思路再回答'],
    }
  }

  const answerLen = answer.length
  const richness = analyzeTextRichness(answer)
  const hasStruct = hasStarKeywords(answer)
  const hasData = hasQuantifiedData(answer)

  // 基础分
  let score = 50

  // 长度加分
  if (answerLen > 500) score += 15
  else if (answerLen > 300) score += 12
  else if (answerLen > 150) score += 8
  else if (answerLen > 80) score += 5
  else if (answerLen > 30) score += 2

  // 结构加分
  if (hasStruct) score += 10

  // 量化数据加分
  if (hasData) score += 8

  // 内容相关性加分（关键词匹配）
  const dimensionKeywords: Record<string, string[]> = {
    'Java基础': ['JVM', 'GC', '多线程', '集合', 'HashMap', 'ArrayList', 'synchronized', 'volatile', '线程池', 'CAS', 'AQS'],
    '数据库': ['MySQL', '索引', 'B+Tree', '事务', 'SQL', 'Redis', '缓存', '分库分表', '读写分离', '慢查询', 'EXPLAIN'],
    '框架应用': ['Spring', 'Spring Boot', 'MyBatis', 'IOC', 'AOP', 'Bean', 'Controller', 'AutoConfiguration'],
    '系统设计': ['架构', '高并发', '分布式', '微服务', '负载均衡', '熔断', '限流', '降级', 'CAP', '一致性'],
    '算法': ['时间复杂度', '空间复杂度', '排序', '动态规划', 'DFS', 'BFS', '二分', '二叉树', '链表'],
    '项目经验': ['项目', '实现', '设计', '优化', '上线', '调研', '重构', '从0到1', '团队'],
    '计算机网络': ['HTTP', 'HTTPS', 'TCP', 'UDP', 'DNS', 'CDN', '三次握手', '四次挥手', 'OSI'],
    '操作系统': ['进程', '线程', '内存', '死锁', '文件系统', '虚拟内存', '上下文切换'],
    'HR沟通': ['团队', '沟通', '协作', '成长', '目标', '规划', '优缺点', '加班', '薪资'],
    '行为面试': ['项目', '困难', '解决', '冲突', '决策', '领导', '失败', '学习', '改进'],
    '综合能力': ['分析', '设计', '技术选型', '扩展性', '可维护', '安全性', '性能'],
  }
  const keywords = dimensionKeywords[dimension] || []
  const matchedKeywords = keywords.filter((k) => answer.toLowerCase().includes(k.toLowerCase()))
  score += matchedKeywords.length * 2

  // 面试类型调整
  if (interviewType === 'technical') {
    // 技术面更看重关键词
    if (matchedKeywords.length >= 5) score += 5
  } else if (interviewType === 'hr') {
    // HR面更看重表达
    if (answerLen > 200 && hasStruct) score += 5
  }

  score = clamp(score, 40, 98)

  // 生成反馈
  const highlights: string[] = []
  const improvements: string[] = []

  if (hasStruct) {
    highlights.push('回答结构清晰，使用了STAR法则或类似结构')
  }
  if (hasData) {
    highlights.push('回答中包含了量化数据，增强了说服力')
  }
  if (matchedKeywords.length >= 5) {
    highlights.push(`对"${dimension}"领域的核心概念掌握扎实，关键词覆盖全面`)
  } else if (matchedKeywords.length >= 3) {
    highlights.push(`对"${dimension}"有一定了解，可以进一步深入关键概念`)
  } else {
    improvements.push(`建议在回答中多涉及"${dimension}"相关的核心概念和技术要点`)
  }

  if (answerLen < 80) {
    improvements.push('回答内容较短，建议展开论述，使用STAR法则（情境-任务-行动-结果）组织回答')
  }
  if (!hasStruct) {
    improvements.push('建议使用更清晰的逻辑结构，如"首先...其次...最后..."或STAR法则')
  }
  if (!hasData) {
    improvements.push('建议加入具体的量化数据或实例来支撑观点，如"性能提升了XX%"')
  }

  if (highlights.length === 0) {
    highlights.push('态度积极，敢于尝试作答')
  }

  // 生成综合评价
  let feedback = ''
  if (score >= 85) {
    feedback = `优秀！你对"${dimension}"的理解非常深入，回答结构清晰、内容充实。${pickRandom(['继续保持这个水平，面试通过率会很高！', '建议在面试中多展示这样的深度思考，会给面试官留下深刻印象。'])}`
  } else if (score >= 70) {
    feedback = `良好！整体回答质量不错，展现出了扎实的基础。${pickRandom(['可以在技术深度上进一步展开，展示更多实际项目经验。', '建议补充更多具体案例，让回答更有说服力。'])}`
  } else if (score >= 55) {
    feedback = `一般。${pickRandom(['建议加强"${dimension}"方面的学习，多做针对性练习。', '回答方向正确但不够深入，建议系统学习相关知识后再来练习。'])}`
  } else {
    feedback = `需要加强。"${dimension}"是你的薄弱环节，建议先系统学习基础知识，再通过刷题和模拟面试来提高。`
  }

  return { score, feedback, highlights, improvements }
}

// ============================================================
// 2.5 面试报告汇总 AI
// ============================================================

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
): Promise<InterviewReport> {
  try {
    return await interviewApi.report({ answers, interviewType, targetPosition })
  } catch {
    return generateInterviewReportMock(answers, interviewType)
  }
}

function generateInterviewReportMock(
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

  const allHighlights = answers.flatMap((a) => a.highlights || [])
  const allImprovements = answers.flatMap((a) => a.improvements || [])
  const strengths = [...new Set(allHighlights)].slice(0, 3)
  const weaknesses = [...new Set(allImprovements)].slice(0, 3)

  const suggestions = [
    overallScore < 70 ? '建议针对薄弱维度进行专项练习，每天至少完成一次模拟面试' : '继续保持当前水平，针对性地提升个别薄弱环节',
    '在回答中使用STAR法则（情境-任务-行动-结果）来组织内容，提升回答的说服力',
    '多阅读行业技术博客和前沿论文，拓展知识面和技术视野',
    '录制自己的回答并回听，注意语速、停顿和冗余表达',
  ]

  const typeLabel = interviewType === 'technical' ? '技术面' : interviewType === 'hr' ? 'HR面' : '综合面'
  const summary = overallScore >= 80
    ? `在本次${typeLabel}模拟面试中表现优秀，综合评分${overallScore}分。回答结构清晰，内容充实。建议继续保持并挑战更高难度。`
    : overallScore >= 60
    ? `在本次${typeLabel}模拟面试中表现良好，综合评分${overallScore}分。整体回答质量不错，但部分维度有提升空间。`
    : `本次${typeLabel}模拟面试综合评分${overallScore}分，有较大提升空间。建议从基础知识点入手，系统学习后再进行模拟练习。`

  return { overallScore, summary, dimensionScores, strengths, weaknesses, suggestions }
}

// ============================================================
// 3. 诊断测试评分 AI
// ============================================================

export async function generateDiagnosisScores(
  answers: string[],
  questions: Array<{ dimension: string; question: string }>,
  dimensions: string[],
  positionId?: string,
  positionName?: string,
): Promise<DiagnosisResult> {
  try {
    return await diagnosisApi.submit({
      positionId: positionId || 'general',
      positionName: positionName || '综合能力诊断',
      type: 'general',
      answers,
    })
  } catch {
    return generateDiagnosisScoresMock(answers, questions, dimensions)
  }
}

function generateDiagnosisScoresMock(
  answers: string[],
  questions: Array<{ dimension: string; question: string }>,
  dimensions: string[],
): DiagnosisResult {
  const dimensionScores: Record<string, number> = {}

  // 为每个维度收集答案并评分
  dimensions.forEach((dim) => {
    const dimAnswers = questions
      .map((q, i) => ({ question: q.question, answer: answers[i] || '' }))
      .filter((_, i) => questions[i].dimension === dim)

    if (dimAnswers.length === 0) {
      dimensionScores[dim] = 60 + Math.floor(Math.random() * 20)
      return
    }

    // 综合评分：答案长度 + 关键词匹配 + 结构化程度
    let totalScore = 0
    dimAnswers.forEach((qa) => {
      const len = qa.answer.length
      let itemScore = 40

      // 长度评分
      if (len > 200) itemScore += 25
      else if (len > 100) itemScore += 20
      else if (len > 50) itemScore += 12
      else if (len > 20) itemScore += 5

      // 关键词匹配
      const qKeywords = qa.question.replace(/[？?，,。.、\s]/g, '').slice(0, 20)
      const hasKeyMatch = qKeywords.split('').some((ch) => qa.answer.includes(ch))
      if (hasKeyMatch) itemScore += 10

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
    if (strengths.length > 0) {
      gapAnalysis += `优势维度${strengths.join('、')}表现突出，可以在面试中作为亮点展示。`
    }
    gapAnalysis += `通过系统性的学习计划，预计可以在1-2个月内将综合评分提升10-15分。`
  } else if (strengths.length > 0) {
    gapAnalysis = `你的各项能力较为均衡，优势维度${strengths.join('、')}表现突出。建议继续深化优势领域，同时保持其他维度的训练。`
  } else {
    gapAnalysis = '你的各项能力较为均衡，建议继续保持并深化各个维度的训练。'
  }

  return { totalScore, dimensionScores, strengths, weaknesses, gapAnalysis }
}

// ============================================================
// 4. 学习计划生成 AI
// ============================================================

export async function generateLearningPlan(
  positionName: string,
  recruitmentType: string,
  dimensionScores: Record<string, number>,
  weaknesses: string[],
): Promise<LearningPlan> {
  try {
    const result = await learningApi.createPlan({ positionName, recruitmentType, weaknesses })
    // 将 API 返回的 stages 转换为统一格式（API 的 tasks 是对象数组，mock 的 tasks 是字符串数组）
    return {
      stages: result.stages.map((stage) => ({
        title: stage.title,
        description: stage.description,
        duration: stage.duration,
        tasks: stage.tasks.map((t) => t.title),
      })),
    }
  } catch {
    return generateLearningPlanMock(positionName, recruitmentType, dimensionScores, weaknesses)
  }
}

function generateLearningPlanMock(
  positionName: string,
  recruitmentType: string,
  dimensionScores: Record<string, number>,
  weaknesses: string[],
): LearningPlan {
  const isFall = recruitmentType === 'fall'
  const isSpring = recruitmentType === 'spring'
  const isIntern = recruitmentType === 'intern'

  // 根据薄弱维度生成针对性任务
  const weakTasks: string[] = []
  weaknesses.forEach((dim) => {
    const taskMap: Record<string, string[]> = {
      'Java基础': ['系统学习Java核心：JVM内存模型、GC算法、多线程编程', '完成Java基础专项练习题50道', '阅读《深入理解Java虚拟机》核心章节'],
      '数据库': ['深入理解MySQL索引原理和SQL优化', '完成LeetCode数据库专项练习30道', '学习Redis数据结构与缓存策略'],
      '框架应用': ['掌握Spring Boot/IOC/AOP核心原理', '阅读Spring源码关键模块', '完成一个基于Spring Boot的CRUD项目'],
      '系统设计': ['学习分布式系统设计原则和常见方案', '完成5个系统设计案例分析', '阅读《数据密集型应用系统设计》'],
      '算法': ['完成LeetCode Hot 100题目', '重点训练动态规划、二叉树、DFS/BFS', '每日坚持刷题，保持手感'],
      '计算机网络': ['系统学习TCP/IP协议栈和HTTP协议', '理解HTTPS、DNS、CDN等网络技术', '完成计算机网络常见面试题整理'],
      '操作系统': ['学习进程线程管理、内存管理、文件系统', '理解Linux常用命令和系统调用', '完成操作系统常见面试题整理'],
      '项目经验': ['复盘过往项目，整理技术亮点和难点', '准备1-2个高质量项目展示', '练习用STAR法则描述项目经历'],
      '前端基础': ['学习HTML/CSS/JavaScript核心知识', '选择一个前端框架深入学习（React/Vue）', '完成一个完整的前端项目'],
      '软技能': ['练习自我介绍和项目介绍', '学习面试礼仪和沟通技巧', '进行模拟面试训练'],
    }
    const tasks = taskMap[dim] || [`系统学习${dim}相关核心知识`, `完成${dim}专项练习`, `整理${dim}常见面试题`]
    weakTasks.push(...tasks)
  })

  if (isFall) {
    return {
      stages: [
        {
          title: '基础补强',
          description: '系统学习核心知识点，补齐技术短板，为秋招笔试做准备',
          duration: '约3-4周',
          tasks: weaknesses.length > 0
            ? weakTasks.slice(0, 4)
            : ['完成薄弱维度的核心知识点系统学习', '刷题100+（LeetCode/牛客网）', '整理面试常见八股文'],
        },
        {
          title: '专项提升',
          description: '深入训练核心技能，进行项目实战和模拟笔试',
          duration: '约3-4周',
          tasks: weaknesses.length > 0
            ? [...weakTasks.slice(4, 7), '进行秋招模拟笔试5次以上']
            : ['完成2个高质量项目实战', '进行秋招模拟笔试5次以上', '深入学习目标公司的技术栈'],
        },
        {
          title: '面试冲刺',
          description: '集中面试模拟训练，备战秋招正式面试',
          duration: '约2-3周',
          tasks: ['进行10次以上模拟面试练习', '参加各公司提前批面试', '持续优化简历和自我介绍'],
        },
      ],
    }
  }

  if (isSpring) {
    return {
      stages: [
        {
          title: '快速诊断',
          description: '快速评估当前水平，明确差距和优先级',
          duration: '约1周',
          tasks: ['完成薄弱维度诊断', '制定针对性学习计划', '整理目标公司春招岗位信息'],
        },
        {
          title: '精准补强',
          description: '针对薄弱环节集中突破，重点是面试高频考点',
          duration: '约2-3周',
          tasks: weaknesses.length > 0
            ? weakTasks.slice(0, 5)
            : ['集中攻克薄弱维度的核心知识点', '重点刷目标公司常考题目', '准备2-3个拿得出手的项目经历'],
        },
        {
          title: '面试冲刺',
          description: '密集面试训练，快速提升面试表现',
          duration: '约1-2周',
          tasks: ['进行5次以上高强度模拟面试', '整理春招面试高频问题', '投递简历并跟进面试反馈'],
        },
      ],
    }
  }

  // 实习
  return {
    stages: [
      {
        title: '基础夯实',
        description: '扎实掌握核心基础知识，建立完整的知识体系',
        duration: '约2-3周',
        tasks: weaknesses.length > 0
          ? weakTasks.slice(0, 4)
          : ['系统学习目标岗位的核心技术栈', '完成基础练习题50道', '了解目标公司的技术体系和业务'],
      },
      {
        title: '项目实战',
        description: '通过实际项目练习，提升动手能力',
        duration: '约2-3周',
        tasks: ['完成1-2个个人项目或课程项目', '学习Git协作和代码规范', '参与开源项目贡献代码'],
      },
      {
        title: '面试准备',
        description: '准备实习面试，展示学习能力和潜力',
        duration: '约1-2周',
        tasks: ['进行3-5次模拟面试练习', '准备好自我介绍和项目介绍', '了解实习面试常见问题和技巧'],
      },
    ],
  }
}

// ============================================================
// 5. 刷题 AI 解析
// ============================================================

export function generateQuizAnalysis(
  question: string,
  options: string[],
  correctAnswer: number[],
  userAnswer: number[],
  isCorrect: boolean,
  knowledgePoint: string,
): string {
  if (isCorrect) {
    const correctResponses = [
      `回答正确！这道题考察的是"${knowledgePoint}"。${
        options.length > 0
          ? `正确答案是${correctAnswer.map((i) => String.fromCharCode(65 + i)).join('、')}，你的理解很到位。`
          : ''
      }建议回顾一下相关知识点，确保理解背后的原理，而不是仅仅记住答案。`,
      `很好！你对"${knowledgePoint}"的掌握很扎实。${
        options.length > 0
          ? `选项${correctAnswer.map((i) => String.fromCharCode(65 + i)).join('、')}是正确答案。`
          : ''
      }可以尝试向他人解释这道题的解题思路，教是最好的学。`,
      `正确！"${knowledgePoint}"是面试中的高频考点。${
        options.length > 0
          ? `你正确选择了${correctAnswer.map((i) => String.fromCharCode(65 + i)).join('、')}。`
          : ''
      }建议查阅相关文档，深入了解底层实现原理。`,
    ]
    return pickRandom(correctResponses)
  }

  const correctLabel = options.length > 0
    ? correctAnswer.map((i) => String.fromCharCode(65 + i)).join('、')
    : ''
  const userLabel = options.length > 0 && userAnswer.length > 0
    ? userAnswer.map((i) => String.fromCharCode(65 + i)).join('、')
    : ''

  const wrongResponses = [
    `这道题考察的是"${knowledgePoint}"。${
      correctLabel ? `正确答案是${correctLabel}，你选择了${userLabel || '（未选）'}。` : ''
    }${
      options.length > 0
        ? `错误选项中的描述容易让人混淆，关键是要区分${correctLabel}与其他选项的核心差异。`
        : ''
    }建议回到"${knowledgePoint}"的基础知识，重新梳理概念。`,
    `本题考点是"${knowledgePoint}"。${
      correctLabel ? `正确选项是${correctLabel}。` : ''
    }常见错误原因是对"${knowledgePoint}"的理解不够深入。建议先理解核心概念的定义，再通过做同类型题目来巩固。`,
    `这道"${knowledgePoint}"相关的题目你做错了。${
      correctLabel ? `正确答案是${correctLabel}。` : ''
    }这类题目在笔面试中经常出现，建议把"${knowledgePoint}"作为重点复习内容，多做几道同类题。`,
  ]
  return pickRandom(wrongResponses)
}

// ============================================================
// 6. 工具函数
// ============================================================