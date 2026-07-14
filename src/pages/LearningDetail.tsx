import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/store/useProfileStore'
import { learningApi, type LearningMaterialItem } from '@/api'
import {
  BookOpen, Clock, CheckCircle, Lock, ChevronDown, ChevronRight,
  Play, FileText, Brain, AlertCircle, Target, ChevronLeft,
  ArrowRight, ExternalLink, Loader2, Sparkles, Zap,
  X,
} from 'lucide-react'

const typeBadges: Record<string, { className: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  article: { className: 'badge-primary', label: '文章', icon: FileText },
  exercise: { className: 'badge-accent', label: '练习', icon: Brain },
  project: { className: 'badge-success', label: '项目', icon: Target },
}

// 维度特定学习内容库
const dimensionContentLibrary: Record<string, { title: string; type: string; content: string; tips: string[] }> = {
  '技术能力': {
    title: '技术能力提升指南',
    type: 'article',
    content: '系统掌握目标岗位所需的核心技术栈，包括数据结构与算法、操作系统、计算机网络、数据库等基础知识。建议从以下几个方面入手：\n\n1. **数据结构与算法**：重点掌握数组、链表、栈、队列、树、图、哈希表等基本数据结构，以及排序、搜索、动态规划、贪心等常用算法。推荐刷 LeetCode Hot 100 题目。\n\n2. **操作系统**：理解进程与线程、内存管理、文件系统、死锁等核心概念。\n\n3. **计算机网络**：掌握 TCP/IP 协议栈、HTTP/HTTPS、DNS、CDN 等知识点。\n\n4. **数据库**：熟练使用 SQL，理解索引、事务、锁机制、分库分表等。',
    tips: ['每天至少刷 2-3 道算法题，保持手感', '整理常见面试题的知识点脑图', '用实际项目巩固理论知识']
  },
  '沟通表达': {
    title: '沟通表达能力训练',
    type: 'article',
    content: '面试中的沟通表达是考察重点，好的表达能力能让你在同等技术水平下脱颖而出。\n\n1. **STAR 法则**：回答行为面试题时，按照 Situation（情境）、Task（任务）、Action（行动）、Result（结果）的结构组织语言。\n\n2. **项目介绍技巧**：用"背景-挑战-方案-成果"的框架介绍项目，突出你的贡献和思考。\n\n3. **技术讲解能力**：能把复杂的技术问题用通俗的语言讲清楚，这是高级工程师的重要素质。\n\n4. **反问环节**：准备 3-5 个有深度的问题，展现你对岗位和公司的思考。',
    tips: ['每天用 STAR 法则练习 1 个行为面试题', '录音回听自己的回答，找出改进点', '准备 3 个项目的精炼介绍（2 分钟版本）']
  },
  '项目经验': {
    title: '项目经验打磨指南',
    type: 'article',
    content: '项目经验是面试官评估你实战能力的核心依据。一个好的项目介绍应该包含：\n\n1. **项目背景与目标**：说清楚为什么要做这个项目，解决什么问题。\n\n2. **技术选型与架构**：为什么选择这些技术？架构设计有什么考量？\n\n3. **难点与解决方案**：遇到了什么技术挑战？你是怎么解决的？这体现了你的问题解决能力。\n\n4. **量化成果**：用数据说话——性能提升多少？用户增长多少？代码覆盖率提高多少？\n\n5. **反思与改进**：如果重新做，你会怎么优化？',
    tips: ['为每个项目写一份 200 字的核心摘要', '准备项目中的技术难点和解决方案', '整理项目的量化指标（QPS、延迟、用户量等）']
  },
  '逻辑思维': {
    title: '逻辑思维能力提升',
    type: 'article',
    content: '逻辑思维是技术面试的基础能力，体现在问题分析、方案设计和代码实现中。\n\n1. **问题拆解**：面对复杂问题，学会将其拆分为若干子问题，逐个击破。\n\n2. **边界条件分析**：养成考虑边界情况的习惯——空输入、大数据量、并发场景等。\n\n3. **Trade-off 思维**：任何技术方案都有取舍，学会分析不同方案的优劣。\n\n4. **系统设计思维**：从需求分析→数据模型→接口设计→扩展性考量，建立完整的系统设计框架。',
    tips: ['每天做 1 道系统设计题，画架构图', '参加 LeetCode 周赛，训练限时解题能力', '阅读技术博客，学习他人的分析思路']
  },
  '团队协作': {
    title: '团队协作能力培养',
    type: 'article',
    content: '团队协作能力是面试中行为面试的重点考察维度。\n\n1. **冲突处理**：描述你如何处理团队中的意见分歧，体现你的沟通和协调能力。\n\n2. **跨团队合作**：举例说明你如何与产品、设计、测试等角色协作推进项目。\n\n3. **领导力展示**：即使不是正式的管理者，也可以展示你在项目中主动承担和推动的案例。\n\n4. **Code Review 文化**：如何做有效的 Code Review，如何接受他人的反馈。',
    tips: ['准备 2-3 个团队协作的真实案例', '练习用 STAR 法则描述协作场景', '反思自己在团队中的角色定位']
  },
  '行业理解': {
    title: '行业理解与业务洞察',
    type: 'article',
    content: '对行业和业务的理解是区分优秀候选人和普通候选人的关键。\n\n1. **行业趋势**：关注目标行业的最新动态、技术趋势、竞争格局。\n\n2. **公司业务**：深入了解目标公司的产品、商业模式、技术栈。\n\n3. **竞品分析**：对比目标公司与竞品的差异，思考优劣势。\n\n4. **技术驱动业务**：思考技术如何为业务创造价值，而不是为了技术而技术。',
    tips: ['每周阅读 3 篇行业分析报告', '关注目标公司的技术博客和公众号', '准备 2-3 个对目标公司产品的改进建议']
  },
  '综合': {
    title: '综合能力提升指南',
    type: 'article',
    content: '全面提升求职竞争力，从技术、沟通、项目等多个维度系统准备。\n\n1. **建立知识体系**：梳理目标岗位的技能树，查漏补缺。\n\n2. **模拟面试**：定期进行模拟面试，熟悉面试流程和节奏。\n\n3. **简历打磨**：确保简历突出你的核心优势，与目标岗位匹配。\n\n4. **持续学习**：保持学习的节奏，不断提升自己的技术深度和广度。',
    tips: ['制定每周学习计划并严格执行', '每月进行一次模拟面试检验进步', '维护个人技术博客或 GitHub']
  },
}

function getDimensionContent(dimension: string): { title: string; type: string; content: string; tips: string[] } {
  // 精确匹配
  if (dimensionContentLibrary[dimension]) return dimensionContentLibrary[dimension]
  // 模糊匹配：检查维度名是否包含关键词
  for (const [key, value] of Object.entries(dimensionContentLibrary)) {
    if (dimension.includes(key) || key.includes(dimension)) return value
  }
  return {
    title: `${dimension}核心知识点学习`,
    type: 'article',
    content: `针对「${dimension}」维度的核心知识点进行系统学习，理解基础概念，掌握核心原理，通过实际案例加深理解。建议结合刷题和模拟面试来巩固学习效果。`,
    tips: ['制定该维度的专项学习计划', '结合刷题巩固理论知识', '通过模拟面试检验学习效果'],
  }
}

// 本地生成小测验题目
function generateLocalQuiz(dimension: string): Array<{ question: string; options: string[]; answer: number }> {
  const quizBank: Record<string, Array<{ question: string; options: string[]; answer: number }>> = {
    '技术能力': [
      { question: '以下哪种数据结构最适合实现 LRU 缓存？', options: ['数组', '链表', '哈希表+双向链表', '栈'], answer: 2 },
      { question: 'HTTP 状态码 500 表示什么？', options: ['请求成功', '客户端错误', '服务器内部错误', '重定向'], answer: 2 },
      { question: '以下哪个不是关系型数据库？', options: ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite'], answer: 2 },
    ],
    '沟通表达': [
      { question: 'STAR 法则中，T 代表什么？', options: ['Team（团队）', 'Task（任务）', 'Time（时间）', 'Technology（技术）'], answer: 1 },
      { question: '面试反问环节，以下哪个问题最不合适？', options: ['团队的技术栈是什么？', '公司对这个岗位的期望是什么？', '你们公司加班多吗？', '这个岗位的晋升路径是怎样的？'], answer: 2 },
      { question: '介绍项目时，以下哪个顺序最合适？', options: ['技术细节→背景→成果', '背景→挑战→方案→成果', '方案→成果→背景', '成果→挑战→背景→方案'], answer: 1 },
    ],
    '项目经验': [
      { question: '项目介绍中，最重要的部分是什么？', options: ['使用的技术栈', '你的贡献和思考', '项目的背景', '团队规模'], answer: 1 },
      { question: '以下哪个指标最能体现项目成果？', options: ['代码行数', '上线时间', '可量化的业务指标', '使用的框架数量'], answer: 2 },
      { question: '面试官问"项目中最难的技术挑战是什么"，最佳回答方式？', options: ['说没有遇到难的', '描述问题+分析原因+解决方案+反思', '只说技术方案', '强调团队帮助'], answer: 1 },
    ],
    '逻辑思维': [
      { question: '以下哪种方法最能体现逻辑思维能力？', options: ['快速给出答案', '先分析问题再拆解求解', '直接套用模板', '询问他人意见'], answer: 1 },
      { question: '系统设计面试中，最先应该考虑什么？', options: ['技术选型', '数据库设计', '需求分析和功能拆解', '部署方案'], answer: 2 },
      { question: '以下哪种做法不利于培养逻辑思维？', options: ['多做算法题', '阅读技术博客', '死记硬背答案', '画架构图分析'], answer: 2 },
    ],
    '团队协作': [
      { question: '处理团队冲突的最佳方式是？', options: ['坚持己见', '直接找上级', '倾听各方意见，寻找共识', '回避冲突'], answer: 2 },
      { question: 'Code Review 的主要目的是？', options: ['找别人的错误', '知识共享和质量保障', '展示自己的水平', '完成任务要求'], answer: 1 },
      { question: '跨团队协作时，最重要的是？', options: ['技术能力', '明确目标和沟通机制', '个人关系', '加班时间'], answer: 1 },
    ],
    '行业理解': [
      { question: '以下哪个不是了解目标公司的最佳途径？', options: ['公司官网和技术博客', '只看招聘JD', '行业分析报告', '与在职员工交流'], answer: 1 },
      { question: '技术驱动业务的核心是什么？', options: ['使用最新技术', '提升自身技术能力', '用技术解决业务问题创造价值', '追求技术完美'], answer: 2 },
      { question: '面试时展示行业理解，最佳方式是？', options: ['背诵行业数据', '结合自己的思考提出见解', '只说大趋势', '强调自己学的多'], answer: 1 },
    ],
  }

  const defaultQuiz = [
    { question: '以下哪个是提升求职竞争力最有效的方式？', options: ['只刷题', '系统学习+实践+复盘', '只看面经', '等待机会'], answer: 1 },
    { question: '面试准备的黄金法则是什么？', options: ['临时抱佛脚', '提前系统准备', '全靠运气', '只准备技术题'], answer: 1 },
    { question: '以下哪种学习方式效果最好？', options: ['被动阅读', '主动输出和实践', '只看视频', '只听课'], answer: 1 },
  ]

  for (const [key, quiz] of Object.entries(quizBank)) {
    if (dimension.includes(key) || key.includes(dimension)) return quiz
  }
  return defaultQuiz
}

export default function LearningDetail() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { learningPlans, toggleLearningTask, isLearningTaskCompleted, getLearningTaskCompletions } = useProfileStore()

  // 从 store 中查找当前计划
  const plan = learningPlans.find((p) => p.id === planId)

  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set([0]))
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  // 从后端加载学习材料
  const [materialsMap, setMaterialsMap] = useState<Record<string, LearningMaterialItem[]>>({})
  const [materialsLoading, setMaterialsLoading] = useState(false)

  // 小测验状态
  const [quizTaskId, setQuizTaskId] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<Array<{ question: string; options: string[]; answer: number }>>([])
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)

  // AI 内容生成状态
  const [generatingTaskId, setGeneratingTaskId] = useState<string | null>(null)
  const [aiGeneratedContent, setAiGeneratedContent] = useState<Record<string, { title: string; content: string; tips: string[] }>>({})

  // 从持久化 store 获取已完成任务
  const completedTaskIds = planId ? getLearningTaskCompletions(planId) : []
  const completedTasks = useMemo(() => new Set(completedTaskIds), [completedTaskIds])

  if (!plan) {
    return (
      <div className="card text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-surface-hover mx-auto flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">未找到学习计划</h3>
        <p className="text-slate-400 text-sm mb-4">请先完成能力诊断，生成学习计划</p>
        <button onClick={() => navigate('/diagnosis')} className="btn-primary">
          去完成水平诊断
        </button>
      </div>
    )
  }

  const recruitmentLabels: Record<string, string> = {
    fall: '秋招',
    spring: '春招',
    intern: '日常实习',
  }
  const recruitmentLabel = recruitmentLabels[plan.recruitmentType] || '校招'

  const stages = plan.stages.map((s, idx) => ({
    ...s,
    id: `${plan.id}_s${idx}`,
    order: idx + 1,
    tasks: s.tasks.map((t, tIdx) => ({
      id: `${plan.id}_s${idx}_t${tIdx}`,
      title: t,
      type: 'exercise' as const,
      dimension: (plan.dimensions && plan.dimensions.length > 0 ? plan.dimensions[tIdx % plan.dimensions.length] : null) || '综合',
      description: t,
    })),
  }))

  const totalTasks = stages.reduce((sum, s) => sum + s.tasks.length, 0)
  const totalProgress = totalTasks > 0
    ? Math.round((completedTasks.size / totalTasks) * 100)
    : 0

  const toggleStage = (stageIdx: number) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(stageIdx)) next.delete(stageIdx)
      else next.add(stageIdx)
      return next
    })
  }

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleCompleteTask = (taskId: string) => {
    if (!planId) return
    toggleLearningTask(planId, taskId)
  }

  // 启动小测验：根据维度生成 3 道题
  const handleStartQuiz = async (taskId: string, dimension: string) => {
    setQuizTaskId(taskId)
    setQuizLoading(true)
    setQuizSubmitted(false)
    setQuizAnswers([])
    try {
      const quiz = await learningApi.generateQuiz(dimension)
      if (quiz && quiz.length > 0) {
        setQuizQuestions(quiz)
      } else {
        setQuizQuestions(generateLocalQuiz(dimension))
      }
    } catch {
      setQuizQuestions(generateLocalQuiz(dimension))
    } finally {
      setQuizLoading(false)
    }
  }

  const handleAnswerSelect = (qIdx: number, optIdx: number) => {
    setQuizAnswers((prev) => {
      const next = [...prev]
      next[qIdx] = optIdx
      return next
    })
  }

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true)
  }

  const handleCloseQuiz = () => {
    setQuizTaskId(null)
    setQuizQuestions([])
    setQuizAnswers([])
    setQuizSubmitted(false)
  }

  const quizScore = quizSubmitted
    ? quizQuestions.filter((q, i) => quizAnswers[i] === q.answer).length
    : 0

  // AI 生成学习内容
  const handleAiGenerateContent = async (taskId: string, dimension: string) => {
    setGeneratingTaskId(taskId)
    try {
      const result = await learningApi.generateContent(dimension)
      if (result) {
        setAiGeneratedContent((prev) => ({ ...prev, [taskId]: result }))
      }
    } finally {
      setGeneratingTaskId(null)
    }
  }

  const getLearningContent = (taskId: string, dimension: string) => {
    if (aiGeneratedContent[taskId]) return aiGeneratedContent[taskId]
    const materials = materialsMap[dimension]
    if (materials && materials.length > 0) {
      return { ...materials[0], tips: [] as string[] }
    }
    return getDimensionContent(dimension)
  }

  // 加载学习材料
  useEffect(() => {
    if (!plan) return
    const allDimensions = new Set<string>()
    plan.stages.forEach((s) => s.tasks.forEach((_t, tIdx) => {
      const dim = plan.dimensions[tIdx % plan.dimensions.length]
      if (dim) allDimensions.add(dim)
    }))

    let cancelled = false
    setMaterialsLoading(true)

    Promise.all(
      Array.from(allDimensions).map((dim) =>
        learningApi.getMaterials(dim).catch(() => [] as LearningMaterialItem[])
      )
    )
      .then((results) => {
        if (cancelled) return
        const map: Record<string, LearningMaterialItem[]> = {}
        Array.from(allDimensions).forEach((dim, i) => {
          map[dim] = results[i] || []
        })
        setMaterialsMap(map)
      })
      .finally(() => {
        if (!cancelled) setMaterialsLoading(false)
      })

    return () => { cancelled = true }
  }, [plan?.id])

  return (
    <div className="space-y-6">
      {/* 计划头部 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/learning')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">返回学习中心</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-400" />
            {plan.positionName} · {recruitmentLabel}学习计划
          </h2>
          <p className="text-slate-400 text-sm mt-1">按阶段完成学习任务，系统提升面试能力</p>
        </div>
      </div>

      {/* 总体进度 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">学习进度</h3>
          <span className="text-sm font-medium text-slate-300">{totalProgress}%</span>
        </div>
        <div className="w-full h-3 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-slate-400">
            已完成 {stages.filter((s) => s.tasks.every((t) => completedTasks.has(t.id))).length}/{stages.length} 个阶段
          </span>
          <span className="text-slate-400">
            已完成 {completedTasks.size}/{totalTasks} 个任务
          </span>
        </div>
      </div>

      {/* 阶段列表 */}
      <div className="space-y-3">
        {stages.map((stage, stageIdx) => {
          const stageCompleted = stage.tasks.every((t) => completedTasks.has(t.id))
          const stageActive = stageIdx === 0 || stages[stageIdx - 1].tasks.every((t) => completedTasks.has(t.id))
          const stageStatus = stageCompleted ? 'completed' : stageActive ? 'active' : 'locked'
          const StageIcon = stageStatus === 'completed' ? CheckCircle : stageStatus === 'active' ? Play : Lock
          const stageColorMap = {
            completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
            active: { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/30' },
            locked: { bg: 'bg-surface-hover', text: 'text-slate-500', border: 'border-surface-border/30' },
          }
          const colors = stageColorMap[stageStatus]
          const isExpanded = expandedStages.has(stageIdx)

          return (
            <div
              key={stage.id}
              className={`card ${stageStatus === 'locked' ? 'opacity-60' : ''}`}
            >
              {/* 阶段标题行 */}
              <button
                onClick={() => toggleStage(stageIdx)}
                disabled={stageStatus === 'locked'}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                  <StageIcon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base font-semibold ${stageStatus === 'locked' ? 'text-slate-500' : 'text-white'}`}>
                    阶段{stage.order}：{stage.title}
                  </h3>
                  <p className={`text-xs ${stageStatus === 'locked' ? 'text-slate-600' : 'text-slate-400'}`}>
                    {stage.tasks.length} 个学习任务
                    {stageStatus === 'completed' && ' · 已完成'}
                    {stageStatus === 'active' && ` · ${stage.tasks.filter((t) => completedTasks.has(t.id)).length}/${stage.tasks.length} 完成`}
                  </p>
                </div>
                {stageStatus !== 'locked' && (
                  <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className={`w-5 h-5 ${colors.text}`} />
                  </div>
                )}
              </button>

              {/* 展开的任务列表 */}
              {isExpanded && stageStatus !== 'locked' && (
                <div className="mt-4 space-y-2 pl-13">
                  {stage.tasks.map((task) => {
                    const TypeBadge = typeBadges[task.type]
                    const isTaskCompleted = completedTasks.has(task.id)
                    const isTaskExpanded = expandedTasks.has(task.id)
                    const content = getLearningContent(task.id, task.dimension)

                    return (
                      <div
                        key={task.id}
                        className={`rounded-lg border transition-all duration-200 ${
                          isTaskCompleted
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-surface-hover/30 border-surface-border/30'
                        }`}
                      >
                        {/* 任务头部 */}
                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            {/* 复选框 */}
                            <button
                              onClick={() => toggleCompleteTask(task.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isTaskCompleted
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-surface-border hover:border-primary-500'
                              }`}
                            >
                              {isTaskCompleted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </button>

                            {/* 任务信息 */}
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => toggleTask(task.id)}
                                className="w-full text-left"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4
                                    className={`text-sm font-medium ${
                                      isTaskCompleted ? 'text-slate-400 line-through' : 'text-white'
                                    }`}
                                  >
                                    {task.title}
                                  </h4>
                                  <span className={TypeBadge.className}>
                                    <TypeBadge.icon className="w-3 h-3 mr-0.5 inline" />
                                    {TypeBadge.label}
                                  </span>
                                  {isTaskExpanded && (
                                    <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" />
                                  )}
                                  {!isTaskExpanded && (
                                    <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 展开的学习内容 */}
                        {isTaskExpanded && (
                          <div className="px-3 pb-4 border-t border-surface-border/20 pt-3 space-y-3">
                            {/* 学习材料 */}
                            <div className="bg-surface-dark/50 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-primary-400" />
                                <span className="text-sm font-medium text-white">{content.title}</span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                {content.content}
                              </p>

                              {/* 学习建议 */}
                              {content.tips && content.tips.length > 0 && (
                                <div className="mt-4 p-3 rounded-lg bg-accent-500/5 border border-accent-500/10">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                                    <span className="text-xs font-medium text-accent-300">学习建议</span>
                                  </div>
                                  <ul className="space-y-1.5">
                                    {content.tips.map((tip, i) => (
                                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                        <span className="w-4 h-4 rounded-full bg-accent-500/15 text-accent-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                          {i + 1}
                                        </span>
                                        {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* 操作按钮组 */}
                            <div className="flex flex-col gap-2">
                              {/* AI 生成内容 */}
                              {!aiGeneratedContent[task.id] && !materialsMap[task.dimension]?.length && (
                                <button
                                  onClick={() => handleAiGenerateContent(task.id, task.dimension)}
                                  disabled={generatingTaskId === task.id}
                                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 text-primary-300 hover:text-primary-200 text-sm font-medium transition-all duration-200 disabled:opacity-60"
                                >
                                  {generatingTaskId === task.id ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />AI 生成中...</>
                                  ) : (
                                    <><Zap className="w-4 h-4" />AI 生成学习内容</>
                                  )}
                                </button>
                              )}

                              {/* 去刷题 + 小测验 */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => navigate('/quiz')}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-500/15 hover:bg-accent-500/25 border border-accent-500/25 text-accent-300 hover:text-accent-200 text-sm font-medium transition-all duration-200"
                                >
                                  <Target className="w-4 h-4" />
                                  去刷题练习
                                  <ArrowRight className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleStartQuiz(task.id, task.dimension)}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 hover:text-emerald-200 text-sm font-medium transition-all duration-200"
                                >
                                  <Brain className="w-4 h-4" />
                                  小测验
                                </button>
                              </div>

                              {/* 标记完成按钮 */}
                              {!isTaskCompleted && (
                                <button
                                  onClick={() => toggleCompleteTask(task.id)}
                                  className="btn-primary w-full text-sm"
                                >
                                  <CheckCircle className="w-4 h-4 inline mr-1.5" />
                                  标记完成
                                </button>
                              )}
                              {isTaskCompleted && (
                                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm py-1">
                                  <CheckCircle className="w-4 h-4" />
                                  已完成
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 小测验弹窗 */}
      {quizTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-card rounded-2xl border border-surface-border/30 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-surface-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">小测验</h3>
              </div>
              <button onClick={handleCloseQuiz} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {quizLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                </div>
              ) : (
                <>
                  {quizQuestions.map((q, qIdx) => {
                    const isCorrect = quizSubmitted && quizAnswers[qIdx] === q.answer
                    const isWrong = quizSubmitted && quizAnswers[qIdx] !== q.answer
                    return (
                      <div key={qIdx} className={`p-4 rounded-lg border ${quizSubmitted ? (isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : isWrong ? 'border-red-500/30 bg-red-500/5' : 'border-surface-border/30 bg-surface-hover/30') : 'border-surface-border/30 bg-surface-hover/30'}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-bold text-slate-300 shrink-0 mt-0.5">{qIdx + 1}.</span>
                          <div className="flex-1">
                            <p className="text-sm text-white mb-3">{q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => {
                                const isSelected = quizAnswers[qIdx] === optIdx
                                const isCorrectOpt = optIdx === q.answer
                                let btnClass = 'border-surface-border/30 hover:border-primary-500/30 text-slate-400'
                                if (quizSubmitted) {
                                  if (isCorrectOpt) btnClass = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                  else if (isSelected && !isCorrectOpt) btnClass = 'border-red-500/50 bg-red-500/10 text-red-300'
                                  else btnClass = 'border-surface-border/30 text-slate-500'
                                } else if (isSelected) {
                                  btnClass = 'border-primary-500/50 bg-primary-500/15 text-primary-300'
                                }
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => !quizSubmitted && handleAnswerSelect(qIdx, optIdx)}
                                    disabled={quizSubmitted}
                                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${btnClass} ${quizSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                                  >
                                    <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                    {opt}
                                    {quizSubmitted && isCorrectOpt && <CheckCircle className="w-3.5 h-3.5 inline ml-2 text-emerald-400" />}
                                    {quizSubmitted && isSelected && !isCorrectOpt && <X className="w-3.5 h-3.5 inline ml-2 text-red-400" />}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {quizSubmitted && (
                    <div className={`p-4 rounded-lg ${quizScore === quizQuestions.length ? 'bg-emerald-500/10 border border-emerald-500/20' : quizScore >= quizQuestions.length / 2 ? 'bg-accent-500/10 border border-accent-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      <p className="text-sm font-medium text-white">
                        得分：{quizScore}/{quizQuestions.length}
                        {quizScore === quizQuestions.length && ' 完美！'}
                        {quizScore >= quizQuestions.length / 2 && quizScore < quizQuestions.length && ' 继续加油！'}
                        {quizScore < quizQuestions.length / 2 && ' 需要更多练习'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-5 border-t border-surface-border/30 flex gap-3">
              <button onClick={handleCloseQuiz} className="flex-1 py-2.5 rounded-lg border border-surface-border/30 text-slate-400 hover:text-white text-sm transition-colors">
                关闭
              </button>
              {!quizSubmitted && quizQuestions.length > 0 && (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={quizAnswers.length < quizQuestions.length}
                  className="flex-1 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  提交答案
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}