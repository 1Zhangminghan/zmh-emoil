// ============ API 接口层 ============

import { api, setToken, getToken, setAIKey, getAIKey, isAIKeyConfigured } from './client'

// ============ Auth ============

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  email: string
  password: string
  nickname: string
}

export interface UserInfo {
  id: string
  email: string
  nickname: string
  avatar: string
  targetPosition: string
  targetIndustry: string
}

export interface AuthResult {
  user: UserInfo
  token: string
}

export const authApi = {
  login: (params: LoginParams) => api.post<AuthResult>('/auth/login', params),
  register: (params: RegisterParams) => api.post<AuthResult>('/auth/register', params),
  getMe: () => api.get<{ user: UserInfo }>('/auth/me'),
}

// ============ Profile ============

export interface ProfileData {
  targetPosition?: string
  targetIndustry?: string
  graduationYear?: string
}

export const profileApi = {
  get: () => api.get<ProfileData>('/profile'),
  update: (data: ProfileData) => api.put<ProfileData>('/profile', data),
}

// ============ Resume ============

export interface OptimizedResume {
  name: string
  email: string
  phone: string
  targetPosition: string
  targetIndustry: string
  education: Array<{ school: string; degree: string; major: string; time: string }>
  workExperience: Array<{ company: string; position: string; time: string; description: string }>
  projectExperience: Array<{ name: string; role: string; description: string; techStack: string }>
  skills: string
  certifications: string
}

export interface ResumeAnalysisResult {
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
  aiPowered: boolean
  aiError?: string
}

export interface ResumeParseResult {
  name: string
  email: string
  phone: string
  targetPosition: string
  targetIndustry: string
  education: Array<{ id: string; school: string; degree: string; major: string; startDate: string; endDate: string }>
  workExperience: Array<{ id: string; company: string; position: string; startDate: string; endDate: string; description: string }>
  projectExperience: Array<{ id: string; projectName: string; role: string; description: string; techStack: string }>
  skills: string
  certifications: string
}

export const resumeApi = {
  list: () => api.get<Array<{ id: string; data: Record<string, unknown>; status: string; score: number; updated_at: string }>>('/resumes'),
  save: (data: Record<string, unknown>) => api.post<{ id: string; message: string }>('/resumes', { data }),
  update: (id: string, data: Record<string, unknown>) => api.put<{ id: string; message: string }>(`/resumes/${id}`, { data }),
  delete: (id: string) => api.delete<{ message: string }>(`/resumes/${id}`),
  get: (id: string) => api.get<{ id: string; data: Record<string, unknown> }>(`/resumes/${id}`),
  analyze: (data: Record<string, unknown>) => api.post<ResumeAnalysisResult>('/resumes/analyze', { data }),
  parseResume: (text: string) => api.post<ResumeParseResult>('/resumes/parse', { text }),
  parseFile: async (file: File): Promise<ResumeParseResult> => {
    const formData = new FormData()
    formData.append('file', file)

    const headers: Record<string, string> = {}
    const token = localStorage.getItem('ai_job_auth_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
    const aiKey = localStorage.getItem('ai_job_ai_key')
    if (aiKey) headers['X-AI-Key'] = aiKey

    // 开发环境直连后端（绕过 Vite proxy 以避免 multipart 代理问题），生产环境使用相对路径
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3003' : ''
    const res = await fetch(`${baseUrl}/api/resumes/parse/file`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: '文件解析失败' }))
      throw new Error(body.error || `HTTP ${res.status}`)
    }

    return res.json()
  },
}

// ============ Diagnosis ============

export interface DiagnosisResult {
  totalScore: number
  dimensionScores: Record<string, number>
  strengths: string[]
  weaknesses: string[]
  gapAnalysis: string
}

export interface DiagnosisRecord {
  id: string
  position_id: string
  position_name: string
  type: string
  scores: DiagnosisResult
  results: unknown
  created_at: string
}

export interface DiagnosisQuestion {
  id: string
  dimension: string
  type: 'choice' | 'short' | 'essay'
  difficulty: 'basic' | 'intermediate' | 'advanced'
  question: string
  options?: string[]
}

export const diagnosisApi = {
  getQuestions: (positionId: string) => api.get<DiagnosisQuestion[]>(`/diagnosis/questions/${positionId}`),
  submit: (params: { positionId: string; positionName: string; type: string; answers: string[] }) =>
    api.post<DiagnosisResult>('/diagnosis', params),
  list: () => api.get<DiagnosisRecord[]>('/diagnosis'),
  get: (id: string) => api.get<DiagnosisRecord>(`/diagnosis/${id}`),
}

// ============ Learning ============

export interface LearningPlanStage {
  title: string
  description: string
  duration: string
  tasks: Array<{
    id: string
    dimension: string
    title: string
    description: string
    type: string
    duration: string
  }>
}

export interface LearningPlanRecord {
  id: string
  position_name: string
  recruitment_type: string
  stages: LearningPlanStage[]
  completions?: string[]
  created_at: string
}

export const learningApi = {
  listPlans: () => api.get<LearningPlanRecord[]>('/learning/plans'),
  createPlan: (params: { positionName: string; recruitmentType: string; weaknesses: string[] }) =>
    api.post<LearningPlanRecord>('/learning/plans', params),
  getPlan: (id: string) => api.get<LearningPlanRecord>(`/learning/plans/${id}`),
  toggleTask: (planId: string, taskId: string) =>
    api.put<{ completions: string[] }>(`/learning/plans/${planId}/tasks`, { taskId }),
  getMaterials: (dimension: string) => api.get<LearningMaterialItem[]>('/learning/materials', { dimension }),
  generateQuiz: (dimension: string) =>
    api.post<Array<{ question: string; options: string[]; answer: number }>>('/learning/quiz/generate', { dimension }),
  generateContent: (dimension: string) =>
    api.post<{ title: string; content: string; tips: string[] }>('/learning/content/generate', { dimension }),
}

// ============ Quiz ============

export interface QuizQuestion {
  id: string
  type: 'choice' | 'multi'
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  answer: number[]
  analysis: string
  knowledgePoint: string
}

export interface QuizStats {
  totalAnswered: number
  correctCount: number
  wrongQuestionIds: string[]
  favoriteQuestionIds: string[]
}

export const quizApi = {
  getPositionQuestions: (positionId: string) =>
    api.get<{ name: string; questions: QuizQuestion[] }>(`/quiz/position/${positionId}`),
  getPositionStats: () =>
    api.get<Record<string, number>>('/quiz/positions/stats'),
  generatePositionQuestions: (positionId: string, count: number = 10) =>
    api.post<{ questions: QuizQuestion[]; generated: boolean }>(`/quiz/position/${positionId}/generate`, { count }),
  getAptitudeQuestions: () =>
    api.get<QuizQuestion[]>('/quiz/aptitude'),
  generateAptitudeQuestions: (params: { category?: string; count?: number; difficulty?: string }) =>
    api.post<{ questions: QuizQuestion[]; generated: boolean }>('/quiz/aptitude/generate', params),
  submitAnswer: (params: { questionId: string; userAnswer: number[]; isCorrect: boolean }) =>
    api.post<{ analysis: string }>('/quiz/answer', params),
  getStats: () => api.get<QuizStats>('/quiz/stats'),
}

// ============ Interview ============

export interface InterviewEvaluation {
  score: number
  feedback: string
  highlights: string[]
  improvements: string[]
}

export interface InterviewHistoryItem {
  id: string
  question: string
  answer: string
  dimension: string
  interview_round: string
  score: number
  feedback: InterviewEvaluation
  created_at: string
}

export interface InterviewReport {
  overallScore: number
  summary: string
  dimensionScores: Array<{ dimension: string; score: number }>
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export const interviewApi = {
  getQuestions: (type: string) => api.get<Array<{ id: string; question: string; dimension: string }>>('/interview/questions', { type }),
  evaluate: (params: { question: string; answer: string; dimension: string; targetPosition: string; interviewType: string }) =>
    api.post<InterviewEvaluation>('/interview/evaluate', params),
  history: () => api.get<InterviewHistoryItem[]>('/interview/history'),
  report: (params: { answers: Array<{ question: string; answer: string; score: number; dimension: string; highlights: string[]; improvements: string[] }>; interviewType: string; targetPosition: string }) =>
    api.post<InterviewReport>('/interview/report', params),
}

// ============ Experience ============

export interface ExperienceItem {
  id: string
  company: string
  position: string
  industry: string
  interview_round: string
  author_nickname: string
  summary: string
  content: string
  questions: string[]
  likes: number
  comments?: Array<{ id: string; author_nickname: string; content: string; created_at: string }>
  created_at: string
}

export const experienceApi = {
  list: () => api.get<ExperienceItem[]>('/experiences'),
  create: (params: { company: string; position: string; industry: string; summary: string; content: string; questions: string[] }) =>
    api.post<ExperienceItem>('/experiences', params),
  get: (id: string) => api.get<ExperienceItem>(`/experiences/${id}`),
  addComment: (id: string, params: { content: string; authorNickname: string }) =>
    api.post(`/experiences/${id}/comments`, params),
  like: (id: string) => api.put<{ likes: number }>(`/experiences/${id}/like`),
  search: (params: { company?: string; position?: string; industry?: string; interview_round?: string }) =>
    api.get<ExperienceItem[]>('/experiences/search', params),
  generateExperience: (params: { company: string; position: string; industry?: string; interview_round?: string }) =>
    api.post<ExperienceItem & { aiGenerated?: boolean }>('/experiences/generate', params),
}

// ============ Application ============

export interface ApplicationItem {
  id: string
  company: string
  position: string
  status: string
  applied_date: string
  notes: string
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: string
  company: string
  position: string
}

export interface ActivityItem {
  id: string
  type: string
  content: string
  created_at: string
}

export const applicationApi = {
  list: () => api.get<ApplicationItem[]>('/applications'),
  create: (params: Omit<ApplicationItem, 'id'>) => api.post<ApplicationItem>('/applications', params),
  update: (id: string, params: Partial<ApplicationItem>) => api.put<ApplicationItem>(`/applications/${id}`, params),
  delete: (id: string) => api.delete(`/applications/${id}`),
  listCalendar: () => api.get<CalendarEvent[]>('/applications/calendar'),
  addCalendarEvent: (params: Omit<CalendarEvent, 'id'>) => api.post<CalendarEvent>('/applications/calendar', params),
  deleteCalendarEvent: (id: string) => api.delete(`/applications/calendar/${id}`),
  listActivities: () => api.get<ActivityItem[]>('/applications/activities'),
  addActivity: (params: { type: string; content: string }) => api.post<ActivityItem>('/applications/activities', params),
}

// ============ Position ============

export interface PositionItem {
  id: string
  name: string
  industry: string
  category: string
  icon: string
  description: string
  skills: string[]
  dimensions: string[]
}

export interface PositionCategory {
  name: string
  positions: PositionItem[]
}

export interface PositionIndustry {
  name: string
  categories: PositionCategory[]
}

export interface PositionsResponse {
  industries: PositionIndustry[]
}

export const positionApi = {
  getHierarchy: () => api.get<PositionsResponse>('/positions'),
  getFlat: () => api.get<PositionItem[]>('/positions/flat'),
}

// ============ AI 状态 ============

export interface AIStatus {
  configured: boolean
  model: string
  provider: string
}

export const aiStatusApi = {
  check: () => api.get<AIStatus>('/ai/status'),
}

// ============ 校招日历 ============

export interface CalendarEventItem {
  id: string
  title: string
  company: string
  type: string
  date: string
  recruitment_type: string
  is_preset: number
  position?: string
  industry?: string
}

export const calendarApi = {
  getEvents: (type: string) => api.get<CalendarEventItem[]>('/calendar/events', { type }),
}

// ============ 学习材料 ============

export interface LearningMaterialItem {
  id: string
  dimension: string
  title: string
  type: string
  content: string
}

export interface AISuggestionsParams {
  diagnosis: {
    totalScore: number
    positionName: string
    dimensions: string[]
    dimensionScores: Record<string, number>
  } | null
  learningProgress: number
  quizStats: { answered: number; wrong: number }
  interviewCount: number
  targetPosition: string
}

export interface AISuggestionsResult {
  suggestions: string[]
}

export const aiApi = {
  suggestions: (params: AISuggestionsParams) => api.post<AISuggestionsResult>('/ai/suggestions', params),
}

// Re-export
export { setToken, getToken, setAIKey, getAIKey, isAIKeyConfigured }