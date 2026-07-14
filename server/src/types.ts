// ============ 共享类型定义 ============

export interface User {
  id: string
  email: string
  password_hash: string
  nickname: string
  avatar: string
  target_position: string
  target_industry: string
  created_at: string
  updated_at: string
}

export interface UserPublic {
  id: string
  email: string
  nickname: string
  avatar: string
  targetPosition: string
  targetIndustry: string
}

export interface ResumeData {
  name: string
  email: string
  phone: string
  targetPosition: string
  targetIndustry: string
  education: Array<{ id: string; school: string; degree: string; major: string }>
  workExperience: Array<{ id: string; company: string; position: string; description: string }>
  projectExperience: Array<{ id: string; projectName: string; role: string; description: string; techStack: string }>
  skills: string
  certifications: string
}

export interface ResumeRecord {
  id: string
  user_id: string
  data: string // JSON string of ResumeData
  status: 'draft' | 'completed'
  score: number
  created_at: string
  updated_at: string
}

export interface DiagnosisRecord {
  id: string
  user_id: string
  position_id: string
  position_name: string
  type: string
  scores: string // JSON
  results: string // JSON
  created_at: string
}

export interface LearningPlan {
  id: string
  user_id: string
  position_name: string
  recruitment_type: string
  stages: string // JSON
  created_at: string
}

export interface LearningTaskCompletion {
  id: string
  plan_id: string
  task_id: string
  completed_at: string
}

export interface QuizRecord {
  id: string
  user_id: string
  question_id: string
  user_answer: string // JSON array
  is_correct: number
  created_at: string
}

export interface InterviewRecord {
  id: string
  user_id: string
  question: string
  answer: string
  dimension: string
  interview_type: string
  score: number
  feedback: string // JSON
  created_at: string
}

export interface Experience {
  id: string
  user_id: string
  company: string
  position: string
  industry: string
  author_nickname: string
  author_avatar: string
  summary: string
  content: string
  questions: string // JSON array
  likes: number
  created_at: string
}

export interface ExperienceComment {
  id: string
  experience_id: string
  author_nickname: string
  author_avatar: string
  content: string
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  company: string
  position: string
  status: string
  applied_date: string
  notes: string
  created_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  date: string
  type: string
  company: string
  position: string
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  type: string
  content: string
  created_at: string
}

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

export interface ResumeAnalysis {
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

export interface InterviewEvaluation {
  score: number
  feedback: string
  highlights: string[]
  improvements: string[]
}

export interface InterviewReport {
  overallScore: number
  summary: string
  dimensionScores: Array<{ dimension: string; score: number }>
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export interface DiagnosisResult {
  totalScore: number
  dimensionScores: Record<string, number>
  strengths: string[]
  weaknesses: string[]
  gapAnalysis: string
}

export interface LearningPlanTask {
  id: string
  dimension: string
  title: string
  description: string
  type: string
  duration: string
}

export interface LearningPlanStage {
  title: string
  description: string
  duration: string
  tasks: LearningPlanTask[]
}

export interface LearningPlanResult {
  stages: LearningPlanStage[]
}