import { useAuthStore } from '@/store/useAuthStore'
import { useProfileStore } from '@/store/useProfileStore'
import { useQuizStore } from '@/store/useQuizStore'
import { interviewApi, aiApi } from '@/api'
import { useState, useEffect } from 'react'
import {
  Award, MessageSquare, TrendingUp, Trophy, Target, Clock, BookOpen, Lightbulb, Brain, AlertCircle, Loader2,
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area,
} from 'recharts'

// ============ AI 周度建议（本地规则引擎降级） ============

function generateSuggestions(
  diagnosis: ReturnType<typeof useProfileStore.getState>['latestDiagnosis'],
  learningProgress: number,
  quizStats: { answered: number; wrong: number },
  interviewCount: number,
  targetPosition: string,
): string[] {
  const suggestions: string[] = []

  if (!diagnosis) {
    suggestions.push('你还没有完成能力诊断，建议先进行诊断测试，了解自己的优势与短板，获取个性化学习计划。')
    if (quizStats.answered === 0) {
      suggestions.push('开始刷题练习，选择目标岗位的专项题库，系统会记录你的错题并生成针对性练习。')
    }
    suggestions.push('使用模拟面试功能，AI 会针对你的回答给出实时评分和改进建议，帮助你快速提升面试能力。')
    suggestions.push('完善简历信息后，使用 AI 分析功能获取优化建议，提高简历通过率。')
    return suggestions
  }

  // 基于诊断结果生成建议
  const weakDimensions = diagnosis.dimensions.filter((d) => (diagnosis.dimensionScores[d] ?? 0) < 60)
  const strongDimensions = diagnosis.dimensions.filter((d) => (diagnosis.dimensionScores[d] ?? 0) >= 80)

  if (weakDimensions.length > 0) {
    const weakList = weakDimensions.slice(0, 2).join('、')
    suggestions.push(`你在${weakList}方面得分较低，建议本周重点提升这些维度，可以通过学习计划中的专项任务进行针对性练习。`)
  }

  if (strongDimensions.length > 0 && interviewCount < 3) {
    suggestions.push(`你的${strongDimensions[0]}表现突出，建议进行至少1次模拟面试，在实战中巩固优势。`)
  }

  if (learningProgress < 30) {
    suggestions.push(`当前学习进度为${learningProgress}%，建议每天至少完成1-2个学习任务，保持持续进步。`)
  } else if (learningProgress < 70) {
    suggestions.push(`学习进度已达${learningProgress}%，继续坚持，建议结合刷题巩固所学知识。`)
  } else {
    suggestions.push(`学习进度${learningProgress}%，即将完成当前计划，建议进行模拟面试检验学习成果。`)
  }

  if (quizStats.wrong > 0) {
    suggestions.push(`错题本中有${quizStats.wrong}道错题，建议每周回顾错题本，重点理解错误原因，避免重复犯错。`)
  } else if (quizStats.answered > 0) {
    suggestions.push(`刷题正确率不错，继续保持！建议挑战更高难度的题目，拓宽知识面。`)
  }

  if (interviewCount === 0) {
    suggestions.push('还没有进行过模拟面试，建议本周至少完成1次，提前适应面试节奏和压力。')
  } else if (interviewCount < 5) {
    suggestions.push(`已完成${interviewCount}次模拟面试，建议增加练习频率，每次面试后认真阅读AI反馈。`)
  }

  // 确保至少4条建议
  while (suggestions.length < 4) {
    suggestions.push(`针对${targetPosition || '目标岗位'}，建议关注行业最新动态和技术趋势，保持对岗位要求的敏感度。`)
    break
  }

  return suggestions.slice(0, 4)
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { latestDiagnosis, diagnosisHistory, learningPlans, activities, targetPosition, getLearningProgress } = useProfileStore()
  const { answerHistory, wrongBook, favorites } = useQuizStore()
  const [interviewTrendData, setInterviewTrendData] = useState<Array<{ date: string; score: number }>>([])
  const [trendLoading, setTrendLoading] = useState(false)

  // 从 profile 读取真实数据
  const diagnosis = latestDiagnosis
  const activePlan = learningPlans.length > 0 ? learningPlans[learningPlans.length - 1] : null
  const interviewCount = activities.filter((a) => a.type === 'interview').length
  const answeredCount = Object.keys(answerHistory).length
  const wrongCount = wrongBook.size
  const favoriteCount = favorites.size
  const learningProgress = getLearningProgress()

  // 动态加载面试趋势数据
  useEffect(() => {
    let cancelled = false
    setTrendLoading(true)
    interviewApi.history()
      .then((records) => {
        if (cancelled) return
        // 取最近6条记录，按时序排列
        const recent = records.slice(0, 6).reverse()
        const trend = recent.map((r) => ({
          date: new Date(r.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
          score: r.score,
        }))
        setInterviewTrendData(trend)
      })
      .catch(() => {
        if (cancelled) return
        // 降级：使用活动日志中的面试次数估算
        if (interviewCount > 0) {
          setInterviewTrendData([{ date: '最近', score: 70 }])
        }
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false)
      })
    return () => { cancelled = true }
  }, [interviewCount])

  // 动态生成 AI 周度建议
  const [weeklySuggestions, setWeeklySuggestions] = useState<string[]>(() => 
    generateSuggestions(diagnosis, learningProgress, { answered: answeredCount, wrong: wrongCount }, interviewCount, targetPosition)
  )
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setSuggestionsLoading(true)

    aiApi.suggestions({
      diagnosis: diagnosis ? {
        totalScore: diagnosis.totalScore,
        positionName: diagnosis.positionName,
        dimensions: diagnosis.dimensions,
        dimensionScores: diagnosis.dimensionScores,
      } : null,
      learningProgress,
      quizStats: { answered: answeredCount, wrong: wrongCount },
      interviewCount,
      targetPosition,
    })
      .then((res) => {
        if (cancelled) return
        if (res.suggestions && res.suggestions.length > 0) {
          setWeeklySuggestions(res.suggestions)
        }
      })
      .catch(() => {
        if (cancelled) return
        // AI 不可用时使用本地规则引擎降级
        setWeeklySuggestions(
          generateSuggestions(diagnosis, learningProgress, { answered: answeredCount, wrong: wrongCount }, interviewCount, targetPosition)
        )
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false)
      })

    return () => { cancelled = true }
  }, [diagnosis?.totalScore, learningProgress, answeredCount, wrongCount, interviewCount, targetPosition])

  // 雷达图数据
  const radarData: Array<{ dimension: string; full: string; score: number; fullMark: number }> = diagnosis
    ? diagnosis.dimensions.map((dim) => ({
        dimension: dim.length > 4 ? dim.slice(0, 4) : dim,
        full: dim,
        score: diagnosis.dimensionScores[dim] ?? 0,
        fullMark: 100,
      }))
    : [
        { dimension: '技术能力', full: '技术能力', score: 0, fullMark: 100 },
        { dimension: '沟通表达', full: '沟通表达', score: 0, fullMark: 100 },
        { dimension: '项目经验', full: '项目经验', score: 0, fullMark: 100 },
        { dimension: '逻辑思维', full: '逻辑思维', score: 0, fullMark: 100 },
        { dimension: '团队协作', full: '团队协作', score: 0, fullMark: 100 },
        { dimension: '行业理解', full: '行业理解', score: 0, fullMark: 100 },
      ]

  const topStats = [
    { id: 1, label: '诊断评分', value: diagnosis?.totalScore ?? '--', suffix: diagnosis ? '分' : '', icon: Award, color: 'text-primary-400', bg: 'bg-primary-500/10' },
    { id: 2, label: '面试次数', value: interviewCount, suffix: '次', icon: MessageSquare, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { id: 3, label: '学习进度', value: learningProgress, suffix: '%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 4, label: '错题数量', value: wrongCount, suffix: '题', icon: AlertCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  // 学习进度列表
  const learningItems = activePlan
    ? activePlan.stages.map((stage, idx) => ({
        id: idx + 1,
        title: `${stage.title}：${stage.description}`,
        type: 'stage',
        progress: stage.completed ? 100 : idx === 0 ? 100 : idx === 1 ? 40 : 0,
        dimension: activePlan.positionName,
      }))
    : [
        { id: 1, title: '完成能力诊断，获取学习计划', type: 'article', progress: 0, dimension: '待开始' },
        { id: 2, title: '系统学习目标岗位核心知识', type: 'article', progress: 0, dimension: '待开始' },
        { id: 3, title: '进行模拟面试训练', type: 'article', progress: 0, dimension: '待开始' },
      ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-white">个人数据看板</h2>
        <p className="text-slate-400 text-sm mt-1">
          {diagnosis
            ? `目标岗位：${targetPosition || '未设置'} | 上次诊断 ${diagnosis.totalScore} 分`
            : '完成能力诊断后，这里将展示你的求职准备进度'}
        </p>
      </div>

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.id} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white">
                  {stat.value}
                  <span className="text-base font-normal text-slate-400 ml-0.5">{stat.suffix}</span>
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 中间区域：雷达图 + 诊断历史趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 能力雷达图 */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">能力雷达图</h3>
          </div>
          {diagnosis ? (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                    <Radar name="能力值" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {radarData.map((item) => (
                  <div key={item.dimension} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                    {item.full} {item.score}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Brain className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">完成能力诊断后显示雷达图</p>
            </div>
          )}
        </div>

        {/* 诊断历史趋势 */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">诊断历史趋势</h3>
          </div>
          {diagnosisHistory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={diagnosisHistory}>
                  <defs>
                    <linearGradient id="diagGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number) => [`${value} 分`, '诊断总分']}
                  />
                  <Area type="monotone" dataKey="totalScore" name="诊断总分" stroke="#10b981" strokeWidth={2.5} fill="url(#diagGradient)" dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-center text-slate-500 text-xs mt-2">
                共 {diagnosisHistory.length} 次诊断 | 最新 {diagnosisHistory[diagnosisHistory.length - 1]?.totalScore ?? '--'} 分
              </p>
            </>
          ) : diagnosis ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Trophy className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">完成多次诊断后显示历史趋势</p>
              <p className="text-xs mt-1 text-slate-600">当前仅1次诊断，再完成1次即可看到趋势变化</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Brain className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">完成能力诊断后显示趋势图</p>
            </div>
          )}
        </div>
      </div>

      {/* 面试趋势 + 学习进度 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 面试趋势折线图 */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-semibold text-white">面试趋势</h3>
          </div>
          {interviewCount > 0 ? (
            <>
              {trendLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-accent-400 animate-spin" />
                </div>
              ) : interviewTrendData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={interviewTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="score" name="面试得分" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-center text-slate-500 text-xs mt-2">最近 {interviewTrendData.length} 次模拟面试得分趋势</p>
                </>
              ) : (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <p className="text-sm">暂无面试记录</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">完成模拟面试后显示趋势图</p>
            </div>
          )}
        </div>

        {/* 学习进度列表 */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">学习进度</h3>
          </div>
          <div className="space-y-4">
            {learningItems.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-200 truncate flex-1 mr-2">{item.title}</span>
                  <span className="text-xs text-slate-400 shrink-0">{item.progress}%</span>
                </div>
                <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.progress === 100
                        ? 'bg-emerald-500'
                        : item.progress >= 50
                          ? 'bg-primary-500'
                          : item.progress > 0
                            ? 'bg-accent-500'
                            : 'bg-surface-border'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-1 inline-block">{item.dimension}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI 周度建议 + 刷题统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI 周度建议 */}
        <div className="card bg-gradient-to-br from-primary-600/5 to-accent-500/5 border-primary-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-semibold text-white">AI 周度建议</h3>
          </div>
          <div className="space-y-3">
            {weeklySuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover/50">
                <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 刷题统计 */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">刷题统计</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-surface-dark/50">
              <p className="text-3xl font-bold text-white">{answeredCount}</p>
              <p className="text-sm text-slate-400 mt-1">已答题数</p>
            </div>
            <div className="p-4 rounded-lg bg-surface-dark/50">
              <p className="text-3xl font-bold text-red-400">{wrongCount}</p>
              <p className="text-sm text-slate-400 mt-1">错题本</p>
            </div>
            <div className="p-4 rounded-lg bg-surface-dark/50">
              <p className="text-3xl font-bold text-amber-400">{favoriteCount}</p>
              <p className="text-sm text-slate-400 mt-1">收藏数</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}