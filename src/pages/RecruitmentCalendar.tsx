import { useState, useEffect } from 'react'
import { useProfileStore } from '@/store/useProfileStore'
import { calendarApi, type CalendarEventItem } from '@/api'
import {
  Calendar, Clock, Star, Plus, Trash2, ChevronLeft,
  Building2, Briefcase, X, Check, Filter, Bell, Loader2,
  Search, Target,
} from 'lucide-react'

const recruitmentTypes = [
  { id: 'fall', label: '秋招' },
  { id: 'spring', label: '春招' },
  { id: 'intern', label: '日常实习' },
] as const

const eventTypeLabels: Record<string, string> = {
  deadline: '网申截止',
  written_test: '笔试',
  interview: '面试',
  info_session: '宣讲会',
  other: '其他',
}

const eventTypeColors: Record<string, string> = {
  deadline: 'bg-red-500/10 border-red-500/20 text-red-300',
  written_test: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  interview: 'bg-accent-500/10 border-accent-500/20 text-accent-300',
  info_session: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  other: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
}

interface AddEventForm {
  title: string
  company: string
  type: CalendarEventType
  date: string
  recruitmentType: 'fall' | 'spring' | 'intern'
}

type CalendarEventType = 'deadline' | 'written_test' | 'interview' | 'info_session' | 'other'

export default function RecruitmentCalendar() {
  const { calendarEvents, addCalendarEvent, toggleCalendarStar, removeCalendarEvent } = useProfileStore()
  const { targetIndustry } = useProfileStore()
  const [activeTab, setActiveTab] = useState<'fall' | 'spring' | 'intern'>('fall')
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState('')
  const [onlyTarget, setOnlyTarget] = useState(false)
  const [presetEvents, setPresetEvents] = useState<CalendarEventItem[]>([])
  const [presetLoading, setPresetLoading] = useState(false)
  const [form, setForm] = useState<AddEventForm>({
    title: '', company: '', type: 'deadline', date: '', recruitmentType: 'fall',
  })

  // 从后端加载预设事件
  useEffect(() => {
    let cancelled = false
    setPresetLoading(true)
    calendarApi.getEvents(activeTab)
      .then((data) => {
        if (cancelled) return
        setPresetEvents(data)
      })
      .catch(() => {
        if (cancelled) return
        setPresetEvents([])
      })
      .finally(() => {
        if (!cancelled) setPresetLoading(false)
      })
    return () => { cancelled = true }
  }, [activeTab])

  // 合并预设事件和用户自定义事件
  const filteredPreset = presetEvents.filter((e) => e.recruitment_type === activeTab)
  const filteredUser = calendarEvents.filter((e) => e.recruitmentType === activeTab)

  const allEvents = [
    ...filteredPreset.map((e) => ({
      ...e,
      recruitmentType: e.recruitment_type as 'fall' | 'spring' | 'intern',
      id: e.id,
      starred: false,
      isPreset: true,
      position: e.position || '',
      industry: e.industry || '',
    })),
    ...filteredUser.map((e) => ({
      ...e,
      isPreset: false,
      position: (e as any).position || '',
      industry: (e as any).industry || '',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  // 按类型 + 公司 + 目标行业筛选
  let filtered = filterType === 'all' ? allEvents : allEvents.filter((e) => e.type === filterType)
  if (companyFilter.trim()) {
    filtered = filtered.filter((e) => e.company.includes(companyFilter.trim()))
  }
  if (onlyTarget && targetIndustry) {
    filtered = filtered.filter((e) => e.industry === targetIndustry)
  }

  // 提取所有公司列表用于筛选
  const allCompanies = [...new Set(allEvents.map((e) => e.company))].filter(Boolean).sort()

  const today = new Date().toISOString().split('T')[0]
  const upcomingEvents = filtered.filter((e) => e.date >= today)
  const pastEvents = filtered.filter((e) => e.date < today).reverse()

  const handleAdd = () => {
    if (!form.title || !form.date) return
    addCalendarEvent({
      title: form.title,
      company: form.company || '个人',
      type: form.type,
      date: form.date,
      recruitmentType: form.recruitmentType,
      starred: false,
    })
    setForm({ title: '', company: '', type: 'deadline', date: '', recruitmentType: 'fall' })
    setShowAddForm(false)
  }

  const handleStar = (id: string, isPreset: boolean) => {
    if (!isPreset) toggleCalendarStar(id)
  }

  const handleDelete = (id: string, isPreset: boolean) => {
    if (!isPreset) removeCalendarEvent(id)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekDay = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    return `${month}月${day}日 周${weekDay}`
  }

  const isToday = (dateStr: string) => dateStr === today

  const getDaysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `${Math.abs(diff)}天前`
    if (diff === 0) return '今天'
    return `${diff}天后`
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-400" />
            校招日历
          </h2>
          <p className="text-slate-400 text-sm mt-1">掌握秋招/春招/实习关键时间节点，不错过任何机会</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          添加事件
        </button>
      </div>

      {/* 校招类型切换 */}
      <div className="flex gap-1 p-1 bg-surface-dark rounded-xl">
        {recruitmentTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === t.id
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 类型筛选 + 公司搜索 + 目标行业 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {[
          { id: 'all', label: '全部' },
          { id: 'deadline', label: '截止' },
          { id: 'written_test', label: '笔试' },
          { id: 'interview', label: '面试' },
          { id: 'info_session', label: '宣讲' },
          { id: 'other', label: '其他' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterType === f.id
                ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                : 'bg-surface-hover text-slate-400 hover:text-white border border-surface-border/30'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="w-px h-4 bg-surface-border/30 mx-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="搜索公司..."
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-surface-hover text-sm text-white rounded-lg pl-8 pr-3 py-1.5 w-36 border border-surface-border/30 focus:border-primary-500/30 outline-none placeholder:text-slate-500"
          />
        </div>
        {targetIndustry && (
          <button
            onClick={() => setOnlyTarget(!onlyTarget)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              onlyTarget
                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                : 'bg-surface-hover text-slate-400 hover:text-white border border-surface-border/30'
            }`}
            title={`只看${targetIndustry}行业`}
          >
            <Target className="w-3.5 h-3.5" />
            {targetIndustry}
          </button>
        )}
      </div>

      {/* 添加事件表单 */}
      {showAddForm && (
        <div className="card border-primary-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">添加自定义事件</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">事件标题 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="如：腾讯笔试"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">公司名称</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="如：腾讯"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">事件类型</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CalendarEventType })}
                className="input-field"
              >
                {Object.entries(eventTypeLabels).map(([k, v]) => (
                  <option key={k} value={k} className="bg-surface-dark">{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">日期 *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">校招类型</label>
              <select
                value={form.recruitmentType}
                onChange={(e) => setForm({ ...form, recruitmentType: e.target.value as 'fall' | 'spring' | 'intern' })}
                className="input-field"
              >
                <option value="fall" className="bg-surface-dark">秋招</option>
                <option value="spring" className="bg-surface-dark">春招</option>
                <option value="intern" className="bg-surface-dark">日常实习</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleAdd} disabled={!form.title || !form.date} className="btn-primary w-full">
                <Check className="w-4 h-4 inline mr-1" />
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 最近截止倒计时 */}
      {(() => {
        const nearestDeadline = upcomingEvents.filter((e) => e.type === 'deadline').sort((a, b) => a.date.localeCompare(b.date))[0]
        if (!nearestDeadline) return null
        const daysLeft = Math.ceil((new Date(nearestDeadline.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
        return (
          <div className={`card border-2 p-4 flex items-center justify-between ${daysLeft <= 7 ? 'border-red-500/30 bg-red-500/5' : 'border-accent-500/20 bg-accent-500/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${daysLeft <= 7 ? 'bg-red-500/20' : 'bg-accent-500/20'}`}>
                <Bell className={`w-5 h-5 ${daysLeft <= 7 ? 'text-red-400' : 'text-accent-400'}`} />
              </div>
              <div>
                <p className="text-sm text-white font-medium">{nearestDeadline.company} - {nearestDeadline.title}</p>
                <p className="text-xs text-slate-400">{formatDate(nearestDeadline.date)}</p>
              </div>
            </div>
            <div className={`text-center ${daysLeft <= 7 ? 'text-red-400' : 'text-accent-400'}`}>
              <p className="text-2xl font-bold">{daysLeft}</p>
              <p className="text-xs">天</p>
            </div>
          </div>
        )
      })()}

      {/* 统计概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-white">{upcomingEvents.length}</p>
          <p className="text-xs text-slate-400 mt-1">即将到来</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-red-400">
            {upcomingEvents.filter((e) => e.type === 'deadline').length}
          </p>
          <p className="text-xs text-slate-400 mt-1">网申截止</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-blue-400">
            {upcomingEvents.filter((e) => e.type === 'written_test').length}
          </p>
          <p className="text-xs text-slate-400 mt-1">笔试安排</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-accent-400">
            {upcomingEvents.filter((e) => e.type === 'interview').length}
          </p>
          <p className="text-xs text-slate-400 mt-1">面试安排</p>
        </div>
      </div>

      {/* 事件时间线 */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-400" />
          即将到来
        </h3>
        {upcomingEvents.length === 0 ? (
          <div className="card text-center py-10">
            <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">暂无即将到来的事件</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => {
              const isTodayEvent = isToday(event.date)
              const isTargetIndustry = targetIndustry && event.industry === targetIndustry
              return (
                <div
                  key={event.id}
                  className={`card flex items-center gap-4 p-4 transition-all ${
                    isTodayEvent ? 'border-primary-500/40 bg-primary-500/5' : ''
                  } ${isTargetIndustry ? 'border-accent-500/20 bg-accent-500/5' : ''}`}
                >
                  {/* 日期 */}
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                    isTodayEvent ? 'bg-primary-500/20' : 'bg-surface-hover'
                  }`}>
                    <span className={`text-lg font-bold ${isTodayEvent ? 'text-primary-300' : 'text-white'}`}>
                      {new Date(event.date).getDate()}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(event.date).getMonth() + 1}月
                    </span>
                  </div>

                  {/* 事件信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-semibold text-white">{event.title}</h4>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${eventTypeColors[event.type]}`}>
                        {eventTypeLabels[event.type]}
                      </span>
                      {event.industry && (
                        <span className="text-xs px-1.5 py-0.5 rounded border border-slate-500/30 text-slate-400">
                          {event.industry}
                        </span>
                      )}
                      {isTargetIndustry && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-300 border border-accent-500/30">
                          <Target className="w-3 h-3 inline mr-0.5" />
                          目标行业
                        </span>
                      )}
                      {isTodayEvent && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30">
                          今天
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      {event.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {event.company}
                        </span>
                      )}
                      <span>{formatDate(event.date)}</span>
                      <span className={isTodayEvent ? 'text-primary-400 font-medium' : 'text-slate-500'}>
                        {getDaysUntil(event.date)}
                      </span>
                    </div>
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStar(event.id, event.isPreset)}
                      className={`p-2 rounded-lg transition-colors ${
                        event.starred ? 'text-accent-400 bg-accent-500/10' : 'text-slate-500 hover:text-accent-400 hover:bg-surface-hover'
                      }`}
                      title={event.starred ? '取消收藏' : '收藏'}
                    >
                      <Star className={`w-4 h-4 ${event.starred ? 'fill-current' : ''}`} />
                    </button>
                    {!event.isPreset && (
                      <button
                        onClick={() => handleDelete(event.id, event.isPreset)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-hover transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 已过事件 */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
            已过事件
          </h3>
          <div className="space-y-2 opacity-50">
            {pastEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="card flex items-center gap-4 p-4">
                <div className="w-14 h-14 rounded-xl bg-surface-hover flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-slate-400">
                    {new Date(event.date).getDate()}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(event.date).getMonth() + 1}月
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-semibold text-slate-400">{event.title}</h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${eventTypeColors[event.type]}`}>
                      {eventTypeLabels[event.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    {event.company && <span>{event.company}</span>}
                    <span>{formatDate(event.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}