import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { evaluateInterviewAnswer } from '@/services/aiService'
import { Send, Loader2, Star, ChevronRight, Sparkles, ThumbsUp, AlertCircle, Volume2, VolumeX, Mic, MicOff } from 'lucide-react'
import { interviewApi } from '@/api'
import { useProfileStore } from '@/store/useProfileStore'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface AnswerRecord {
  question: string
  answer: string
  score: number
  feedback: string
  highlights: string[]
  improvements: string[]
  dimension: string
}

export default function InterviewRoom() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const profileStore = useProfileStore()
  const interviewType = (location.state as { interviewType?: string })?.interviewType || 'technical'
  const locationTargetPosition = (location.state as { targetPosition?: string })?.targetPosition
  const locationTargetIndustry = (location.state as { targetIndustry?: string })?.targetIndustry
  const targetPosition = locationTargetPosition || profileStore.targetPosition
  const targetIndustry = locationTargetIndustry || profileStore.targetIndustry

  // 语音功能
  const tts = useSpeechSynthesis()
  const stt = useSpeechRecognition()

  const [questions, setQuestions] = useState<Array<{ question: string; dimension: string }>>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    interviewApi.getQuestions(interviewType)
      .then((data) => {
        if (cancelled) return
        setQuestions(data)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError('加载面试题失败，请检查网络连接')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [interviewType])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<number>>(new Set())
  const mountedRef = useRef(true)

  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentIndex, isAnalyzing])

  // 语音识别文本同步到输入框
  useEffect(() => {
    if (stt.transcript) {
      setInputValue(stt.transcript)
    }
  }, [stt.transcript])

  // 切换题目时停止朗读
  useEffect(() => {
    tts.stop()
    stt.stopListening()
  }, [currentIndex])

  const handleSubmit = async () => {
    if (!inputValue.trim()) return

    const currentQuestion = questions[currentIndex]
    setIsAnalyzing(true)

    try {
      const evaluation = await evaluateInterviewAnswer(
        currentQuestion.question,
        inputValue,
        currentQuestion.dimension,
        targetPosition || '前端开发',
        interviewType,
      )

      if (!mountedRef.current) return

      const record: AnswerRecord = {
        question: currentQuestion.question,
        answer: inputValue,
        score: evaluation.score,
        feedback: evaluation.feedback,
        highlights: evaluation.highlights,
        improvements: evaluation.improvements,
        dimension: currentQuestion.dimension,
      }

      setAnswers((prev) => [...prev, record])
      setSubmittedAnswers((prev) => new Set(prev).add(currentIndex))
      setShowFeedback(true)
    } catch (err: any) {
      if (!mountedRef.current) return
      // AI 评估失败时使用本地降级评分
      const record: AnswerRecord = {
        question: currentQuestion.question,
        answer: inputValue,
        score: 70,
        feedback: 'AI 评估暂时不可用，请稍后重试。以下为默认反馈：回答已记录，建议结合岗位要求进行针对性练习。',
        highlights: ['回答已记录'],
        improvements: ['建议参考面试经验分享，了解该岗位高频考点'],
        dimension: currentQuestion.dimension,
      }
      setAnswers((prev) => [...prev, record])
      setSubmittedAnswers((prev) => new Set(prev).add(currentIndex))
      setShowFeedback(true)
    } finally {
      if (mountedRef.current) setIsAnalyzing(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setInputValue('')
      setShowFeedback(false)
    } else {
      setInterviewCompleted(true)
    }
  }

  const handleViewReport = () => {
    navigate(`/interview/${id}/report`, {
      state: { answers, interviewType, totalQuestions: questions.length },
    })
  }

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + (showFeedback ? 1 : 0)) / questions.length) * 100 : 0

  // 加载中
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4" />
        <p className="text-slate-400">正在加载面试题目...</p>
      </div>
    )
  }

  // 加载失败
  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 mb-4">{loadError}</p>
          <button onClick={() => navigate('/interview')} className="btn-primary">
            返回面试列表
          </button>
        </div>
      </div>
    )
  }

  // 无题目
  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-30" />
          <p className="text-slate-400 mb-4">暂无面试题目</p>
          <button onClick={() => navigate('/interview')} className="btn-primary">
            返回面试列表
          </button>
        </div>
      </div>
    )
  }

  if (interviewCompleted) {
    const totalScore = Math.round(answers.reduce((sum, a) => sum + a.score, 0) / answers.length)
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto">
            <Star className="w-10 h-10 text-accent-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">面试完成！</h2>
          <p className="text-slate-400">
            你已完成全部 {questions.length} 道题目，平均得分
            <span className="text-accent-400 font-bold text-xl mx-1">{totalScore}</span>
            分
          </p>
        </div>
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white">答题概览</h3>
          <div className="space-y-3">
            {answers.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover/50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-xs font-medium shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-300 truncate">{record.question}</span>
                </div>
                <span className={`text-sm font-semibold shrink-0 ml-3 ${record.score >= 80 ? 'text-emerald-400' : record.score >= 70 ? 'text-accent-400' : 'text-red-400'}`}>
                  {record.score}分
                </span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleViewReport} className="btn-accent w-full">
          查看面试报告
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {interviewType === 'technical' ? '技术面' :
             interviewType === 'hr' ? 'HR面' :
             interviewType === 'comprehensive' ? '综合面' : '行为面'}
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">第 {currentIndex + 1}/{questions.length} 题</p>
          {targetPosition && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-xs text-primary-300">针对 {targetIndustry}/{targetPosition} 定制面试题</span>
            </div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.max(progress, ((currentIndex) / questions.length) * 100)}%` }}
        />
      </div>

      {/* 对话区域 */}
      <div className="space-y-4">
        {/* 问题气泡 */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0 mt-1">
            <span className="text-primary-400 text-xs font-bold">AI</span>
          </div>
          <div className="card flex-1 !p-4 bg-surface-hover/50">
            <div className="flex items-start justify-between gap-2">
              <p className="text-white text-sm leading-relaxed flex-1">{currentQuestion.question}</p>
              {tts.isSupported && (
                <button
                  onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(currentQuestion.question)}
                  className={`p-2 rounded-lg shrink-0 transition-all ${
                    tts.isSpeaking
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-slate-500 hover:text-primary-400 hover:bg-surface-hover'
                  }`}
                  title={tts.isSpeaking ? '停止朗读' : '朗读题目'}
                >
                  {tts.isSpeaking ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 用户回答气泡 */}
        {showFeedback && answers[currentIndex] && (
          <div className="flex gap-3 justify-end">
            <div className="card flex-1 !p-4 bg-primary-600/10 border-primary-500/20 max-w-[80%]">
              <p className="text-slate-300 text-sm leading-relaxed">{answers[currentIndex].answer}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center shrink-0 mt-1">
              <span className="text-accent-400 text-xs font-bold">我</span>
            </div>
          </div>
        )}

        {/* AI分析中 */}
        {isAnalyzing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0 mt-1">
              <span className="text-primary-400 text-xs font-bold">AI</span>
            </div>
            <div className="card flex-1 !p-4 bg-surface-hover/50">
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI正在分析你的回答...</span>
              </div>
            </div>
          </div>
        )}

        {/* 反馈卡片 */}
        {showFeedback && answers[currentIndex] && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0 mt-1">
              <span className="text-primary-400 text-xs font-bold">AI</span>
            </div>
            <div className="card flex-1 !p-4 border-accent-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-accent">
                  {answers[currentIndex].score}分
                </span>
                <span className="text-xs text-slate-500">{answers[currentIndex].dimension}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{answers[currentIndex].feedback}</p>
              {/* 亮点 */}
              {answers[currentIndex].highlights.length > 0 && (
                <div className="mt-3 space-y-1">
                  {answers[currentIndex].highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-emerald-400">
                      <ThumbsUp className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* 改进建议 */}
              {answers[currentIndex].improvements.length > 0 && (
                <div className="mt-2 space-y-1">
                  {answers[currentIndex].improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleNext}
                className="btn-primary mt-4 flex items-center gap-1.5"
              >
                {currentIndex < questions.length - 1 ? (
                  <>下一题<ChevronRight className="w-4 h-4" /></>
                ) : (
                  '完成面试'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      {!showFeedback && !isAnalyzing && (
        <div className="card !p-4 space-y-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={stt.isListening ? '正在聆听你的回答...' : '在此输入你的回答，或点击麦克风语音输入...'}
            rows={4}
            className="input-field resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmit()
              }
            }}
          />
          {/* 语音识别错误提示 */}
          {stt.error && (
            <p className="text-xs text-red-400">{stt.error}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {stt.isSupported ? (
                <button
                  onClick={() => stt.isListening ? stt.stopListening() : stt.startListening()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    stt.isListening
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                      : 'bg-surface-hover text-slate-400 hover:text-white border border-surface-border/30'
                  }`}
                  title={stt.isListening ? '停止录音' : '语音输入'}
                >
                  {stt.isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      停止录音
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      语音输入
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MicOff className="w-3.5 h-3.5" />
                  语音输入仅支持 Chrome 浏览器
                </span>
              )}
              {stt.isListening && (
                <span className="text-xs text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  录音中
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Ctrl + Enter 快速提交</span>
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                className="btn-primary flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                提交回答
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}