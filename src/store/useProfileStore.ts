import { create } from 'zustand'
import { loadFromStorage, saveToStorage } from '@/utils/persist'
import { profileApi, resumeApi, learningApi, applicationApi, diagnosisApi } from '@/api'
import { useQuizStore } from '@/store/useQuizStore'

const STORAGE_KEY = 'user_profile'

export interface LearningPlan {
  id: string
  positionName: string
  recruitmentType: string
  graduationYear: string
  totalScore: number
  dimensions: string[]
  dimensionScores: Record<string, number>
  stages: Array<{
    title: string
    description: string
    duration: string
    tasks: string[]
    completed: boolean
  }>
  createdAt: string
}

export interface ActivityLog {
  id: string
  type: 'resume' | 'interview' | 'diagnosis' | 'quiz' | 'learning'
  text: string
  time: string
  timestamp: number
}

export interface Application {
  id: string
  company: string
  position: string
  industry: string
  status: 'wishlist' | 'applied' | 'written_test' | 'interview' | 'offer' | 'rejected'
  appliedDate: string
  notes: string
  link: string
  resumeId: string
  resumeName: string
  interviewNotes: string
  interviewDate: string
  interviewResult: string
  nextStep: string
  createdAt: number
}

export interface CalendarEvent {
  id: string
  title: string
  company: string
  type: 'deadline' | 'written_test' | 'interview' | 'info_session' | 'other'
  date: string
  recruitmentType: 'fall' | 'spring' | 'intern'
  starred: boolean
  createdAt: number
}

interface ProfileState {
  // 目标岗位（简历模块设置，其他模块读取）
  targetPosition: string
  targetIndustry: string
  graduationYear: string
  recruitmentType: string
  targetCompanies: string[]
  preferredCities: string[]
  skillLevel: string

  // 简历草稿
  resumeDraft: Record<string, unknown> | null

  // 最近一次简历分析（用于切换模块后恢复）
  lastResumeId: string | null
  lastResumeFormData: Record<string, unknown> | null
  lastResumeAnalysis: Record<string, unknown> | null

  // 诊断报告
  latestDiagnosis: {
    totalScore: number
    positionName: string
    recruitmentType: string
    graduationYear: string
    dimensions: string[]
    dimensionScores: Record<string, number>
  } | null
  diagnosisHistory: Array<{
    totalScore: number
    positionName: string
    date: string
    timestamp: number
  }>

  // 最近一次诊断报告完整数据（用于切换模块后恢复）
  lastDiagnosisReport: {
    recruitmentType: string
    graduationYear: string
    positionId: string
    positionName: string
    dimensions: string[]
    answers: string[]
    questions: Array<{ dimension: string; question: string }>
    totalScore: number
    dimensionScores: Record<string, number>
    strengths: string[]
    weaknesses: string[]
    gapAnalysis: string
    stages: Array<{
      title: string
      description: string
      duration: string
      tasks: string[]
    }>
  } | null

  // 学习计划
  learningPlans: LearningPlan[]

  // 学习任务完成状态（planId → taskId[]）
  learningTaskCompletions: Record<string, string[]>

  // 活动日志
  activities: ActivityLog[]

  // 求职进度追踪
  applications: Application[]

  // 校招日历事件
  calendarEvents: CalendarEvent[]

  // 操作方法
  loadFromServer: () => Promise<void>
  setTargetPosition: (position: string, industry?: string) => void
  setGraduationYear: (year: string) => void
  setTargetCompanies: (companies: string[]) => void
  setPreferredCities: (cities: string[]) => void
  setSkillLevel: (level: string) => void
  setRecruitmentType: (type: string) => void
  saveResumeDraft: (draft: Record<string, unknown>) => void
  loadResumeDraft: () => Record<string, unknown> | null
  saveResumeId: (id: string) => void
  saveResumeAnalysis: (formData: Record<string, unknown>, analysis: Record<string, unknown>) => void
  loadResumeAnalysis: () => { formData: Record<string, unknown> | null; analysis: Record<string, unknown> | null }
  saveDiagnosis: (data: ProfileState['latestDiagnosis']) => void
  saveDiagnosisReport: (data: ProfileState['lastDiagnosisReport']) => void
  loadDiagnosisReport: () => ProfileState['lastDiagnosisReport']
  saveLearningPlan: (plan: LearningPlan) => void
  addActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void
  getQuizStats: () => { totalQuestions: number; answered: number; correct: number }
  getLearningProgress: () => number
  toggleLearningTask: (planId: string, taskId: string) => void
  isLearningTaskCompleted: (planId: string, taskId: string) => boolean
  getLearningTaskCompletions: (planId: string) => string[]
  addApplication: (app: Omit<Application, 'id' | 'createdAt'>) => void
  updateApplicationStatus: (id: string, status: Application['status']) => void
  removeApplication: (id: string) => void
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void
  toggleCalendarStar: (id: string) => void
  removeCalendarEvent: (id: string) => void
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const useProfileStore = create<ProfileState>((set, get) => {
  const saved = loadFromStorage<{
    targetPosition: string
    targetIndustry: string
    graduationYear: string
    recruitmentType: string
    targetCompanies: string[]
    preferredCities: string[]
    skillLevel: string
    resumeDraft: Record<string, unknown> | null
    lastResumeId: string | null
    lastResumeFormData: Record<string, unknown> | null
    lastResumeAnalysis: Record<string, unknown> | null
    latestDiagnosis: ProfileState['latestDiagnosis']
    diagnosisHistory: ProfileState['diagnosisHistory']
    lastDiagnosisReport: ProfileState['lastDiagnosisReport']
    learningPlans: LearningPlan[]
    learningTaskCompletions: Record<string, string[]>
    activities: ActivityLog[]
    applications: Application[]
    calendarEvents: CalendarEvent[]
  }>(STORAGE_KEY, {
    targetPosition: '',
    targetIndustry: '',
    graduationYear: '2026',
    recruitmentType: 'fall',
    targetCompanies: [],
    preferredCities: [],
    skillLevel: '',
    resumeDraft: null,
    lastResumeId: null,
    lastResumeFormData: null,
    lastResumeAnalysis: null,
    latestDiagnosis: null,
    diagnosisHistory: [],
    lastDiagnosisReport: null,
    learningPlans: [],
    learningTaskCompletions: {},
    activities: [],
    applications: [],
    calendarEvents: [],
  })

  const persist = () => {
    const state = get()
    saveToStorage(STORAGE_KEY, {
      targetPosition: state.targetPosition,
      targetIndustry: state.targetIndustry,
      graduationYear: state.graduationYear,
      recruitmentType: state.recruitmentType,
      targetCompanies: state.targetCompanies,
      preferredCities: state.preferredCities,
      skillLevel: state.skillLevel,
      resumeDraft: state.resumeDraft,
      lastResumeId: state.lastResumeId,
      lastResumeFormData: state.lastResumeFormData,
      lastResumeAnalysis: state.lastResumeAnalysis,
      latestDiagnosis: state.latestDiagnosis,
      diagnosisHistory: state.diagnosisHistory,
      lastDiagnosisReport: state.lastDiagnosisReport,
      learningPlans: state.learningPlans,
      learningTaskCompletions: state.learningTaskCompletions,
      activities: state.activities,
      applications: state.applications,
      calendarEvents: state.calendarEvents,
    })
    // 同步 profile 数据到后端 API
    profileApi.update({
      targetPosition: state.targetPosition,
      targetIndustry: state.targetIndustry,
      graduationYear: state.graduationYear,
    }).catch(() => {})
  }

  return {
    targetPosition: saved.targetPosition,
    targetIndustry: saved.targetIndustry,
    graduationYear: saved.graduationYear,
    recruitmentType: saved.recruitmentType,
    targetCompanies: saved.targetCompanies ?? [],
    preferredCities: saved.preferredCities ?? [],
    skillLevel: saved.skillLevel ?? '',
    resumeDraft: saved.resumeDraft,
    lastResumeId: saved.lastResumeId ?? null,
    lastResumeFormData: saved.lastResumeFormData ?? null,
    lastResumeAnalysis: saved.lastResumeAnalysis ?? null,
    latestDiagnosis: saved.latestDiagnosis,
    diagnosisHistory: saved.diagnosisHistory ?? [],
    lastDiagnosisReport: saved.lastDiagnosisReport ?? null,
    learningPlans: saved.learningPlans,
    learningTaskCompletions: saved.learningTaskCompletions ?? {},
    activities: saved.activities,
    applications: saved.applications ?? [],
    calendarEvents: saved.calendarEvents ?? [],

    loadFromServer: async () => {
      // 尝试从后端加载 profile
      try {
        const profile = await profileApi.get()
        if (profile) {
          set({
            targetPosition: profile.targetPosition || '',
            targetIndustry: profile.targetIndustry || '',
            graduationYear: profile.graduationYear || '2026',
            targetCompanies: (profile as any).targetCompanies || [],
            preferredCities: (profile as any).preferredCities || [],
            skillLevel: (profile as any).skillLevel || '',
          })
        }
      } catch { /* 后端不可用时使用 localStorage 数据 */ }

      // 尝试从后端加载学习计划
      try {
        const plans = await learningApi.listPlans()
        if (plans && plans.length > 0) {
          const mappedPlans: LearningPlan[] = plans.map((p) => ({
            id: p.id,
            positionName: p.position_name,
            recruitmentType: p.recruitment_type,
            graduationYear: '',
            totalScore: 0,
            dimensions: [],
            dimensionScores: {},
            stages: p.stages.map((s) => ({
              title: s.title,
              description: s.description,
              duration: s.duration,
              tasks: s.tasks.map((t) => t.title),
              completed: s.tasks.every((t) => (p.completions || []).includes(t.id)),
            })),
            createdAt: p.created_at,
          }))
          const completions: Record<string, string[]> = {}
          plans.forEach((p) => {
            if (p.completions) {
              completions[p.id] = p.completions
            }
          })
          set({ learningPlans: mappedPlans, learningTaskCompletions: completions })
        }
      } catch { /* 后端不可用时使用 localStorage 数据 */ }

      // 尝试从后端加载求职进度
      try {
        const apps = await applicationApi.list()
        if (apps && apps.length > 0) {
          const mappedApps: Application[] = apps.map((a) => ({
            id: a.id,
            company: a.company,
            position: a.position,
            industry: '',
            status: a.status as Application['status'],
            appliedDate: a.applied_date,
            notes: a.notes || '',
            link: '',
            resumeId: '',
            resumeName: '',
            interviewNotes: '',
            interviewDate: '',
            interviewResult: '',
            nextStep: '',
            createdAt: Date.now(),
          }))
          set({ applications: mappedApps })
        }
      } catch { /* 后端不可用时使用 localStorage 数据 */ }

      // 尝试从后端加载日历事件
      try {
        const events = await applicationApi.listCalendar()
        if (events && events.length > 0) {
          const mappedEvents: CalendarEvent[] = events.map((e) => ({
            id: e.id,
            title: e.title,
            company: e.company || '',
            type: e.type as CalendarEvent['type'],
            date: e.date,
            recruitmentType: 'fall' as const,
            starred: false,
            createdAt: Date.now(),
          }))
          set({ calendarEvents: mappedEvents })
        }
      } catch { /* 后端不可用时使用 localStorage 数据 */ }

      // 尝试从后端加载活动日志
      try {
        const activities = await applicationApi.listActivities()
        if (activities && activities.length > 0) {
          const mappedActivities: ActivityLog[] = activities.map((a) => ({
            id: a.id,
            type: a.type as ActivityLog['type'],
            text: a.content,
            time: a.created_at,
            timestamp: new Date(a.created_at).getTime(),
          }))
          set({ activities: mappedActivities })
        }
      } catch { /* 后端不可用时使用 localStorage 数据 */ }

      // 尝试从后端加载诊断报告
      try {
        const records = await diagnosisApi.list()
        if (records && records.length > 0) {
          const latest = records[records.length - 1]
          set({
            latestDiagnosis: {
              totalScore: latest.scores.totalScore,
              positionName: latest.position_name,
              recruitmentType: latest.type,
              graduationYear: '',
              dimensions: Object.keys(latest.scores.dimensionScores),
              dimensionScores: latest.scores.dimensionScores,
            },
          })
        }
      } catch { /* 后端不可用时使用 localStorage 数据 */ }

      persist()
    },

    setTargetPosition: (position, industry) => {
      set((state) => ({
        targetPosition: position,
        targetIndustry: industry ?? state.targetIndustry,
      }))
      persist()
    },

    setGraduationYear: (year) => {
      set({ graduationYear: year })
      persist()
    },

    setTargetCompanies: (companies) => {
      set({ targetCompanies: companies })
      persist()
    },

    setPreferredCities: (cities) => {
      set({ preferredCities: cities })
      persist()
    },

    setSkillLevel: (level) => {
      set({ skillLevel: level })
      persist()
    },

    setRecruitmentType: (type) => {
      set({ recruitmentType: type })
      persist()
    },

    saveResumeDraft: (draft) => {
      resumeApi.save(draft).catch(() => {})
      set({ resumeDraft: draft })
      persist()
    },

    loadResumeDraft: () => get().resumeDraft,

    saveResumeId: (id) => {
      set({ lastResumeId: id })
      persist()
    },

    saveResumeAnalysis: (formData, analysis) => {
      set({ lastResumeFormData: formData, lastResumeAnalysis: analysis })
      persist()
    },

    loadResumeAnalysis: () => {
      const state = get()
      return { formData: state.lastResumeFormData, analysis: state.lastResumeAnalysis }
    },

    saveDiagnosis: (data) => {
      // 同步到后端
      if (data) {
        diagnosisApi.submit({
          positionId: 'general',
          positionName: data.positionName || '综合诊断',
          type: data.recruitmentType || 'general',
          answers: [],
        }).catch(() => {})
      }
      set((state) => {
        const history = [...state.diagnosisHistory]
        if (data) {
          history.push({
            totalScore: data.totalScore,
            positionName: data.positionName,
            date: new Date().toLocaleDateString('zh-CN'),
            timestamp: Date.now(),
          })
        }
        return { latestDiagnosis: data, diagnosisHistory: history.slice(-20) }
      })
      persist()
    },

    saveDiagnosisReport: (data) => {
      set({ lastDiagnosisReport: data })
      persist()
    },

    loadDiagnosisReport: () => {
      return get().lastDiagnosisReport
    },

    saveLearningPlan: (plan) => {
      // 从 dimensionScores 中提取弱项（分数低于 50 的维度）
      const weaknesses: string[] = []
      if (plan.dimensionScores) {
        Object.entries(plan.dimensionScores).forEach(([dim, score]) => {
          if (score < 50) weaknesses.push(dim)
        })
      }
      learningApi.createPlan({
        positionName: plan.positionName,
        recruitmentType: plan.recruitmentType,
        weaknesses,
      }).catch(() => {})
      set((state) => {
        const existing = state.learningPlans.findIndex((p) => p.id === plan.id)
        const plans = [...state.learningPlans]
        if (existing >= 0) plans[existing] = plan
        else plans.push(plan)
        return { learningPlans: plans }
      })
      persist()
    },

    toggleLearningTask: (planId, taskId) => {
      learningApi.toggleTask(planId, taskId).catch(() => {})
      set((state) => {
        const completions = { ...state.learningTaskCompletions }
        const planTasks = completions[planId] || []
        const idx = planTasks.indexOf(taskId)
        if (idx >= 0) {
          completions[planId] = planTasks.filter((t) => t !== taskId)
        } else {
          completions[planId] = [...planTasks, taskId]
        }
        return { learningTaskCompletions: completions }
      })
      persist()
    },

    isLearningTaskCompleted: (planId, taskId) => {
      const completions = get().learningTaskCompletions
      return (completions[planId] || []).includes(taskId)
    },

    getLearningTaskCompletions: (planId) => {
      return get().learningTaskCompletions[planId] || []
    },

    addActivity: (activity) => {
      applicationApi.addActivity({
        type: activity.type,
        content: activity.text,
      }).catch(() => {})
      set((state) => {
        const newActivity: ActivityLog = {
          ...activity,
          id: generateId(),
          timestamp: Date.now(),
        }
        const activities = [newActivity, ...state.activities].slice(0, 20)
        return { activities }
      })
      persist()
    },

    getQuizStats: () => {
      // 动态从 useQuizStore 获取答题统计
      try {
        const quizState = useQuizStore.getState()
        const history = quizState.answerHistory
        const answered = Object.keys(history).length
        // 由于无法直接获取题目正确答案，这里只统计答题数量
        return { totalQuestions: answered, answered, correct: 0 }
      } catch {
        return { totalQuestions: 0, answered: 0, correct: 0 }
      }
    },

    getLearningProgress: () => {
      const plans = get().learningPlans
      if (plans.length === 0) return 0
      const activePlan = plans[plans.length - 1]
      const completions = get().learningTaskCompletions[activePlan.id] || []
      const totalTasks = activePlan.stages.reduce((sum, s) => sum + s.tasks.length, 0)
      if (totalTasks === 0) return 0
      return Math.round((completions.length / totalTasks) * 100)
    },

    addApplication: (app) => {
      applicationApi.create({
        company: app.company,
        position: app.position,
        status: app.status,
        applied_date: app.appliedDate,
        notes: app.notes,
      }).catch(() => {})
      set((state) => {
        const newApp: Application = {
          ...app,
          id: generateId(),
          createdAt: Date.now(),
        }
        const applications = [...state.applications, newApp]
        return { applications }
      })
      persist()
    },

    updateApplicationStatus: (id, status) => {
      applicationApi.update(id, { status } as Record<string, unknown> & { status: string }).catch(() => {})
      set((state) => {
        const applications = state.applications.map((a) =>
          a.id === id ? { ...a, status } : a
        )
        return { applications }
      })
      persist()
    },

    removeApplication: (id) => {
      applicationApi.delete(id).catch(() => {})
      set((state) => {
        const applications = state.applications.filter((a) => a.id !== id)
        return { applications }
      })
      persist()
    },

    addCalendarEvent: (event) => {
      applicationApi.addCalendarEvent({
        title: event.title,
        date: event.date,
        type: event.type,
        company: event.company,
        position: '',
      }).catch(() => {})
      set((state) => {
        const newEvent: CalendarEvent = {
          ...event,
          id: generateId(),
          createdAt: Date.now(),
        }
        const calendarEvents = [...state.calendarEvents, newEvent]
        return { calendarEvents }
      })
      persist()
    },

    toggleCalendarStar: (id) => {
      set((state) => {
        const calendarEvents = state.calendarEvents.map((e) =>
          e.id === id ? { ...e, starred: !e.starred } : e
        )
        return { calendarEvents }
      })
      persist()
    },

    removeCalendarEvent: (id) => {
      applicationApi.deleteCalendarEvent(id).catch(() => {})
      set((state) => {
        const calendarEvents = state.calendarEvents.filter((e) => e.id !== id)
        return { calendarEvents }
      })
      persist()
    },
  }
})