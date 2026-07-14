import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { quizApi, positionApi, type PositionItem } from '@/api'
import { useQuizStore } from '@/store/useQuizStore'
import { useProfileStore } from '@/store/useProfileStore'
import type { QuizQuestion } from '@/api'
import { generateQuizAnalysis } from '@/services/aiService'
import {
  ChevronLeft, ChevronRight, BookOpen, Heart, AlertCircle,
  CheckCircle, XCircle, Sparkles, Clock, Target, BarChart3,
  Bookmark, Star, RotateCcw, Eye, EyeOff, Brain, List, Loader2,
  Zap, Wand2,
} from 'lucide-react'

export default function QuizPractice() {
  const { positionId } = useParams<{ positionId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const { toggleWrong, toggleFavorite, isWrong, isFavorite, recordAnswer, getAnswer } = useQuizStore()
  const answerHistory = useQuizStore((s) => s.answerHistory)
  const { addActivity, learningPlans, toggleLearningTask, learningTaskCompletions } = useProfileStore()

  const [positions, setPositions] = useState<PositionItem[]>([])
  useEffect(() => {
    positionApi.getFlat().then(setPositions).catch(() => {})
  }, [])

  // 确定题库来源
  const isPositionQuiz = !!positionId
  const isAptitude = location.pathname.includes('/quiz/aptitude')
  const startQuestionId = searchParams.get('start')

  // 从后端 API 加载题目
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  // AI 生成岗位笔试题
  const handleGeneratePosition = async () => {
    if (!positionId) return
    setGenerating(true)
    setGenError('')
    try {
      await quizApi.generatePositionQuestions(positionId, 10)
      // 重新加载题目
      const data = await quizApi.getPositionQuestions(positionId)
      setAllQuestions(data.questions)
    } catch (err: any) {
      setGenError(err.message || 'AI 生成失败，请检查 AI 配置后重试')
    } finally {
      setGenerating(false)
    }
  }

  // 扩充已有题库
  const handleExpandBank = async () => {
    if (!positionId) return
    setGenerating(true)
    setGenError('')
    try {
      await quizApi.generatePositionQuestions(positionId, 10)
      const data = await quizApi.getPositionQuestions(positionId)
      setAllQuestions(data.questions)
    } catch (err: any) {
      setGenError(err.message || 'AI 生成失败，请检查 AI 配置后重试')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')

    const loadQuestions = async () => {
      try {
        if (isPositionQuiz && positionId) {
          const data = await quizApi.getPositionQuestions(positionId)
          if (!cancelled) {
            setAllQuestions(data.questions)
            setTitle(data.name)
          }
        } else if (isAptitude) {
          const filter = (location.state as { filter?: string })?.filter
          const questions = await quizApi.getAptitudeQuestions()
          if (!cancelled) {
            const filtered = filter && filter !== 'all'
              ? questions.filter((q) => q.category === filter)
              : questions
            setAllQuestions(filtered)
            // 弱项维度用维度名，标准行测分类用"行测题库"
            const standardAptCategories = ['言语理解', '数量关系', '判断推理', '资料分析', '常识判断']
            setTitle(filter && !standardAptCategories.includes(filter) ? filter : '行测题库')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError('加载题目失败，请检查网络连接')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadQuestions()
    return () => { cancelled = true }
  }, [positionId, isAptitude])

  // 初始题目索引
  const initialIdx = startQuestionId
    ? Math.max(0, allQuestions.findIndex((q) => q.id === startQuestionId))
    : 0

  const [currentIdx, setCurrentIdx] = useState(initialIdx)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showQuestionList, setShowQuestionList] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const hasSyncedRef = useRef(false)

  // 切换题库时重置同步标记
  useEffect(() => {
    hasSyncedRef.current = false
  }, [positionId])

  const currentQuestion = allQuestions[currentIdx] || allQuestions[0]
  const totalQuestions = allQuestions.length

  // 恢复之前的选择（使用 question id 作为依赖，确保数据加载完成后也能正确触发）
  const currentQuestionId = currentQuestion?.id
  useEffect(() => {
    if (!currentQuestionId || !currentQuestion) return
    const saved = getAnswer(currentQuestionId)
    if (saved && saved.length > 0) {
      setSelectedAnswers(saved)
      setSubmitted(true)
    } else {
      setSelectedAnswers([])
      setSubmitted(false)
    }
    setShowAnswer(false)
    setShowAnalysis(false)
    setAiAnalysis(null)
  }, [currentQuestionId])

  // 判断答案是否正确
  const isCorrect = useMemo(() => {
    if (!submitted || selectedAnswers.length === 0) return null
    const correct = [...currentQuestion.answer].sort().join(',')
    const user = [...selectedAnswers].sort().join(',')
    return correct === user
  }, [submitted, selectedAnswers, currentQuestion])

  // 答题进度统计
  const answeredCount = useMemo(() => {
    return allQuestions.filter((q) => answerHistory[q.id]?.length > 0).length
  }, [allQuestions, answerHistory])

  const correctCount = useMemo(() => {
    return allQuestions.filter((q) => {
      const ans = answerHistory[q.id]
      return ans && [...ans].sort().join(',') === [...q.answer].sort().join(',')
    }).length
  }, [allQuestions, answerHistory])

  // 提交答案
  const handleSubmit = async () => {
    if (selectedAnswers.length === 0) return
    setSubmitted(true)
    setShowAnswer(true)
    const correct = [...currentQuestion.answer].sort().join(',')
    const user = [...selectedAnswers].sort().join(',')
    const isCorrect = correct === user

    // 提交到后端并获取AI分析
    const analysis = await recordAnswer(currentQuestion.id, selectedAnswers, isCorrect)
    if (analysis) {
      setAiAnalysis(analysis)
    }

    // 自动标记错题
    if (!isCorrect) {
      if (!isWrong(currentQuestion.id)) toggleWrong(currentQuestion.id)
    }
  }

  // 选项点击
  const handleOptionClick = (idx: number) => {
    if (submitted) return
    if (currentQuestion.type === 'choice') {
      setSelectedAnswers([idx])
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      )
    }
  }

  // 答题卡
  const getQuestionStatus = (q: QuizQuestion) => {
    const ans = answerHistory[q.id]
    if (!ans || ans.length === 0) return 'unanswered'
    const correct = [...ans].sort().join(',') === [...q.answer].sort().join(',')
    return correct ? 'correct' : 'wrong'
  }

  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  // 全部完成时同步进度到学习计划
  useEffect(() => {
    if (answeredCount === totalQuestions && totalQuestions > 0 && !hasSyncedRef.current) {
      hasSyncedRef.current = true
      addActivity({ type: 'quiz', text: `完成了${title}刷题练习`, time: '刚刚' })

      // 刷题进度同步回学习计划
      if (isPositionQuiz && positionId && allQuestions.length > 0) {
        const quizCategories = new Set(allQuestions.map((q) => q.category))
        const matchingPlan = learningPlans.find((p) => p.positionName === title)

        if (matchingPlan) {
          const planId = matchingPlan.id
          matchingPlan.stages.forEach((stage, sIdx) => {
            stage.tasks.forEach((_task, tIdx) => {
              const taskId = `${planId}_s${sIdx}_t${tIdx}`
              const dimension = matchingPlan.dimensions[tIdx % matchingPlan.dimensions.length]
              if (quizCategories.has(dimension)) {
                const planTasks = learningTaskCompletions[planId] || []
                if (!planTasks.includes(taskId)) {
                  toggleLearningTask(planId, taskId)
                }
              }
            })
          })
        }
      }
    }
  }, [answeredCount, totalQuestions])

  return (
    <div className="space-y-4">
      {/* 加载中 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4" />
          <p className="text-slate-400">正在加载题库...</p>
        </div>
      )}

      {/* 加载失败 */}
      {!loading && loadError && (
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 mb-4">{loadError}</p>
          <button onClick={() => navigate('/quiz')} className="btn-primary">
            返回题库
          </button>
        </div>
      )}

      {/* 无题目 */}
      {!loading && !loadError && allQuestions.length === 0 && (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-30" />
          {isPositionQuiz ? (
            <>
              <p className="text-slate-400 mb-2">该岗位暂无题库数据</p>
              <p className="text-slate-500 text-sm mb-4">可前往行测题库进行通用能力练习，或点击下方按钮让 AI 为你生成专属笔试题</p>
              {genError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 mx-auto max-w-md">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">{genError}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => navigate('/quiz')} className="btn-secondary">
                  返回题库
                </button>
                <button
                  onClick={handleGeneratePosition}
                  disabled={generating}
                  className="btn-accent flex items-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI 正在生成题目...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      AI 生成笔试题
                      <span className="text-xs opacity-70 ml-1">（约10-30秒）</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-400 mb-2">暂无题目数据</p>
              <p className="text-slate-500 text-sm mb-4">使用 AI 智能出题生成新题目</p>
              <button onClick={() => navigate('/quiz')} className="btn-primary">
                返回题库
              </button>
            </>
          )}
        </div>
      )}

      {!loading && !loadError && allQuestions.length > 0 && (
        <>
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/quiz')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">返回题库</span>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 text-sm">
              第 {currentIdx + 1}/{totalQuestions} 题
            </p>
            <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-slate-400">
              {currentQuestion.category}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              currentQuestion.difficulty === 'easy' ? 'badge-success' :
              currentQuestion.difficulty === 'medium' ? 'badge-accent' : 'badge-danger'
            }`}>
              {currentQuestion.difficulty === 'easy' ? '简单' : currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
            </span>
            {currentQuestion.type === 'multi' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">多选题</span>
            )}
          </div>
        </div>
        {/* 答题卡按钮 */}
        <button
          onClick={() => setShowQuestionList(!showQuestionList)}
          className="btn-secondary flex items-center gap-1.5"
        >
          <List className="w-4 h-4" />
          答题卡
        </button>
        {isPositionQuiz && (
          <button
            onClick={handleExpandBank}
            disabled={generating}
            className="btn-secondary flex items-center gap-1.5 disabled:opacity-50"
            title="AI 扩充题库"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">扩充题库</span>
          </button>
        )}
      </div>

      {/* 进度条 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-dark rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="text-xs text-slate-400 shrink-0">{answeredCount}/{totalQuestions} 已答</span>
      </div>

      {/* 答题卡面板 */}
      {showQuestionList && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">答题卡</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-slate-400">正确</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-slate-400">错误</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-surface-hover" />
                <span className="text-slate-400">未答</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-10 sm:grid-cols-15 gap-2">
            {allQuestions.map((q, idx) => {
              const status = getQuestionStatus(q)
              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIdx(idx); setShowQuestionList(false) }}
                  className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                    idx === currentIdx ? 'ring-2 ring-primary-400' : ''
                  } ${
                    status === 'correct' ? 'bg-emerald-500/20 text-emerald-400' :
                    status === 'wrong' ? 'bg-red-500/20 text-red-400' :
                    'bg-surface-hover text-slate-400'
                  }`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 题目卡片 */}
      <div className="card">
        {/* 题干 */}
        <div className="mb-6">
          <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
            {currentQuestion.question}
          </p>
          <p className="text-xs text-slate-500 mt-2">{currentQuestion.knowledgePoint}</p>
        </div>

        {/* 选项 */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswers.includes(idx)
            const isCorrectOption = currentQuestion.answer.includes(idx)
            let optionStyle = 'border-surface-border/30 hover:border-primary-500/40'

            if (submitted) {
              if (isCorrectOption) {
                optionStyle = 'border-emerald-500/50 bg-emerald-500/10'
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'border-red-500/50 bg-red-500/10'
              } else {
                optionStyle = 'border-surface-border/30 opacity-60'
              }
            } else if (isSelected) {
              optionStyle = 'border-primary-500 bg-primary-500/10'
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={submitted}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all duration-200 ${optionStyle}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium shrink-0 ${
                  submitted && isCorrectOption ? 'bg-emerald-500/30 text-emerald-300' :
                  submitted && isSelected && !isCorrectOption ? 'bg-red-500/30 text-red-300' :
                  isSelected ? 'bg-primary-500/30 text-primary-300' : 'bg-surface-hover text-slate-400'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm text-slate-200">{option}</span>
                {submitted && isCorrectOption && (
                  <CheckCircle className="w-5 h-5 text-emerald-400 ml-auto shrink-0" />
                )}
                {submitted && isSelected && !isCorrectOption && (
                  <XCircle className="w-5 h-5 text-red-400 ml-auto shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* 提交/结果反馈 */}
        <div className="mt-6">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswers.length === 0}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交答案
            </button>
          ) : (
            <div className="space-y-3">
              {/* 结果提示 */}
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
              }`}>
                {isCorrect ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-emerald-300 font-medium">回答正确！</p>
                      <p className="text-slate-400 text-sm">继续加油，保持状态</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                    <div>
                      <p className="text-red-300 font-medium">回答错误</p>
                      <p className="text-slate-400 text-sm">
                        正确答案：{currentQuestion.answer.map((i) => String.fromCharCode(65 + i)).join('、')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => toggleWrong(currentQuestion.id)}
                  className={`btn-secondary flex items-center gap-1.5 text-sm ${
                    isWrong(currentQuestion.id) ? '!border-red-500/50 !text-red-300' : ''
                  }`}
                >
                  {isWrong(currentQuestion.id) ? (
                    <Bookmark className="w-4 h-4 fill-red-400" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                  {isWrong(currentQuestion.id) ? '已加入错题本' : '加入错题本'}
                </button>
                <button
                  onClick={() => toggleFavorite(currentQuestion.id)}
                  className={`btn-secondary flex items-center gap-1.5 text-sm ${
                    isFavorite(currentQuestion.id) ? '!border-amber-500/50 !text-amber-300' : ''
                  }`}
                >
                  {isFavorite(currentQuestion.id) ? (
                    <Star className="w-4 h-4 fill-amber-400" />
                  ) : (
                    <Star className="w-4 h-4" />
                  )}
                  {isFavorite(currentQuestion.id) ? '已收藏' : '收藏'}
                </button>
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="btn-secondary flex items-center gap-1.5 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  {showAnalysis ? '收起AI解析' : 'AI解析'}
                </button>
              </div>

              {/* AI 解析 */}
              {showAnalysis && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/5 to-accent-500/5 border border-primary-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-accent-400" />
                    <span className="text-sm font-medium text-accent-300">AI 智能解析</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {aiAnalysis || generateQuizAnalysis(
                      currentQuestion.question,
                      currentQuestion.options,
                      currentQuestion.answer,
                      selectedAnswers,
                      isCorrect === true,
                      currentQuestion.knowledgePoint,
                    )}
                  </p>
                  <div className="mt-3 pt-3 border-t border-surface-border/30">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs text-slate-500">知识点：{currentQuestion.knowledgePoint}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部导航 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="btn-secondary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          上一题
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentIdx(0)
              setSelectedAnswers([])
              setSubmitted(false)
              setShowAnswer(false)
              setShowAnalysis(false)
            }}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            重做
          </button>
        </div>

        <button
          onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
          disabled={currentIdx === totalQuestions - 1}
          className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一题
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 完成提示 */}
      {answeredCount === totalQuestions && totalQuestions > 0 && (
        <div className="card border-emerald-500/30 bg-emerald-500/5 text-center py-6">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-semibold text-lg">全部题目已完成！</p>
          <p className="text-slate-400 text-sm mt-1">
            正确率：{Math.round((correctCount / totalQuestions) * 100)}%（{correctCount}/{totalQuestions}）
          </p>
          {genError && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 mx-auto max-w-md">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{genError}</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <button
              onClick={() => {
                setCurrentIdx(0)
                setSelectedAnswers([])
                setSubmitted(false)
              }}
              className="btn-secondary text-sm"
            >
              <RotateCcw className="w-4 h-4 inline mr-1" /> 重新刷题
            </button>
            {isPositionQuiz && (
              <button
                onClick={handleExpandBank}
                disabled={generating}
                className="btn-accent flex items-center gap-1.5 text-sm disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    AI 生成更多题目
                    <span className="text-xs opacity-70">（约10-30秒）</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => navigate('/quiz')}
              className="btn-primary text-sm"
            >
              返回题库
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}