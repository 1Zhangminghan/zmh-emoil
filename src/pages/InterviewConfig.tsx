import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProfileStore } from '@/store/useProfileStore'
import { interviewApi, type InterviewHistoryItem } from '@/api'
import {
  Code2, UserCheck, Brain, MessageSquare, Target, Building2, BadgeCheck, Sparkles, ArrowLeft,
  TrendingUp, BarChart3, Loader2, ChevronRight,
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts'

interface InterviewType {
  key: string
  title: string
  description: string
  icon: React.ElementType
  color: string
}

const interviewTypes: InterviewType[] = [
  {
    key: 'technical',
    title: '技术面',
    description: '考察技术深度和解决问题的能力',
    icon: Code2,
    color: 'text-primary-400',
  },
  {
    key: 'hr',
    title: 'HR面',
    description: '考察综合素质和职业规划',
    icon: UserCheck,
    color: 'text-accent-400',
  },
  {
    key: 'comprehensive',
    title: '综合面',
    description: '综合考察技术+业务+沟通能力',
    icon: Brain,
    color: 'text-purple-400',
  },
  {
    key: 'behavioral',
    title: '行为面',
    description: '考察团队协作和领导力',
    icon: MessageSquare,
    color: 'text-emerald-400',
  },
]

export default function InterviewConfig() {
  const navigate = useNavigate()
  const location = useLocation()
  const { targetPosition, targetIndustry } = useProfileStore()
  const hasTarget = targetPosition && targetIndustry

  // 从面经详情页传入的公司/职位信息
  const state = location.state as { company?: string; position?: string; interviewType?: string } | null
  const fromExperience = state?.company && state?.position

  const handleStart = (type: string) => {
    const id = Date.now().toString()
    navigate(`/interview/${id}`, {
      state: {
        interviewType: type,
        targetPosition: fromExperience ? state?.position : targetPosition,
        targetIndustry: fromExperience ? state?.company : targetIndustry,
        company: fromExperience ? state?.company : undefined,
        position: fromExperience ? state?.position : undefined,
      },
    })
  }

  // 历史对比数据
  const [activeTab, setActiveTab] = useState<'start' | 'history'>('start')
  const [historyData, setHistoryData] = useState<InterviewHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (activeTab !== 'history') return
    let cancelled = false
    setHistoryLoading(true)
    interviewApi.history()
      .then((data) => {
        if (!cancelled) setHistoryData(data)
      })
      .catch(() => {
        if (!cancelled) setHistoryData([])
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => { cancelled = true }
  }, [activeTab])

  // 按面试轮次分组
  const roundGroups = (() => {
    const groups = new Map<string, { date: string; dimensions: Map<string, number[]>; totalScore: number }>()
    historyData.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString('zh-CN')
      if (!groups.has(date)) {
        groups.set(date, { date, dimensions: new Map(), totalScore: 0 })
      }
      const group = groups.get(date)!
      if (!group.dimensions.has(item.dimension)) {
        group.dimensions.set(item.dimension, [])
      }
      group.dimensions.get(item.dimension)!.push(item.score)
    })
    // 计算每轮各维度平均分
    return Array.from(groups.values()).map((g) => {
      const dimScores: Record<string, number> = {}
      let totalSum = 0
      let totalCount = 0
      g.dimensions.forEach((scores, dim) => {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        dimScores[dim] = avg
        totalSum += avg
        totalCount++
      })
      return { date: g.date, dimensionScores: dimScores, avgScore: totalCount > 0 ? Math.round(totalSum / totalCount) : 0 }
    })
  })()

  // 收集所有维度
  const allDimensions = Array.from(new Set(historyData.map((h) => h.dimension)))

  // 雷达图数据
  const radarData = allDimensions.map((dim) => {
    const entry: Record<string, unknown> = { dimension: dim.length > 4 ? dim.slice(0, 4) : dim, full: dim }
    roundGroups.forEach((round) => {
      entry[round.date] = round.dimensionScores[dim] ?? 0
    })
    return entry
  })

  const roundColors = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444']

  return (
    <div className="space-y-6">
      {/* 从面经进入时显示返回按钮 */}
      {fromExperience && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回面经详情
        </button>
      )}

      <div>
        <h2 className="text-2xl font-bold text-white">模拟面试</h2>
        <p className="text-slate-400 text-sm mt-1">
          选择面试类型，AI将根据你的简历和目标岗位生成个性化面试题
        </p>
      </div>

      {/* 从面经进入时的公司提示 */}
      {fromExperience && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">从面经进入：</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-medium">
            {state?.company}
          </span>
          <span className="px-2 py-0.5 rounded bg-primary-500/20 text-primary-300 text-xs font-medium">
            {state?.position}
          </span>
          <span className="text-slate-500 text-xs">— AI 将针对此公司/岗位生成面试题</span>
        </div>
      )}

      {/* 当前目标岗位提示 */}
      {!fromExperience && hasTarget && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-sm">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span className="text-slate-300">当前匹配岗位：</span>
          <span className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-primary-500/20 text-primary-300 text-xs font-medium">
              {targetIndustry}
            </span>
            <span className="px-2 py-0.5 rounded bg-accent-500/20 text-accent-300 text-xs font-medium">
              {targetPosition}
            </span>
          </span>
          <span className="text-slate-500 text-xs">— AI 将针对此岗位生成面试题</span>
        </div>
      )}
      {!fromExperience && !hasTarget && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-hover/50 border border-surface-border/30 text-sm">
          <Target className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">未设置目标岗位</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary-400 hover:text-primary-300 underline text-xs"
          >
            去工作台设置
          </button>
          <span className="text-slate-500 text-xs">— 设置后可获得针对性面试题</span>
        </div>
      )}

      {/* 标签切换 */}
      <div className="flex gap-1 p-1 bg-surface-dark rounded-xl">
        <button
          onClick={() => setActiveTab('start')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'start'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          开始面试
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          历史对比
        </button>
      </div>

      {activeTab === 'start' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {interviewTypes.map((type) => {
              const Icon = type.icon
              return (
                <div
                  key={type.key}
                  className="card flex flex-col items-center text-center p-8 hover:border-primary-500/50 transition-colors cursor-pointer group"
                  onClick={() => handleStart(type.key)}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${type.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{type.title}</h3>
                  <p className="text-slate-400 text-sm mb-5">{type.description}</p>
                  <button className="btn-primary w-full max-w-[200px]">开始面试</button>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          {historyLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
            </div>
          ) : historyData.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface-hover mx-auto flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">暂无面试记录</h3>
              <p className="text-slate-400 text-sm mb-4">完成至少 2 次模拟面试后，这里将展示各轮次的能力对比</p>
              <button onClick={() => setActiveTab('start')} className="btn-primary">
                开始第一次面试
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          ) : roundGroups.length < 2 ? (
            <div className="card text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface-hover mx-auto flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">需要更多面试数据</h3>
              <p className="text-slate-400 text-sm mb-4">
                当前仅有 {roundGroups.length} 次面试记录，再完成 1 次即可看到能力对比图
              </p>
              <button onClick={() => setActiveTab('start')} className="btn-primary">
                再来一次面试
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 雷达图叠加对比 */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                  <h3 className="text-lg font-semibold text-white">面试能力对比</h3>
                </div>
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                      {roundGroups.map((round, idx) => (
                        <Radar
                          key={round.date}
                          name={round.date}
                          dataKey={round.date}
                          stroke={roundColors[idx % roundColors.length]}
                          fill={roundColors[idx % roundColors.length]}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {/* 图例 */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                  {roundGroups.map((round, idx) => (
                    <div key={round.date} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: roundColors[idx % roundColors.length] }}
                      />
                      <span className="text-sm text-slate-400">{round.date}</span>
                      <span className="text-sm font-medium text-white">{round.avgScore}分</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 各轮次得分明细 */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent-400" />
                  <h3 className="text-lg font-semibold text-white">维度得分明细</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border/30">
                        <th className="text-left py-2 text-slate-400 font-medium">维度</th>
                        {roundGroups.map((round, idx) => (
                          <th key={round.date} className="text-center py-2 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: roundColors[idx % roundColors.length] }}
                              />
                              <span className="text-slate-300 font-medium">{round.date}</span>
                            </div>
                          </th>
                        ))}
                        <th className="text-center py-2 text-slate-400 font-medium">趋势</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allDimensions.map((dim) => {
                        const scores = roundGroups.map((r) => r.dimensionScores[dim] ?? 0)
                        const firstScore = scores[0] || 0
                        const lastScore = scores[scores.length - 1] || 0
                        const diff = lastScore - firstScore
                        return (
                          <tr key={dim} className="border-b border-surface-border/10">
                            <td className="py-2.5 text-slate-300">{dim}</td>
                            {scores.map((score, idx) => (
                              <td key={idx} className="text-center py-2.5">
                                <span className={score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-accent-400' : 'text-red-400'}>
                                  {score}
                                </span>
                              </td>
                            ))}
                            <td className="text-center py-2.5">
                              <span className={diff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {diff >= 0 ? '+' : ''}{diff}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}