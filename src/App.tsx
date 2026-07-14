import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/useAuthStore'
import LandingPage from '@/pages/LandingPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ResumeList from '@/pages/ResumeList'
import ResumeDetail from '@/pages/ResumeDetail'
import ResumeAnalysis from '@/pages/ResumeAnalysis'
import DiagnosisType from '@/pages/DiagnosisType'
import DiagnosisPosition from '@/pages/DiagnosisPosition'
import DiagnosisTest from '@/pages/DiagnosisTest'
import DiagnosisReport from '@/pages/DiagnosisReport'
import LearningCenter from '@/pages/LearningCenter'
import LearningDetail from '@/pages/LearningDetail'
import InterviewConfig from '@/pages/InterviewConfig'
import InterviewRoom from '@/pages/InterviewRoom'
import InterviewReport from '@/pages/InterviewReport'
import ExperienceList from '@/pages/ExperienceList'
import ExperienceDetail from '@/pages/ExperienceDetail'
import ExperiencePost from '@/pages/ExperiencePost'
import QuizCenter from '@/pages/QuizCenter'
import QuizPractice from '@/pages/QuizPractice'
import RecruitmentCalendar from '@/pages/RecruitmentCalendar'
import ApplicationTracker from '@/pages/ApplicationTracker'
import Dashboard from '@/pages/Dashboard'
import Settings from '@/pages/Settings'
import OnboardingPage from '@/pages/OnboardingPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Dashboard 守卫：未完成引导则跳转引导页
function DashboardGuard() {
  const { hasCompletedOnboarding } = useAuthStore()
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />
  return <HomePage />
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardGuard /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><ResumeList /></ProtectedRoute>} />
        <Route path="/resume/:id/analysis" element={<ProtectedRoute><ResumeAnalysis /></ProtectedRoute>} />
        <Route path="/resume/:id" element={<ProtectedRoute><ResumeDetail /></ProtectedRoute>} />
        <Route path="/diagnosis" element={<ProtectedRoute><DiagnosisType /></ProtectedRoute>} />
        <Route path="/diagnosis/position" element={<ProtectedRoute><DiagnosisType /></ProtectedRoute>} />
        <Route path="/diagnosis/:type" element={<ProtectedRoute><DiagnosisPosition /></ProtectedRoute>} />
        <Route path="/diagnosis/:type/:id" element={<ProtectedRoute><DiagnosisTest /></ProtectedRoute>} />
        <Route path="/diagnosis/:type/:id/report" element={<ProtectedRoute><DiagnosisReport /></ProtectedRoute>} />
        <Route path="/learning" element={<ProtectedRoute><LearningCenter /></ProtectedRoute>} />
        <Route path="/learning/:planId" element={<ProtectedRoute><LearningDetail /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><InterviewConfig /></ProtectedRoute>} />
        <Route path="/interview/:id" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
        <Route path="/interview/:id/report" element={<ProtectedRoute><InterviewReport /></ProtectedRoute>} />
        <Route path="/experience" element={<ProtectedRoute><ExperienceList /></ProtectedRoute>} />
        <Route path="/experience/:id" element={<ProtectedRoute><ExperienceDetail /></ProtectedRoute>} />
        <Route path="/experience/post" element={<ProtectedRoute><ExperiencePost /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><QuizCenter /></ProtectedRoute>} />
        <Route path="/quiz/position/:positionId" element={<ProtectedRoute><QuizPractice /></ProtectedRoute>} />
        <Route path="/quiz/aptitude" element={<ProtectedRoute><QuizPractice /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><RecruitmentCalendar /></ProtectedRoute>} />
        <Route path="/tracker" element={<ProtectedRoute><ApplicationTracker /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}