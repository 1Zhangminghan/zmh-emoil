import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { positionApi, type PositionItem } from '@/api'
import { useProfileStore } from '@/store/useProfileStore'
import { useEffect, useState, useRef } from 'react'
import { generateDiagnosisScores, generateLearningPlan, type DiagnosisResult, type LearningPlan } from '@/services/aiService'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts'
import {
  Target, TrendingUp, Trophy, AlertCircle, CheckCircle, BookOpen,
  ChevronRight, Clock, Play, Zap, Sparkles, ChevronLeft, Loader2, FileText,
} from 'lucide-react'

interface ReportState {
  recruitmentType?: string
  graduationYear?: string
  positionId?: string
  positionName?: string
  dimensions?: string[]
  answers?: string[]
  questions?: Array<{ dimension: string; question: string }>
}

const recruitmentLabels: Record<string, string> = {
  fall: '秋招',
  spring: '春招',
  intern: '日常实习',
}

// ============ 组件 ============

export default function DiagnosisReport() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ReportState | null
  const { saveDiagnosis, saveLearningPlan, saveDiagnosisReport, loadDiagnosisReport, addActivity, setRecruitmentType, setGraduationYear } = useProfileStore()

  const [positions, setPositions] = useState<PositionItem[]>([])
  useEffect(() => {
    positionApi.getFlat().then(setPositions).catch(() => {})
  }, [])

  const recruitmentType = type || state?.recruitmentType || 'fall'
  const graduationYear = state?.graduationYear || '2027'
  const recruitmentLabel = recruitmentLabels[recruitmentType] || '秋招'

  // 从 location.state 或 store 恢复数据（切换模块后 state 丢失时从 store 恢复）
  const storedReport = useRef(loadDiagnosisReport()).current
  const positionId = state?.positionId || storedReport?.positionId || id || 'java-backend'
  const positionName = state?.positionName || storedReport?.positionName || ''
  const position = positions.find((p) => p.id === positionId) || positions[0]
  const dimensions = state?.dimensions || storedReport?.dimensions || position?.dimensions || []
  const answers = state?.answers || storedReport?.answers || []
  const questions = state?.questions || storedReport?.questions || []

  const [loading, setLoading] = useState(!storedReport)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(
    storedReport ? { totalScore: storedReport.totalScore, dimensionScores: storedReport.dimensionScores, strengths: storedReport.strengths, weaknesses: storedReport.weaknesses, gapAnalysis: storedReport.gapAnalysis } : null
  )
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(
    storedReport ? { stages: storedReport.stages } as LearningPlan : null
  )

  useEffect(() => {
    // 如果已从 store 恢复数据，无需重新计算
    if (storedReport && !state?.answers) return

    let cancelled = false
    async function compute() {
      if (!position) return // 等待 position 加载完成
      setLoading(true)
      const diag = await generateDiagnosisScores(answers, questions, dimensions, positionId, positionName || position.name)
      const plan = await generateLearningPlan(positionName || position.name, recruitmentType, diag.dimensionScores, diag.weaknesses)
      if (!cancelled) {
        setDiagnosisResult(diag)
        setLearningPlan(plan)

        // 持久化报告数据到 store，切换模块后自动恢复
        saveDiagnosisReport({
          recruitmentType,
          graduationYear,
          positionId,
          positionName: positionName || position.name,
          dimensions,
          answers,
          questions,
          totalScore: diag.totalScore,
          dimensionScores: diag.dimensionScores,
          strengths: diag.strengths,
          weaknesses: diag.weaknesses,
          gapAnalysis: diag.gapAnalysis,
          stages: plan.stages.map((s) => ({
            title: s.title,
            description: s.description,
            duration: s.duration,
            tasks: s.tasks.map((t: any) => t.title || t),
          })),
        })

        setLoading(false)
      }
    }
    compute()
    return () => { cancelled = true }
  }, [position])

  const dimensionScores = diagnosisResult?.dimensionScores || {}
  const totalScore = diagnosisResult?.totalScore ?? 0
  const strengths = diagnosisResult?.strengths || []
  const weaknesses = diagnosisResult?.weaknesses || []
  const gapAnalysisText = diagnosisResult?.gapAnalysis || ''

  const stageData = learningPlan
    ? learningPlan.stages.map((stage) => ({
        ...stage,
        icon: stage.title.includes('基础') ? BookOpen : stage.title.includes('冲刺') || stage.title.includes('面试') ? Target : Zap,
      }))
    : []

  // 保存诊断结果到共享 profile，打通其他模块
  useEffect(() => {
    if (!diagnosisResult || !learningPlan) return

    const diagnosisData = {
      totalScore,
      positionName: position.name,
      recruitmentType,
      graduationYear,
      dimensions,
      dimensionScores,
    }
    saveDiagnosis(diagnosisData)
    setRecruitmentType(recruitmentType)
    setGraduationYear(graduationYear)
    addActivity({ type: 'diagnosis', text: `完成了${position.name} · ${recruitmentLabel}能力诊断`, time: '刚刚' })

    // 保存学习计划到共享 profile
    saveLearningPlan({
      id: `plan_${recruitmentType}_${positionId}`,
      positionName: position.name,
      recruitmentType,
      graduationYear,
      totalScore,
      dimensions,
      dimensionScores,
      stages: stageData.map((s) => ({
        title: s.title,
        description: s.description,
        duration: s.duration,
        tasks: s.tasks,
        completed: false,
      })),
      createdAt: new Date().toISOString(),
    })
  }, [diagnosisResult, learningPlan])

  const radarData = dimensions.map((dim) => ({
    dimension: dim.length > 4 ? dim.slice(0, 4) : dim,
    full: dim,
    score: dimensionScores[dim] || 0,
    fullMark: 100,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">AI 正在分析你的诊断结果...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/diagnosis/${recruitmentType}`)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">返回</span>
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-accent text-xs">{recruitmentLabel}</span>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-accent-400" />
              诊断报告
            </h2>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {position.name} · {graduationYear}届 · {recruitmentLabel} · 能力水平评估
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            导出 PDF
          </button>
        </div>
      </div>

      {/* 综合评分 */}
      <div className="card text-center py-8">
        <p className="text-slate-400 text-sm mb-2">{recruitmentLabel}综合评分</p>
        <p className="text-6xl font-bold text-white mb-1">{totalScore}</p>
        <p className="text-slate-400 text-sm">
          {totalScore >= 85
            ? '优秀！你的能力水平很高，继续保持！'
            : totalScore >= 70
              ? '良好，还有提升空间，按照{recruitmentLabel}学习计划提升会更高效'
              : '需要加强基础，建议按照{recruitmentLabel}学习计划系统提升'}
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            {strengths.length} 项优势
          </div>
          {weaknesses.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              {weaknesses.length} 项待提升
            </div>
          )}
        </div>
      </div>

      {/* 雷达图 + 强弱项 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">能力雷达图</h3>
          </div>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
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
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">优势维度</h3>
            </div>
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((dim) => (
                  <div key={dim} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10">
                    <span className="text-sm text-slate-200">{dim}</span>
                    <span className="text-sm font-bold text-emerald-400">{dimensionScores[dim]}分</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">暂无显著优势维度</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">薄弱维度</h3>
            </div>
            {weaknesses.length > 0 ? (
              <div className="space-y-2">
                {weaknesses.map((dim) => (
                  <div key={dim} className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/10">
                    <span className="text-sm text-slate-200">{dim}</span>
                    <span className="text-sm font-bold text-red-400">{dimensionScores[dim]}分</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">暂无明显薄弱维度，继续保持！</p>
            )}
          </div>
        </div>
      </div>

      {/* 差距分析 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-3">差距分析</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {gapAnalysisText}
        </p>
      </div>

      {/* AI学习计划 */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="w-6 h-6 text-primary-400" />
          <div>
            <h3 className="text-xl font-bold text-white">
              AI 为你生成了{recruitmentLabel}个性化学习计划
            </h3>
            <p className="text-slate-400 text-sm">
              基于你的诊断结果和{graduationYear}届{recruitmentLabel}时间线，制定了以下三阶段学习路径
            </p>
          </div>
        </div>

        <div className="space-y-0">
          {stageData.map((stage, idx) => {
            const Icon = stage.icon
            const isLast = idx === stageData.length - 1
            return (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    idx === 0 ? 'bg-primary-500/20 text-primary-400' :
                    idx === 1 ? 'bg-accent-500/20 text-accent-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!isLast && <div className="w-0.5 flex-1 min-h-10 bg-surface-border/50 my-1" />}
                </div>

                <div className={`card flex-1 mb-5 ${!isLast ? '' : 'mb-0'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold text-white">
                      阶段{idx + 1}：{stage.title}
                    </h4>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {stage.duration}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{stage.description}</p>
                  <ul className="space-y-1.5">
                    {stage.tasks.map((task, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate('/learning')}
            className="btn-primary text-base px-8 py-3"
          >
            <Play className="w-5 h-5 inline mr-2" />
            开始{recruitmentLabel}学习
            <ChevronRight className="w-5 h-5 inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}