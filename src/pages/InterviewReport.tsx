import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  TrendingUp, Award, ChevronDown, ChevronUp, ArrowLeft, Star,
  ThumbsUp, Lightbulb, Target, FileText, Loader2, Sparkles,
  Zap, BookOpen, Brain,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { generateInterviewReport } from '@/services/aiService'
import { useProfileStore } from '@/store/useProfileStore'
import type { InterviewReport as InterviewReportType } from '@/api/index'

interface AnswerRecord {
  question: string
  answer: string
  score: number
  feedback: string
  highlights: string[]
  improvements: string[]
  dimension: string
}

export default function InterviewReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { targetPosition } = useProfileStore()

  const state = location.state as {
    answers?: AnswerRecord[]
    interviewType?: string
    totalQuestions?: number
  } | null

  const answers: AnswerRecord[] = state?.answers ?? []
  const interviewType = state?.interviewType ?? 'technical'
  const totalQuestions = state?.totalQuestions ?? 5

  const mountedRef = useRef(true)
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<InterviewReportType | null>(null)

  const totalScore = answers.length > 0
    ? Math.round(answers.reduce((sum, a) => sum + a.score, 0) / answers.length)
    : 0

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (answers.length === 0) {
      setLoading(false)
      return
    }

    const run = async () => {
      setLoading(true)
      try {
        const result = await generateInterviewReport(
          answers,
          interviewType,
          targetPosition || '',
        )
        if (mountedRef.current) setReport(result)
      } catch {
        // 降级到本地计算已在 aiService 中处理
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }
    run()
  }, [answers, interviewType, targetPosition])

  // 使用 AI 报告或从 answers 中计算
  const dimensionScores = report?.dimensionScores || (() => {
    const dimMap = new Map<string, number[]>()
    answers.forEach((a) => {
      const dim = a.dimension || '综合'
      if (!dimMap.has(dim)) dimMap.set(dim, [])
      dimMap.get(dim)!.push(a.score)
    })
    return Array.from(dimMap.entries()).map(([dimension, scores]) => ({
      dimension,
      score: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }))
  })()

  const strengths = report?.strengths || [...new Set(answers.flatMap((a) => a.highlights || []))].slice(0, 3)
  const weaknesses = report?.weaknesses || [...new Set(answers.flatMap((a) => a.improvements || []))].slice(0, 3)
  const suggestions = report?.suggestions || []

  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const typeLabel =
    interviewType === 'technical' ? '技术面' :
    interviewType === 'hr' ? 'HR面' :
    interviewType === 'comprehensive' ? '综合面' : '行为面'

  const scoreColor = totalScore >= 85 ? 'text-emerald-400' : totalScore >= 75 ? 'text-accent-400' : totalScore >= 65 ? 'text-primary-400' : 'text-red-400'
  const scoreBg = totalScore >= 85 ? 'bg-emerald-500/10 border-emerald-500/30' : totalScore >= 75 ? 'bg-accent-500/10 border-accent-500/30' : totalScore >= 65 ? 'bg-primary-500/10 border-primary-500/30' : 'bg-red-500/10 border-red-500/30'

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/interview')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回面试列表
        </button>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <FileText className="w-4 h-4" />
          导出 PDF
        </button>
      </div>

      {/* 总分头部 */}
      <div className={`card border-2 ${scoreBg} text-center space-y-3`}>
        <div className="flex items-center justify-center gap-2">
          <Award className="w-6 h-6 text-accent-400" />
          <h2 className="text-xl font-bold text-white">面试报告</h2>
        </div>
        <div>
          <p className={`text-6xl font-extrabold ${scoreColor}`}>{totalScore}</p>
          <p className="text-slate-400 text-sm mt-1">综合评分</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <span className="badge-accent">{typeLabel}</span>
          <span className="text-sm text-slate-400">{totalQuestions} 道题目</span>
          <span className="text-sm text-slate-400">约 25 分钟</span>
        </div>
      </div>

      {/* AI 综合评估总结 */}
      {(report?.summary || loading) && (
        <div className="card bg-gradient-to-br from-primary-600/5 to-accent-500/5 border-primary-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-semibold text-white">AI 综合评估</h3>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI 正在生成评估报告...</span>
            </div>
          ) : (
            <p className="text-sm text-slate-300 leading-relaxed">{report?.summary}</p>
          )}
        </div>
      )}

      {/* 维度评分图表 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">维度评分</h3>
        </div>
        {dimensionScores.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dimensionScores} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="dimension"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
                cursor={{ fill: '#33415540' }}
              />
              <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={48} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">暂无维度评分数据</p>
        )}
      </div>

      {/* 优势与不足 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">优势</h3>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">分析中...</span>
            </div>
          ) : strengths.length > 0 ? (
            <ul className="space-y-2">
              {strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm py-4">完成更多面试题后生成优势分析</p>
          )}
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-semibold text-white">待提升</h3>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">分析中...</span>
            </div>
          ) : weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {weaknesses.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm py-4">完成更多面试题后生成改进建议</p>
          )}
        </div>
      </div>

      {/* 强化训练入口 */}
      {!loading && dimensionScores.filter((d) => d.score < 70).length > 0 && (
        <div className="card border-accent-500/20 bg-gradient-to-r from-accent-500/5 to-primary-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-semibold text-white">针对性强化训练</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            以下维度得分较低，建议进行专项训练快速提升：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dimensionScores
              .filter((d) => d.score < 70)
              .sort((a, b) => a.score - b.score)
              .map((dim) => (
                <div key={dim.dimension} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover/50 border border-surface-border/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{dim.dimension}</p>
                      <p className="text-xs text-red-400">{dim.score}分 · 待提升</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate('/quiz')}
                      className="px-3 py-1.5 rounded-lg bg-accent-500/15 hover:bg-accent-500/25 text-accent-300 text-xs font-medium transition-colors flex items-center gap-1"
                      title="专项刷题"
                    >
                      <Brain className="w-3 h-3" />
                      刷题
                    </button>
                    <button
                      onClick={() => navigate('/learning')}
                      className="px-3 py-1.5 rounded-lg bg-primary-500/15 hover:bg-primary-500/25 text-primary-300 text-xs font-medium transition-colors flex items-center gap-1"
                      title="学习计划"
                    >
                      <BookOpen className="w-3 h-3" />
                      学习
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 题目回顾 */}
      {answers.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-semibold text-white">题目回顾</h3>
          </div>
          <div className="space-y-3">
            {answers.map((record, index) => {
              const isExpanded = expandedQuestions.has(index)
              return (
                <div key={index} className="rounded-lg border border-surface-border/30 overflow-hidden">
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full flex items-center justify-between p-3 bg-surface-hover/30 hover:bg-surface-hover/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-xs font-medium shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white truncate">{record.question}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className={`text-sm font-semibold ${record.score >= 80 ? 'text-emerald-400' : record.score >= 70 ? 'text-accent-400' : 'text-red-400'}`}>
                        {record.score}分
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-4 border-t border-surface-border/30 space-y-3 bg-surface-dark/50">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">你的回答</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{record.answer || '未回答'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">AI 点评</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{record.feedback}</p>
                      </div>
                      <span className="badge-primary">{record.dimension}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI建议 */}
      <div className="card bg-gradient-to-br from-primary-600/5 to-accent-500/5 border-primary-500/10">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-accent-400" />
          <h3 className="text-lg font-semibold text-white">AI 提升建议</h3>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI 正在生成提升建议...</span>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover/50">
                <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">{suggestion}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4">完成面试后将生成个性化提升建议</p>
        )}
      </div>

      {/* 底部操作按钮 */}
      <div className="flex gap-3">
        <button onClick={() => navigate('/interview')} className="btn-secondary flex-1">
          再来一次
        </button>
        <button onClick={() => navigate('/learning')} className="btn-primary flex-1">
          查看学习建议
        </button>
      </div>
    </div>
  )
}