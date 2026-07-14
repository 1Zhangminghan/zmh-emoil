import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizApi, positionApi, type PositionItem } from '@/api'
import type { QuizQuestion } from '@/api'
import { useProfileStore } from '@/store/useProfileStore'
import {
  Code2, Layout, Lightbulb, BarChart3, Palette, Target, Sparkles,
  Brain, ChevronRight, BookOpen, Clock, TrendingUp, FileText,
  MessageSquare, Calculator, Puzzle, BarChart4, Globe, Loader2,
  Zap, Wand2, AlertCircle, Layers,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2, Layout, Lightbulb, BarChart3, Palette,
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '言语理解': MessageSquare,
  '数量关系': Calculator,
  '判断推理': Puzzle,
  '资料分析': BarChart4,
  '常识判断': Globe,
}

export default function QuizCenter() {
  const navigate = useNavigate()
  const { targetPosition, latestDiagnosis } = useProfileStore()
  const [positions, setPositions] = useState<PositionItem[]>([])
  useEffect(() => {
    positionApi.getFlat().then(setPositions).catch(() => {})
  }, [])
  const [activeTab, setActiveTab] = useState<'position' | 'aptitude'>('position')
  const [aptitudeFilter, setAptitudeFilter] = useState('all')
  const [aptitudeQuestions, setAptitudeQuestions] = useState<QuizQuestion[]>([])
  const [aptitudeLoading, setAptitudeLoading] = useState(false)

  // 岗位题库统计
  const [positionStats, setPositionStats] = useState<Record<string, number>>({})
  const [statsLoading, setStatsLoading] = useState(false)
  const [generatingPositions, setGeneratingPositions] = useState<Set<string>>(new Set())
  const [generatingDim, setGeneratingDim] = useState<string | null>(null)
  const [dimGenError, setDimGenError] = useState('')

  // 点击弱项维度：AI 生成针对性题目 → 跳转刷题
  const handleWeakDimClick = async (dim: string) => {
    setGeneratingDim(dim)
    setDimGenError('')
    try {
      const result = await quizApi.generateAptitudeQuestions({ category: dim, count: 10 })
      if (result.generated && result.questions?.length > 0) {
        navigate(`/quiz/aptitude?start=first`, { state: { filter: dim } })
        return
      }
      setDimGenError(`「${dim}」题目生成失败，请稍后重试`)
    } catch (err: any) {
      setDimGenError(err.message || `「${dim}」题目生成失败，请检查 AI 配置`)
    } finally {
      setGeneratingDim(null)
    }
  }

  // 加载岗位题库统计
  useEffect(() => {
    if (activeTab !== 'position') return
    let cancelled = false
    setStatsLoading(true)
    quizApi.getPositionStats()
      .then((stats) => {
        if (!cancelled) setPositionStats(stats)
      })
      .catch(() => {
        if (!cancelled) setPositionStats({})
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => { cancelled = true }
  }, [activeTab])

  // 为单个岗位生成题目
  const handleGenerateForPosition = useCallback(async (positionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setGeneratingPositions((prev) => new Set(prev).add(positionId))
    try {
      await quizApi.generatePositionQuestions(positionId, 10)
      // 刷新统计
      const stats = await quizApi.getPositionStats()
      setPositionStats(stats)
    } catch {
      // 静默处理，统计会显示变化
    } finally {
      setGeneratingPositions((prev) => {
        const next = new Set(prev)
        next.delete(positionId)
        return next
      })
    }
  }, [])

  // 一键批量生成所有空题库岗位
  const handleBatchGenerate = useCallback(async () => {
    const emptyPositions = positions.filter((p) => !positionStats[p.id])
    if (emptyPositions.length === 0) return

    for (const pos of emptyPositions) {
      setGeneratingPositions((prev) => new Set(prev).add(pos.id))
      try {
        await quizApi.generatePositionQuestions(pos.id, 10)
      } catch {
        // 继续处理下一个
      }
    }
    // 刷新统计
    const stats = await quizApi.getPositionStats()
    setPositionStats(stats)
    setGeneratingPositions(new Set())
  }, [positions, positionStats])

  // AI 生成题目状态
  const [genCategory, setGenCategory] = useState('all')
  const [genCount, setGenCount] = useState(10)
  const [genDifficulty, setGenDifficulty] = useState('all')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  // 从后端 API 加载行测题目
  useEffect(() => {
    if (activeTab !== 'aptitude') return
    let cancelled = false
    setAptitudeLoading(true)
    quizApi.getAptitudeQuestions()
      .then((data) => {
        if (cancelled) return
        setAptitudeQuestions(data)
      })
      .catch(() => {
        if (cancelled) return
        setAptitudeQuestions([])
      })
      .finally(() => {
        if (!cancelled) setAptitudeLoading(false)
      })
    return () => { cancelled = true }
  }, [activeTab])

  // 从后端数据动态计算分类
  const aptitudeCategories = (() => {
    const categoryMap = new Map<string, number>()
    aptitudeQuestions.forEach((q) => {
      categoryMap.set(q.category, (categoryMap.get(q.category) || 0) + 1)
    })
    const categories = [
      { id: 'all', label: '全部', count: aptitudeQuestions.length },
    ]
    categoryMap.forEach((count, name) => {
      categories.push({ id: name, label: name, count })
    })
    return categories
  })()

  const filteredAptitude = aptitudeFilter === 'all'
    ? aptitudeQuestions
    : aptitudeQuestions.filter((q) => q.category === aptitudeFilter)

  // AI 生成题目
  const handleGenerate = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const result = await quizApi.generateAptitudeQuestions({
        category: genCategory,
        count: genCount,
        difficulty: genDifficulty,
      })
      // 刷新题目列表
      const all = await quizApi.getAptitudeQuestions()
      setAptitudeQuestions(all)
      setAptitudeFilter('all')
      // 跳转到新生成的题目
      if (result.questions && result.questions.length > 0) {
        navigate(`/quiz/aptitude?start=${result.questions[0].id}`)
      }
    } catch (err: any) {
      setGenError(err.message || '生成失败，请检查 AI 配置后重试')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary-400" />
          刷题系统
        </h2>
        <p className="text-slate-400 text-sm mt-1">系统练习笔试真题，提升笔试通过率</p>
      </div>

      {/* 智能推荐 - 基于诊断弱项 */}
      {latestDiagnosis && (() => {
        const weakDims = latestDiagnosis.dimensions
          .filter((d) => (latestDiagnosis.dimensionScores[d] ?? 0) < 70)
          .sort((a, b) => (latestDiagnosis.dimensionScores[a] ?? 0) - (latestDiagnosis.dimensionScores[b] ?? 0))
        if (weakDims.length === 0) return null
        return (
          <div className="card border-accent-500/20 bg-gradient-to-r from-accent-500/5 to-primary-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-accent-400" />
              <h3 className="text-base font-semibold text-white">智能推荐</h3>
              <span className="text-xs text-slate-400">基于你的诊断弱项</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              以下维度得分较低，建议优先刷相关题目：
            </p>
            <div className="flex flex-wrap gap-2">
              {weakDims.slice(0, 3).map((dim) => {
                const score = latestDiagnosis.dimensionScores[dim] ?? 0
                const isGenerating = generatingDim === dim
                return (
                  <button
                    key={dim}
                    onClick={() => handleWeakDimClick(dim)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/20 text-accent-300 hover:text-accent-200 text-sm transition-colors disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Target className="w-3.5 h-3.5" />
                    )}
                    <span>{dim}</span>
                    <span className="text-xs text-red-400/80">{score}分</span>
                    {isGenerating ? (
                      <span className="text-xs text-accent-400/60">生成中...</span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                )
              })}
              {weakDims.length > 0 && (
                <button
                  onClick={() => navigate('/learning')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 text-primary-300 hover:text-primary-200 text-sm transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  查看学习计划
                </button>
              )}
            </div>
            {dimGenError && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {dimGenError}
              </p>
            )}
          </div>
        )
      })()}

      {/* 顶部标签切换 */}
      <div className="flex gap-1 p-1 bg-surface-dark rounded-xl">
        <button
          onClick={() => setActiveTab('position')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'position'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          岗位题库
        </button>
        <button
          onClick={() => setActiveTab('aptitude')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'aptitude'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" />
          行测题库
        </button>
      </div>

      {/* 岗位题库 */}
      {activeTab === 'position' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-400" />
              <h3 className="text-base font-semibold text-white">选择目标岗位，进入专属题库</h3>
            </div>
            {!statsLoading && positions.filter((p) => !positionStats[p.id]).length > 0 && (
              <button
                onClick={handleBatchGenerate}
                disabled={generatingPositions.size > 0}
                className="btn-accent text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
              >
                {generatingPositions.size > 0 ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    批量生成中...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    一键生成 {positions.filter((p) => !positionStats[p.id]).length} 个岗位题库
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-slate-400 text-sm mb-4">每个岗位的题库相互独立，针对性练习。题库为空的岗位可一键 AI 生成</p>
          {targetPosition && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-sm">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-slate-300">你的目标岗位是</span>
              <span className="text-primary-300 font-medium">{targetPosition}</span>
              <span className="text-slate-500">— 已为你高亮推荐</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map((position) => {
              const Icon = iconMap[position.icon] || Target
              const isRecommended = targetPosition && position.name === targetPosition
              const questionCount = positionStats[position.id]
              const hasQuestions = questionCount !== undefined && questionCount > 0
              const isGenerating = generatingPositions.has(position.id)
              return (
                <button
                  key={position.id}
                  onClick={() => navigate(`/quiz/position/${position.id}`)}
                  className={`card text-left transition-all duration-200 hover:border-primary-500/30 hover:bg-surface-hover/20 group relative ${
                    isRecommended ? 'border-primary-500/40 bg-primary-500/5 ring-1 ring-primary-500/20' : ''
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300">
                      推荐
                    </span>
                  )}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 group-hover:bg-primary-500/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                        {position.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="badge-primary text-xs">{position.industry}</span>
                        {statsLoading ? (
                          <span className="text-xs text-slate-500">加载中...</span>
                        ) : hasQuestions ? (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                            {questionCount} 题
                          </span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                            题库为空
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary-400 transition-colors mt-2" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {position.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="px-2 py-0.5 text-xs rounded-md bg-surface-hover text-slate-300 border border-surface-border/30">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-3">
                    {position.description}
                  </p>
                  {/* 无题库时显示 AI 生成入口 */}
                  {!statsLoading && !hasQuestions && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-auto pt-2 border-t border-surface-border/20"
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-2 text-xs text-accent-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          AI 正在生成题目...
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleGenerateForPosition(position.id, e)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent-500/10 text-accent-400 text-xs font-medium hover:bg-accent-500/20 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          AI 生成题库
                        </button>
                      )}
                    </div>
                  )}
                  {/* 已有题库时显示扩充入口 */}
                  {!statsLoading && hasQuestions && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-auto pt-2 border-t border-surface-border/20"
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-2 text-xs text-accent-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          AI 扩充中...
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleGenerateForPosition(position.id, e)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-accent-400/60 text-xs hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
                        >
                          <Wand2 className="w-3 h-3" />
                          扩充题库（+10题）
                        </button>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 行测题库 */}
      {activeTab === 'aptitude' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-accent-400" />
            <h3 className="text-base font-semibold text-white">行测题库 · 全岗位通用</h3>
          </div>
          <p className="text-slate-400 text-sm mb-4">包含完整行测各类题型，适用于所有岗位的笔试准备</p>

          {/* AI 智能出题面板 */}
          <div className="card border-accent-500/20 bg-gradient-to-r from-accent-500/5 to-primary-500/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-accent-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI 智能出题</h3>
                <p className="text-slate-400 text-xs">DeepSeek 实时生成高质量行测题，无限刷题</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {/* 分类选择 */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">分类</label>
                <select
                  value={genCategory}
                  onChange={(e) => setGenCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-surface-border/30 text-sm text-slate-200 focus:outline-none focus:border-accent-500/50"
                >
                  <option value="all">全部类型</option>
                  <option value="言语理解">言语理解</option>
                  <option value="数量关系">数量关系</option>
                  <option value="判断推理">判断推理</option>
                  <option value="资料分析">资料分析</option>
                  <option value="常识判断">常识判断</option>
                </select>
              </div>

              {/* 数量选择 */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">题目数量</label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-surface-border/30 text-sm text-slate-200 focus:outline-none focus:border-accent-500/50"
                >
                  <option value={5}>5 题</option>
                  <option value={10}>10 题</option>
                  <option value={15}>15 题</option>
                  <option value={20}>20 题</option>
                </select>
              </div>

              {/* 难度选择 */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">难度</label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-surface-border/30 text-sm text-slate-200 focus:outline-none focus:border-accent-500/50"
                >
                  <option value="all">混合难度</option>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>

            {genError && (
              <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{genError}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full btn-accent flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI 正在生成题目...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  AI 智能出题
                  <span className="text-xs opacity-70 ml-1">（约10-30秒）</span>
                </>
              )}
            </button>
          </div>

          {/* 分类筛选 */}
          <div className="flex gap-2 flex-wrap">
            {aptitudeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setAptitudeFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  aptitudeFilter === cat.id
                    ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                    : 'bg-surface-hover text-slate-400 hover:text-white border border-surface-border/30'
                }`}
              >
                {cat.label}
                <span className="ml-1.5 text-xs opacity-60">{cat.count}</span>
              </button>
            ))}
          </div>

          {/* 题目列表 */}
          {aptitudeLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-accent-400 animate-spin" />
            </div>
          ) : (
          <div className="space-y-2">
            {filteredAptitude.map((q, idx) => {
              const CatIcon = categoryIcons[q.category] || FileText
              const diffColor = q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'medium' ? 'badge-accent' : 'badge-danger'
              const diffLabel = q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'
              return (
                <button
                  key={q.id}
                  onClick={() => navigate(`/quiz/aptitude?start=${q.id}`, { state: { filter: aptitudeFilter } })}
                  className="card text-left p-4 hover:border-primary-500/30 hover:bg-surface-hover/20 transition-all duration-200 w-full"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CatIcon className="w-4 h-4 text-accent-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-slate-400">{q.category}</span>
                        <span className={diffColor}>{diffLabel}</span>
                      </div>
                      <p className="text-sm text-white leading-relaxed line-clamp-2">
                        <span className="text-slate-500 mr-1.5">{idx + 1}.</span>
                        {q.question.replace(/```[\s\S]*?```/g, '').replace(/\n/g, ' ').substring(0, 100)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-2" />
                  </div>
                </button>
              )
            })}
          </div>
          )}

          {/* 开始做题按钮 */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => navigate('/quiz/aptitude', { state: { filter: aptitudeFilter } })}
              className="btn-primary text-base px-8 py-3"
            >
              <BookOpen className="w-5 h-5 inline mr-2" />
              开始刷题
              <ChevronRight className="w-5 h-5 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}