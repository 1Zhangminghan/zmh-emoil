import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useProfileStore } from '@/store/useProfileStore'
import { analyzeResume, type ResumeFormData, type OptimizedResume } from '@/services/aiService'
import { aiStatusApi } from '@/api'
import {
  ChevronLeft, Sparkles, Loader2, TrendingUp,
  Edit3, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  FileText, ArrowLeft, Download, User, GraduationCap,
  Briefcase, FolderGit2, Wrench, Award, Eye, RefreshCw,
} from 'lucide-react'

interface AnalysisResult {
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
  aiPowered?: boolean
  aiError?: string
}

function getScoreColor(score: number) {
  if (score > 80) return 'text-emerald-400'
  if (score >= 60) return 'text-accent-400'
  return 'text-red-400'
}

function getScoreBg(score: number) {
  if (score > 80) return 'bg-emerald-500/10 border-emerald-500/30'
  if (score >= 60) return 'bg-accent-500/10 border-accent-500/30'
  return 'bg-red-500/10 border-red-500/30'
}

function getScoreBar(score: number) {
  if (score > 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-accent-500'
  return 'bg-red-500'
}

// 生成格式化简历文本用于下载
function generateResumeText(resume: OptimizedResume): string {
  const lines: string[] = []

  lines.push('═══════════════════════════════════════════')
  lines.push('  AI 优化简历')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  lines.push('【基本信息】')
  lines.push(`  姓名：${resume.name || '待补充'}`)
  lines.push(`  邮箱：${resume.email || '待补充'}`)
  lines.push(`  电话：${resume.phone || '待补充'}`)
  lines.push(`  目标岗位：${resume.targetPosition || '待补充'}`)
  lines.push(`  目标行业：${resume.targetIndustry || '待补充'}`)
  lines.push('')

  if (resume.education.length > 0) {
    lines.push('【教育经历】')
    resume.education.forEach((e) => {
      lines.push(`  ${e.school} | ${e.degree} | ${e.major} | ${e.time}`)
    })
    lines.push('')
  }

  if (resume.workExperience.length > 0) {
    lines.push('【实习/工作经历】')
    resume.workExperience.forEach((w) => {
      lines.push(`  ▸ ${w.company} | ${w.position} | ${w.time}`)
      lines.push(`    ${w.description}`)
      lines.push('')
    })
  }

  if (resume.projectExperience.length > 0) {
    lines.push('【项目经验】')
    resume.projectExperience.forEach((p) => {
      lines.push(`  ▸ ${p.name} | ${p.role}`)
      lines.push(`    技术栈：${p.techStack || '待补充'}`)
      lines.push(`    ${p.description}`)
      lines.push('')
    })
  }

  if (resume.skills) {
    lines.push('【专业技能】')
    lines.push(`  ${resume.skills}`)
    lines.push('')
  }

  if (resume.certifications) {
    lines.push('【证书与荣誉】')
    lines.push(`  ${resume.certifications}`)
    lines.push('')
  }

  lines.push('═══════════════════════════════════════════')
  lines.push('  由 AI 求职辅导助手生成')
  lines.push('═══════════════════════════════════════════')

  return lines.join('\n')
}

function handleDownload(resume: OptimizedResume) {
  const text = generateResumeText(resume)
  const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${resume.name || '简历'}_AI优化版.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ResumeAnalysis() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: resumeId } = useParams<{ id: string }>()
  const { setTargetPosition, addActivity, saveResumeAnalysis, loadResumeAnalysis, saveResumeId } = useProfileStore()

  // 从 location.state 或 store 中恢复数据
  const formData = (() => {
    // 优先使用 location.state 传入的数据
    const stateData = (location.state as { formData: ResumeFormData } | null)?.formData
    if (stateData) return stateData
    // 切换模块后 state 丢失，从 store 恢复
    const stored = loadResumeAnalysis()
    return stored.formData as ResumeFormData | null
  })()

  const mountedRef = useRef(true)
  const [analyzing, setAnalyzing] = useState(true)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<'analysis' | 'resume'>('analysis')
  const [aiConfigured, setAiConfigured] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)

  const handleReanalyze = async () => {
    if (!formData || reanalyzing) return
    setReanalyzing(true)
    setError(null)
    try {
      const res = await analyzeResume(formData)
      if (!mountedRef.current) return
      setResult(res)
      saveResumeAnalysis(formData as unknown as Record<string, unknown>, res as unknown as Record<string, unknown>)
    } catch (err: any) {
      if (!mountedRef.current) return
      setError(err.message || 'AI 分析失败，请检查网络连接后重试。')
    } finally {
      if (mountedRef.current) setReanalyzing(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // 检查服务端 AI 配置状态
  useEffect(() => {
    aiStatusApi.check()
      .then((res) => { if (mountedRef.current) setAiConfigured(res.configured) })
      .catch(() => { /* 忽略 */ })
  }, [])

  useEffect(() => {
    if (!formData) {
      setError('未找到简历数据，请返回编辑页面重新提交。')
      setAnalyzing(false)
      return
    }

    // 检查是否已有缓存的同一次分析结果（先检查再保存，避免覆盖）
    const stored = loadResumeAnalysis()
    if (stored.analysis && stored.formData) {
      const prev = stored.formData as Record<string, unknown>
      const curr = formData as unknown as Record<string, unknown>
      if (prev.name === curr.name && prev.targetPosition === curr.targetPosition) {
        setResult(stored.analysis as unknown as AnalysisResult)
        setAnalyzing(false)
        return
      }
    }

    // 保存 formData 到 store（仅保存表单数据，不覆盖旧的 analysis）
    saveResumeAnalysis(formData as unknown as Record<string, unknown>, (stored.analysis ?? {}) as Record<string, unknown>)

    const run = async () => {
      setAnalyzing(true)
      setError(null)
      try {
        const res = await analyzeResume(formData)
        if (!mountedRef.current) return
        setResult(res)
        // 保存分析结果到 store
        if (resumeId) saveResumeId(resumeId)
        saveResumeAnalysis(formData as unknown as Record<string, unknown>, res as unknown as Record<string, unknown>)

        if (formData.targetPosition) {
          setTargetPosition(formData.targetPosition, formData.targetIndustry || '')
        }
        addActivity({ type: 'resume', text: '优化了简历', time: '刚刚' })
      } catch (err: any) {
        if (!mountedRef.current) return
        setError(err.message || 'AI 分析失败，请检查网络连接后重试。')
      } finally {
        if (mountedRef.current) setAnalyzing(false)
      }
    }
    run()
  }, [formData, setTargetPosition, addActivity, saveResumeAnalysis, loadResumeAnalysis])

  const toggleSuggestion = (index: number) => {
    setExpandedSuggestions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleBack = () => {
    navigate(-1)
  }

  // 没有数据
  if (!formData) {
    return (
      <div className="card flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-white text-lg font-medium mb-2">未找到简历数据</p>
        <p className="text-slate-400 text-sm mb-6">{error || '请返回编辑页面重新提交'}</p>
        <button onClick={handleBack} className="btn-primary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回编辑
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">返回编辑</span>
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">AI 简历分析</h2>
          <p className="text-slate-400 text-sm mt-1">
            {formData.name ? `${formData.name} · ` : ''}{formData.targetPosition || '未指定岗位'}
          </p>
        </div>
        {result && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(result.optimizedResume)}
              className="btn-accent flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下载优化版
            </button>
            <button
              onClick={() => window.print()}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              导出 PDF
            </button>
          </div>
        )}
      </div>

      {/* 加载状态 */}
      {analyzing && (
        <div className="card flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 text-primary-400 animate-spin mb-6" />
          <p className="text-slate-200 text-lg font-medium">AI 正在深度分析你的简历...</p>
          <p className="text-slate-500 text-sm mt-2">正在从内容完整性、关键词匹配、排版规范、语言表达、量化成果、岗位匹配度等维度进行全面评估</p>
          <div className="mt-8 w-64 h-1.5 bg-surface-hover rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && !analyzing && (
        <div className="card flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-white text-lg font-medium mb-2">分析失败</p>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            重试
          </button>
        </div>
      )}

      {/* 分析结果 */}
      {result && !analyzing && (
        <div className="space-y-6">
          {/* 综合评分 + 总结 */}
          <div className="card flex flex-col items-center py-10">
            <p className="text-slate-400 text-sm mb-3">AI 综合评分</p>
            <div className="relative">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="64" fill="none" stroke="#334155" strokeWidth="10" />
                <circle
                  cx="72" cy="72" r="64" fill="none" stroke="#2563eb" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(result.overallScore / 100) * 402} 402`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span className="text-accent-300 text-sm">AI 智能评估</span>
              {result.aiPowered ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/30">千问 AI</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/30">规则引擎</span>
              )}
            </div>
            {!result.aiPowered && (
              <div className="mt-4 max-w-2xl mx-auto p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-left flex-1">
                    <p className="text-amber-300 text-sm font-medium">AI 模型未就绪</p>
                    <p className="text-amber-400/70 text-xs mt-0.5">
                      {result.aiError
                        ? `调用失败：${result.aiError}`
                        : '当前使用本地规则引擎评分，结果仅供参考。请在 server/.env 中配置 AI_API_KEY 后重新分析，即可获得 AI 精准评估。'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReanalyze}
                  disabled={reanalyzing}
                  className="mt-3 w-full btn-primary flex items-center justify-center gap-2"
                >
                  {reanalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI 分析中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      重新用 AI 分析
                    </>
                  )}
                </button>
              </div>
            )}
            {/* 综合评估总结 */}
            <div className="mt-6 max-w-2xl mx-auto p-4 rounded-xl bg-surface-hover/50 border border-surface-border/30">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-accent-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* 维度评分 - 6个维度 */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              <h3 className="text-lg font-semibold text-white">多维度评分</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.dimensions.map((dim) => (
                <div
                  key={dim.label}
                  className={`p-4 rounded-lg border ${getScoreBg(dim.score)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">{dim.label}</span>
                    <span className={`text-lg font-bold ${getScoreColor(dim.score)}`}>{dim.score}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-dark rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getScoreBar(dim.score)}`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{dim.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 切换标签：分析建议 / 优化后简历 */}
          <div className="flex gap-1 p-1 rounded-lg bg-surface-hover/50 w-fit">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'analysis'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-4 h-4 inline mr-1.5" />
              优化建议
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'resume'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1.5" />
              优化后简历
            </button>
          </div>

          {/* 分析建议 Tab */}
          {activeTab === 'analysis' && (
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <Edit3 className="w-5 h-5 text-accent-400" />
                <h3 className="text-lg font-semibold text-white">AI 优化建议</h3>
                <span className="px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-400 text-xs font-medium border border-accent-500/30">
                  {result.suggestions.length}条建议
                </span>
              </div>
              <div className="space-y-3">
                {result.suggestions.map((suggestion, index) => {
                  const isExpanded = expandedSuggestions.has(index)
                  return (
                    <div key={index} className="border border-surface-border/30 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSuggestion(index)}
                        className="w-full flex items-center justify-between p-4 hover:bg-surface-hover/30 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-xs font-medium shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-primary-500/15 text-primary-400 text-xs font-medium">
                                {suggestion.section}
                              </span>
                              <span className="text-sm text-slate-200 truncate">{suggestion.reason}</span>
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0 ml-3" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-3" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-surface-border/30 pt-4">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                              <span className="text-xs text-slate-500 font-medium">原文</span>
                            </div>
                            <p className="text-sm text-slate-400 bg-surface-dark rounded-lg p-3 border border-surface-border/20">
                              {suggestion.original}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-xs text-slate-500 font-medium">建议修改为</span>
                            </div>
                            <p className="text-sm text-emerald-300 bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/20">
                              {suggestion.suggested}
                            </p>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-accent-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-500">{suggestion.reason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 优化后简历 Tab */}
          {activeTab === 'resume' && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="card">
                <div className="flex items-center gap-2 mb-5">
                  <User className="w-5 h-5 text-primary-400" />
                  <h3 className="text-lg font-semibold text-white">基本信息</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-slate-500">姓名</span>
                    <p className="text-white font-medium">{result.optimizedResume.name || '待补充'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">邮箱</span>
                    <p className="text-white font-medium">{result.optimizedResume.email || '待补充'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">电话</span>
                    <p className="text-white font-medium">{result.optimizedResume.phone || '待补充'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">目标岗位</span>
                    <p className="text-primary-400 font-medium">{result.optimizedResume.targetPosition || '待补充'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">目标行业</span>
                    <p className="text-primary-400 font-medium">{result.optimizedResume.targetIndustry || '待补充'}</p>
                  </div>
                </div>
              </div>

              {/* 教育经历 */}
              {result.optimizedResume.education.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-5">
                    <GraduationCap className="w-5 h-5 text-primary-400" />
                    <h3 className="text-lg font-semibold text-white">教育经历</h3>
                  </div>
                  <div className="space-y-3">
                    {result.optimizedResume.education.map((edu, i) => (
                      <div key={i} className="p-4 rounded-lg bg-surface-hover/50 border border-surface-border/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">{edu.school}</span>
                          <span className="text-xs text-slate-500">{edu.time}</span>
                        </div>
                        <p className="text-sm text-slate-400">{edu.degree} · {edu.major}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 实习经历 */}
              {result.optimizedResume.workExperience.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-5">
                    <Briefcase className="w-5 h-5 text-primary-400" />
                    <h3 className="text-lg font-semibold text-white">实习/工作经历</h3>
                  </div>
                  <div className="space-y-4">
                    {result.optimizedResume.workExperience.map((work, i) => (
                      <div key={i} className="p-4 rounded-lg bg-surface-hover/50 border border-surface-border/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{work.company}</span>
                          <span className="text-xs text-slate-500">{work.time}</span>
                        </div>
                        <p className="text-sm text-primary-400 mb-2">{work.position}</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{work.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 项目经验 */}
              {result.optimizedResume.projectExperience.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-5">
                    <FolderGit2 className="w-5 h-5 text-primary-400" />
                    <h3 className="text-lg font-semibold text-white">项目经验</h3>
                  </div>
                  <div className="space-y-4">
                    {result.optimizedResume.projectExperience.map((proj, i) => (
                      <div key={i} className="p-4 rounded-lg bg-surface-hover/50 border border-surface-border/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{proj.name}</span>
                          <span className="text-xs text-primary-400">{proj.role}</span>
                        </div>
                        {proj.techStack && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <Wrench className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-500">{proj.techStack}</span>
                          </div>
                        )}
                        <p className="text-sm text-slate-300 leading-relaxed">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 技能 & 证书 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.optimizedResume.skills && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <Wrench className="w-5 h-5 text-primary-400" />
                      <h3 className="text-lg font-semibold text-white">专业技能</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{result.optimizedResume.skills}</p>
                  </div>
                )}
                {result.optimizedResume.certifications && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-primary-400" />
                      <h3 className="text-lg font-semibold text-white">证书与荣誉</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{result.optimizedResume.certifications}</p>
                  </div>
                )}
              </div>

              {/* 下载按钮 */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => handleDownload(result.optimizedResume)}
                  className="btn-accent flex items-center gap-2 text-base px-8 py-3"
                >
                  <Download className="w-5 h-5" />
                  一键下载优化版简历（TXT）
                </button>
              </div>
            </div>
          )}

          {/* 底部操作 */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleBack}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回编辑
            </button>
            <button
              onClick={() => navigate('/resume')}
              className="btn-primary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              返回简历列表
            </button>
          </div>
        </div>
      )}
    </div>
  )
}