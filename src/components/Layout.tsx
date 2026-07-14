import { ReactNode, useState, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, GraduationCap, MessageSquare, BookOpen, BarChart3, Settings, LogOut, User, Brain, Calendar, Briefcase, Menu, X, Bell, Clock, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useProfileStore } from '@/store/useProfileStore'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/resume', label: '简历优化', icon: FileText },
  { path: '/diagnosis', label: '个性化学习', icon: GraduationCap },
  { path: '/interview', label: '模拟面试', icon: MessageSquare },
  { path: '/quiz', label: '刷题系统', icon: Brain },
  { path: '/experience', label: '实习面经', icon: BookOpen },
  { path: '/calendar', label: '校招日历', icon: Calendar },
  { path: '/tracker', label: '进度追踪', icon: Briefcase },
  { path: '/analytics', label: '个人看板', icon: BarChart3 },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { learningPlans, calendarEvents } = useProfileStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const hasLearningPlan = learningPlans.length > 0

  // 计算通知
  const notifications = useMemo(() => {
    const notifs: Array<{ id: string; title: string; desc: string; type: 'deadline' | 'reminder' | 'tip'; link: string }> = []
    const today = new Date().toISOString().split('T')[0]

    // 日历事件：7天内截止的
    calendarEvents.forEach((event) => {
      if (event.type === 'deadline') {
        const daysLeft = Math.ceil((new Date(event.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
        if (daysLeft >= 0 && daysLeft <= 7) {
          notifs.push({
            id: `cal_${event.id}`,
            title: `${event.company} ${event.title}`,
            desc: daysLeft === 0 ? '今天截止！' : `还有 ${daysLeft} 天截止`,
            type: 'deadline',
            link: '/calendar',
          })
        }
      }
    })

    // 学习计划提醒
    if (learningPlans.length > 0) {
      const activePlan = learningPlans[0]
      const totalTasks = activePlan.stages.reduce((sum, s) => sum + s.tasks.length, 0)
      if (totalTasks > 0) {
        notifs.push({
          id: `learn_${activePlan.id}`,
          title: `${activePlan.positionName} 学习计划`,
          desc: '继续完成学习任务，保持进度',
          type: 'reminder',
          link: '/learning',
        })
      }
    }

    return notifs.slice(0, 5)
  }, [calendarEvents, learningPlans])

  const isLoginPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/'
  const isOnboardingPage = location.pathname === '/onboarding'

  if (isLoginPage || isOnboardingPage) {
    return <>{children}</>
  }

  const closeSidebar = () => setSidebarOpen(false)

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-surface-border/30 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" onClick={closeSidebar}>
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">AI求职辅导</span>
        </Link>
        <button onClick={closeSidebar} className="lg:hidden text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isDiagnosisItem = item.path === '/diagnosis'
          // 个性化学习：有学习计划时导航到学习中心，且两个路径都高亮
          const isActive = isDiagnosisItem
            ? (location.pathname.startsWith('/diagnosis') || location.pathname.startsWith('/learning'))
            : (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))
          const linkTo = isDiagnosisItem && hasLearningPlan ? '/learning' : item.path
          return (
            <Link
              key={item.path}
              to={linkTo}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/20 text-primary-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-surface-border/30">
        <Link
          to="/settings"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1 ${
            location.pathname === '/settings'
              ? 'bg-primary-600/20 text-primary-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-hover'
          }`}
        >
          <Settings className="w-5 h-5" />
          个人设置
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-surface-hover w-full transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:flex w-60 bg-surface-card border-r border-surface-border/30 flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSidebar} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface-card border-r border-surface-border/30 flex flex-col z-50 animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        {/* 顶部栏 */}
        <header className="h-14 bg-surface-card/80 backdrop-blur-sm border-b border-surface-border/30 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-medium text-slate-300">
              {navItems.find((i) => {
                if (i.path === '/diagnosis') {
                  return location.pathname.startsWith('/diagnosis') || location.pathname.startsWith('/learning')
                }
                return location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path))
              })?.label || 'AI求职辅导'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* 通知铃铛 */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* 通知下拉 */}
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-surface-card border border-surface-border/50 rounded-xl shadow-2xl z-40 overflow-hidden">
                    <div className="p-3 border-b border-surface-border/30 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">通知</span>
                      <span className="text-xs text-slate-500">{notifications.length} 条</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">暂无通知</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              navigate(n.link)
                              setNotifOpen(false)
                            }}
                            className="w-full flex items-start gap-3 p-3 hover:bg-surface-hover/50 transition-colors text-left border-b border-surface-border/10 last:border-0"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              n.type === 'deadline' ? 'bg-red-500/10' : 'bg-primary-500/10'
                            }`}>
                              {n.type === 'deadline' ? (
                                <Clock className="w-4 h-4 text-red-400" />
                              ) : (
                                <Bell className="w-4 h-4 text-primary-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{n.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="text-sm text-slate-400 hidden sm:inline">{user?.nickname}</span>
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}