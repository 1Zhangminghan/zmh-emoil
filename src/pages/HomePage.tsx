import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useProfileStore } from '@/store/useProfileStore'
import { useQuizStore } from '@/store/useQuizStore'
import { positionApi, type PositionItem } from '@/api'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts'
import {
  FileText, MessageSquare, Target, TrendingUp, Award, Clock, AlertCircle, ArrowRight, Zap,
  BookOpen, Brain, Settings2, Check, ChevronDown, X, Building2, BadgeCheck, BarChart3,
} from 'lucide-react'

const industries = ['互联网', '金融', '教育', '医疗', '制造业', '快消', '咨询', '能源', '汽车', '高校/科研']

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    targetPosition, targetIndustry, setTargetPosition,
    latestDiagnosis, activities, getLearningProgress,
  } = useProfileStore()
  const { answerHistory } = useQuizStore()

  const [positions, setPositions] = useState<PositionItem[]>([])
  useEffect(() => {
    positionApi.getFlat().then(setPositions).catch(() => {})
  }, [])

  // 选择器展开状态
  const [showSelector, setShowSelector] = useState(false)
  const [editIndustry, setEditIndustry] = useState(targetIndustry || '')
  const [editPosition, setEditPosition] = useState(targetPosition || '')

  // 从 profile 和 quiz store 读取真实数据
  const resumeScore = latestDiagnosis?.totalScore ?? 0
  const interviewCount = activities.filter((a) => a.type === 'interview').length
  const learningProgress = getLearningProgress()
  const weakCount = latestDiagnosis
    ? latestDiagnosis.dimensions.filter((d) => latestDiagnosis.dimensionScores[d] < 60).length
    : 0
  const answeredCount = Object.keys(answerHistory).length

  const statCards = [
    { id: 1, label: '简历评分', value: resumeScore || '--', suffix: resumeScore ? '分' : '', icon: Award, color: 'text-primary-400', bgColor: 'bg-primary-500/10' },
    { id: 2, label: '面试次数', value: interviewCount, suffix: '次', icon: MessageSquare, color: 'text-accent-400', bgColor: 'bg-accent-500/10' },
    { id: 3, label: '学习进度', value: learningProgress, suffix: '%', icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    { id: 4, label: '刷题数量', value: answeredCount, suffix: '题', icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  ]

  const displayActivities = activities.length > 0
    ? activities.slice(0, 5)
    : [
        { id: 'empty1', icon: FileText, text: '去创建你的第一份简历', time: '', color: 'text-primary-400' },
        { id: 'empty2', icon: Target, text: '完成能力诊断，获取学习计划', time: '', color: 'text-accent-400' },
      ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'resume': return FileText
      case 'interview': return MessageSquare
      case 'diagnosis': return Target
      case 'quiz': return Brain
      case 'learning': return BookOpen
      default: return Zap
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'resume': return 'text-primary-400'
      case 'interview': return 'text-accent-400'
      case 'diagnosis': return 'text-emerald-400'
      case 'quiz': return 'text-purple-400'
      case 'learning': return 'text-cyan-400'
      default: return 'text-slate-400'
    }
  }

  const handleSave = () => {
    if (editPosition) {
      setTargetPosition(editPosition, editIndustry)
    }
    setShowSelector(false)
  }

  const handleOpenSelector = () => {
    setEditIndustry(targetIndustry || '')
    setEditPosition(targetPosition || '')
    setShowSelector(true)
  }

  const hasTarget = targetPosition && targetIndustry

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="card bg-gradient-to-br from-primary-600/20 to-accent-500/10 border-primary-500/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">
              你好，{user?.nickname || '求职者'}
            </h2>

            {/* 目标岗位/行业：可点击切换 */}
            {showSelector ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* 行业下拉 */}
                  <div className="relative">
                    <label className="text-xs text-slate-400 mb-1 block">目标行业</label>
                    <select
                      value={editIndustry}
                      onChange={(e) => setEditIndustry(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-surface-dark border border-surface-border text-white text-sm focus:outline-none focus:border-primary-500 min-w-[140px]"
                    >
                      <option value="">请选择行业</option>
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                  {/* 岗位下拉 */}
                  <div className="relative">
                    <label className="text-xs text-slate-400 mb-1 block">目标岗位</label>
                    <select
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-surface-dark border border-surface-border text-white text-sm focus:outline-none focus:border-primary-500 min-w-[160px]"
                    >
                      <option value="">请选择岗位</option>
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.name}>{pos.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* 确认/取消 */}
                  <div className="flex items-center gap-2 pt-5">
                    <button
                      onClick={handleSave}
                      disabled={!editPosition}
                      className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      确认
                    </button>
                    <button
                      onClick={() => setShowSelector(false)}
                      className="px-3 py-2 rounded-lg bg-surface-hover hover:bg-surface-border text-slate-300 text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      取消
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                {hasTarget ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20">
                      <Building2 className="w-4 h-4 text-primary-400" />
                      <span className="text-primary-300 font-medium">{targetIndustry}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-500/10 border border-accent-500/20">
                      <BadgeCheck className="w-4 h-4 text-accent-400" />
                      <span className="text-accent-300 font-medium">{targetPosition}</span>
                    </div>
                    <button
                      onClick={handleOpenSelector}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-hover hover:bg-surface-border text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      修改
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleOpenSelector}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 border border-dashed border-primary-500/30 hover:border-primary-500/60 hover:bg-primary-500/20 text-primary-300 hover:text-primary-200 text-sm transition-all"
                  >
                    <Target className="w-4 h-4" />
                    设置目标行业和岗位，AI 为你精准匹配
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
                <p className="text-slate-400 text-sm mt-3">
                  {latestDiagnosis
                    ? `上次诊断评分 ${latestDiagnosis.totalScore} 分，继续加油！`
                    : '设置目标后，简历和面试将自动匹配对应岗位'}
                </p>
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-primary-600/30 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/resume')}
          className="btn-primary flex items-center justify-center gap-2.5 py-4 text-base"
        >
          <FileText className="w-5 h-5" />
          优化简历
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
        <button
          onClick={() => navigate('/diagnosis')}
          className="btn-primary flex items-center justify-center gap-2.5 py-4 text-base"
        >
          <Target className="w-5 h-5" />
          水平诊断
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
        <button
          onClick={() => navigate('/interview')}
          className="btn-primary flex items-center justify-center gap-2.5 py-4 text-base"
        >
          <MessageSquare className="w-5 h-5" />
          模拟面试
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
      </div>

      {/* 数据卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.id} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center shrink-0`}>
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

      {/* 能力雷达图 + 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 能力雷达图 */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">能力画像</h3>
          </div>
          {latestDiagnosis ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-slate-400">{latestDiagnosis.positionName}</span>
                <span className="badge-accent text-xs">{latestDiagnosis.recruitmentType === 'fall' ? '秋招' : latestDiagnosis.recruitmentType === 'spring' ? '春招' : '日常实习'}</span>
                <span className="text-sm text-slate-500">{latestDiagnosis.graduationYear}届</span>
              </div>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart
                    data={latestDiagnosis.dimensions.map((dim) => ({
                      dimension: dim.length > 4 ? dim.slice(0, 4) : dim,
                      full: dim,
                      score: latestDiagnosis.dimensionScores[dim] || 0,
                      fullMark: 100,
                    }))}
                    cx="50%" cy="50%" outerRadius="70%"
                  >
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                    <Radar name="能力值" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {latestDiagnosis.dimensions.map((dim) => (
                  <div key={dim} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                    <span className="text-slate-400">{dim}</span>
                    <span className="text-slate-300 font-medium">{latestDiagnosis.dimensionScores[dim]}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-surface-hover mx-auto flex items-center justify-center mb-3">
                <BarChart3 className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm mb-3">暂无能力画像数据</p>
              <button
                onClick={() => navigate('/diagnosis')}
                className="text-primary-400 hover:text-primary-300 text-sm underline"
              >
                去完成能力诊断，生成你的能力画像
              </button>
            </div>
          )}
        </div>

        {/* 最近活动 */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-white">最近活动</h3>
          </div>
        {displayActivities.length > 0 ? (
          <div className="space-y-4">
            {displayActivities.map((activity, idx) => {
              const Icon = 'icon' in activity && typeof activity.icon === 'function'
                ? activity.icon as React.ComponentType<{ className?: string }>
                : getActivityIcon((activity as { type?: string }).type || '')
              const color = 'color' in activity && typeof activity.color === 'string'
                ? activity.color
                : getActivityColor((activity as { type?: string }).type || '')
              const text = 'text' in activity ? activity.text : ''
              const time = 'time' in activity ? activity.time : ''
              return (
                <div key={activity.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm truncate">{text}</p>
                  </div>
                  <span className="text-slate-500 text-xs shrink-0">{time}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-4">暂无活动记录，开始使用产品吧</p>
        )}
        </div>
      </div>
    </div>
  )
}