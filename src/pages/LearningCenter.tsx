import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/store/useProfileStore'
import {
  BookOpen, Play, Clock, CheckCircle, Lock, ChevronRight,
  Trophy, TrendingUp, Brain, Target, RotateCcw,
} from 'lucide-react'

const recruitmentLabels: Record<string, string> = {
  fall: '秋招',
  spring: '春招',
  intern: '日常实习',
}

export default function LearningCenter() {
  const navigate = useNavigate()
  const { learningPlans, latestDiagnosis, getLearningProgress, getLearningTaskCompletions } = useProfileStore()

  // 根据 learningTaskCompletions 动态计算阶段是否完成
  const getStageCompleted = (planId: string, stageIdx: number, tasksLength: number): boolean => {
    const completions = getLearningTaskCompletions(planId)
    if (tasksLength === 0) return false
    // 任务 ID 格式：${planId}_s${stageIdx}_t${taskIdx}
    return Array.from({ length: tasksLength }, (_, tIdx) =>
      `${planId}_s${stageIdx}_t${tIdx}`
    ).every((taskId) => completions.includes(taskId))
  }

  // 计算计划是否全部完成
  const isPlanCompleted = (plan: { id: string; stages: Array<{ tasks: string[] }> }): boolean => {
    const completions = getLearningTaskCompletions(plan.id)
    const totalTasks = plan.stages.reduce((sum, s) => sum + s.tasks.length, 0)
    if (totalTasks === 0) return false
    // 收集所有任务 ID
    const allTaskIds: string[] = []
    plan.stages.forEach((s, sIdx) => {
      s.tasks.forEach((_, tIdx) => {
        allTaskIds.push(`${plan.id}_s${sIdx}_t${tIdx}`)
      })
    })
    return allTaskIds.every((id) => completions.includes(id))
  }

  // 计算计划进度百分比
  const getPlanProgress = (planId: string, stages: Array<{ tasks: string[] }>): number => {
    const completions = getLearningTaskCompletions(planId)
    const totalTasks = stages.reduce((sum, s) => sum + s.tasks.length, 0)
    if (totalTasks === 0) return 0
    let completedCount = 0
    stages.forEach((s, sIdx) => {
      s.tasks.forEach((_, tIdx) => {
        if (completions.includes(`${planId}_s${sIdx}_t${tIdx}`)) completedCount++
      })
    })
    return Math.round((completedCount / totalTasks) * 100)
  }

  // 区分进行中和已完成的计划
  const activePlans = learningPlans.filter((p) => !isPlanCompleted(p))
  const completedPlans = learningPlans.filter((p) => isPlanCompleted(p))

  const hasActivePlan = activePlans.length > 0
  const activePlan = activePlans[0] // 最新的进行中计划

  const strokeDasharray = 2 * Math.PI * 42
  const progress = activePlan
    ? getPlanProgress(activePlan.id, activePlan.stages)
    : 0
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray

  const recruitmentLabel = activePlan
    ? (recruitmentLabels[activePlan.recruitmentType] || '校招')
    : ''

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-400" />
          学习中心
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          系统提升你的求职能力，按计划逐步完成学习目标
        </p>
      </div>

      {!hasActivePlan ? (
        /* 空状态 */
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-surface-hover mx-auto flex items-center justify-center mb-4">
            <Brain className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">还没有学习计划</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            请先完成能力诊断测试，AI将根据你的水平生成个性化的学习计划
          </p>
          <button onClick={() => navigate('/diagnosis')} className="btn-primary">
            去完成水平诊断
            <ChevronRight className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      ) : (
        <>
          {/* 当前学习计划卡片 */}
          <div className="card">
            <div className="flex items-start gap-6">
              {/* 圆形进度环 */}
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">{progress}</span>
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {/* 计划信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-xl font-semibold text-white">{activePlan.positionName} · {recruitmentLabel}学习计划</h3>
                  <span className="badge-success">进行中</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    诊断评分 {activePlan.totalScore}分
                  </span>
                  <span>{activePlan.graduationYear}届</span>
                  <span>
                    已完成 {activePlan.stages.filter((s, idx) => getStageCompleted(activePlan.id, idx, s.tasks.length)).length}/{activePlan.stages.length} 个阶段
                  </span>
                </div>

                {/* 阶段进度 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {activePlan.stages.map((stage, idx) => {
                    const stageCompleted = getStageCompleted(activePlan.id, idx, stage.tasks.length)
                    const prevCompleted = idx === 0 || getStageCompleted(activePlan.id, idx - 1, activePlan.stages[idx - 1].tasks.length)
                    const StageIcon = stageCompleted
                      ? CheckCircle
                      : prevCompleted
                        ? Play
                        : Lock
                    const status = stageCompleted
                      ? 'completed'
                      : prevCompleted ? 'active' : 'locked'
                    const stageColor =
                      status === 'completed'
                        ? 'bg-emerald-500 text-emerald-500'
                        : status === 'active'
                          ? 'bg-primary-500 text-primary-500'
                          : 'bg-surface-border text-surface-border'

                    return (
                      <div key={stage.title} className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                          status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : status === 'active'
                              ? 'bg-primary-500/10 text-primary-300'
                              : 'bg-surface-hover text-slate-500'
                        }`}>
                          <StageIcon className="w-3.5 h-3.5" />
                          {stage.title}
                        </div>
                        {idx < activePlan.stages.length - 1 && (
                          <div className={`w-4 h-0.5 ${stageColor}`} />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => navigate(`/learning/${activePlan.id}`)}
                    className="btn-primary"
                  >
                    <Play className="w-4 h-4 inline mr-1.5" />
                    继续学习
                    <ChevronRight className="w-4 h-4 inline ml-1" />
                  </button>
                  <button
                    onClick={() => navigate('/diagnosis')}
                    className="btn-secondary"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1.5" />
                    返回诊断页面
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 其他进行中计划 */}
          {activePlans.length > 1 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-primary-400" />
                <h3 className="text-lg font-semibold text-white">其他进行中计划</h3>
              </div>
              <div className="space-y-3">
                {activePlans.slice(1).map((plan) => {
                  const p = getPlanProgress(plan.id, plan.stages)
                  return (
                    <div
                      key={plan.id}
                      onClick={() => navigate(`/learning/${plan.id}`)}
                      className="card flex items-center justify-between hover:border-primary-500/30 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                          <Play className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-white">
                            {plan.positionName} · {recruitmentLabels[plan.recruitmentType] || '校招'}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            <span>{plan.graduationYear}届</span>
                            <span>{plan.stages.filter((s, idx) => getStageCompleted(plan.id, idx, s.tasks.length)).length}/{plan.stages.length} 阶段</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary-400">{p}%</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 已完成计划 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-accent-400" />
              <h3 className="text-lg font-semibold text-white">已完成计划</h3>
            </div>
            {completedPlans.length > 0 ? (
              <div className="space-y-3">
                {completedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-white">
                          {plan.positionName} · {recruitmentLabels[plan.recruitmentType] || '校招'}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span>{plan.graduationYear}届</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            诊断评分 {plan.totalScore}分
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="badge-success">已完成</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8">
                <p className="text-slate-500 text-sm">完成当前学习计划后将显示在这里</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}