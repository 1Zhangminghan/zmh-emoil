import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { positionApi, diagnosisApi, type PositionItem, type DiagnosisQuestion } from '@/api'
import { useProfileStore } from '@/store/useProfileStore'
import { Brain, Clock, ChevronRight, CheckCircle, AlertCircle, Loader2, Target, Eye } from 'lucide-react'

const recruitmentLabels: Record<string, string> = {
  fall: '秋招',
  spring: '春招',
  intern: '日常实习',
}

export default function DiagnosisTest() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { recruitmentType?: string; graduationYear?: string } | null

  const recruitmentType = type || state?.recruitmentType || 'fall'
  const graduationYear = state?.graduationYear || '2027'
  const recruitmentLabel = recruitmentLabels[recruitmentType] || '秋招'

  const positionId = id || 'java-backend'

  // 检查是否有上次的诊断报告
  const { loadDiagnosisReport } = useProfileStore()
  const storedReport = loadDiagnosisReport()
  const hasStoredReport = storedReport && storedReport.positionId === positionId && storedReport.recruitmentType === recruitmentType

  // 从后端加载岗位和题目
  const [position, setPosition] = useState<PositionItem | null>(null)
  const [questions, setQuestions] = useState<DiagnosisQuestion[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    setLoadError('')

    Promise.all([
      positionApi.getFlat(),
      diagnosisApi.getQuestions(positionId),
    ])
      .then(([positions, qs]) => {
        if (cancelled) return
        const found = positions.find((p) => p.id === positionId) || positions[0]
        setPosition(found || null)
        setQuestions(qs)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError('加载失败，请检查网络连接')
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false)
      })

    return () => { cancelled = true }
  }, [positionId])

  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = value
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // 模拟AI评分延迟
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setTestCompleted(true)
  }

  // 提交完成后导航到报告页
  useEffect(() => {
    if (!testCompleted) return
    navigate(`/diagnosis/${recruitmentType}/${positionId}/report`, {
      state: {
        recruitmentType,
        graduationYear,
        positionId,
        positionName: position?.name || '',
        dimensions: position?.dimensions || [],
        answers,
        questions: questions.map((q) => ({ dimension: q.dimension, question: q.question })),
      },
    })
  }, [testCompleted])

  // 加载中
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4" />
        <p className="text-slate-400">正在加载测试题目...</p>
      </div>
    )
  }

  // 加载失败
  if (loadError || !position) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 mb-4">{loadError || '未找到岗位数据'}</p>
          <button onClick={() => navigate('/diagnosis')} className="btn-primary">
            返回诊断选择
          </button>
        </div>
      </div>
    )
  }

  // 未开始：显示测试信息卡片
  if (!testStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary-400" />
            能力诊断测试
          </h2>
          <p className="text-slate-400 text-sm mt-1">AI将评估你当前的能力水平，为你生成个性化学习计划</p>
        </div>

        {/* 测试信息卡片 */}
        <div className="card space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{position.name}</h3>
              <p className="text-slate-400 text-sm">{recruitmentLabel} · {graduationYear}届 · 能力诊断测试</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover/50">
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{questions.length}</p>
                <p className="text-xs text-slate-400">题目数量</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover/50">
              <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">~{Math.ceil(questions.length * 3)}</p>
                <p className="text-xs text-slate-400">预计分钟</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-300 mb-3 font-medium">考察维度：</p>
            <div className="flex flex-wrap gap-2">
              {position.dimensions.map((dim, idx) => (
                <span key={idx} className="badge-primary">{dim}</span>
              ))}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button onClick={() => setTestStarted(true)} className="btn-primary w-full text-base">
              <Brain className="w-5 h-5 inline mr-2" />
              开始测试
            </button>
            {hasStoredReport && (
              <button
                onClick={() => navigate(`/diagnosis/${recruitmentType}/${positionId}/report`)}
                className="btn-secondary w-full text-base flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                查看上次诊断报告（{storedReport?.totalScore}分）
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 提交中：显示加载
  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">AI正在评估你的答案...</h3>
          <p className="text-slate-400 text-sm">请稍候，正在生成个性化诊断报告</p>
        </div>
      </div>
    )
  }

  // 答题中
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 头部 */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary-400" />
          {position.name} · 能力诊断
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          第 {currentQuestionIndex + 1}/{questions.length} 题
        </p>
      </div>

      {/* 进度条 */}
      <div className="card !p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">测试进度</span>
          <span className="text-slate-300 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      <div className="card space-y-5">
        {/* 题目元信息 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge-primary">{currentQuestion.dimension}</span>
          <span className={`badge ${currentQuestion.difficulty === 'basic' ? 'badge-success' : currentQuestion.difficulty === 'intermediate' ? 'badge-accent' : 'badge-danger'}`}>
            {currentQuestion.difficulty === 'basic' ? '基础' : currentQuestion.difficulty === 'intermediate' ? '中等' : '困难'}
          </span>
        </div>

        {/* 题目文本 */}
        <div>
          <h3 className="text-lg text-white font-medium leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* 答题区域 */}
        <div className="space-y-3">
          {currentQuestion.type === 'choice' && currentQuestion.options ? (
            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    answers[currentQuestionIndex] === option
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-surface-border/50 bg-surface-hover/30 hover:border-surface-border'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={option}
                    checked={answers[currentQuestionIndex] === option}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      answers[currentQuestionIndex] === option
                        ? 'border-primary-500'
                        : 'border-surface-border'
                    }`}
                  >
                    {answers[currentQuestionIndex] === option && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <span className="text-sm text-slate-200">{option}</span>
                </label>
              ))}
            </div>
          ) : currentQuestion.type === 'short' ? (
            <input
              type="text"
              value={answers[currentQuestionIndex]}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="请输入你的回答..."
              className="input-field"
            />
          ) : (
            <textarea
              value={answers[currentQuestionIndex]}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="请详细阐述你的观点..."
              rows={6}
              className="input-field resize-none"
            />
          )}
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          className="btn-secondary disabled:opacity-30"
        >
          上一题
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestionIndex]?.trim()}
            className={isLastQuestion ? 'btn-accent' : 'btn-primary'}
          >
            {isLastQuestion ? (
              <>
                提交答案
                <CheckCircle className="w-4 h-4 inline ml-1.5" />
              </>
            ) : (
              <>
                下一题
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}