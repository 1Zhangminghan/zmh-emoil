import { useState, useEffect } from 'react'
import { useProfileStore } from '@/store/useProfileStore'
import { positionApi, type PositionItem } from '@/api'
import {
  Briefcase, Plus, ChevronDown, ChevronRight, Trash2, ExternalLink,
  Building2, Calendar, Target, X, Check, FileText, ClipboardList,
  Send, PenTool, MessageSquare, Trophy, AlertCircle, ArrowRight,
  Lightbulb,
} from 'lucide-react'

const statusColumns = [
  { id: 'wishlist', label: '待投递', icon: Target, color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
  { id: 'applied', label: '已投递', icon: Send, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  { id: 'written_test', label: '笔试中', icon: PenTool, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  { id: 'interview', label: '面试中', icon: MessageSquare, color: 'text-accent-400', bgColor: 'bg-accent-500/10', borderColor: 'border-accent-500/20' },
  { id: 'offer', label: '已Offer', icon: Trophy, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  { id: 'rejected', label: '已拒绝', icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
] as const

// 状态建议：根据投递状态和天数自动生成下一步建议
function getStatusSuggestion(status: string, appliedDate: string): { text: string; urgency: 'high' | 'medium' | 'low' } | null {
  if (!appliedDate) return null
  const daysSinceApplied = Math.floor((Date.now() - new Date(appliedDate).getTime()) / (1000 * 60 * 60 * 24))
  const days = Math.max(0, daysSinceApplied)

  const suggestions: Record<string, Array<{ maxDays: number; text: string; urgency: 'high' | 'medium' | 'low' }>> = {
    wishlist: [
      { maxDays: Infinity, text: '尽快投递简历，抢占先机', urgency: 'high' },
    ],
    applied: [
      { maxDays: 3, text: '刚投递不久，耐心等待筛选结果', urgency: 'low' },
      { maxDays: 7, text: `已投递${days}天，建议开始准备笔试内容`, urgency: 'medium' },
      { maxDays: 14, text: `已投递${days}天，如无反馈可考虑主动联系HR`, urgency: 'high' },
      { maxDays: Infinity, text: `已投递${days}天，建议关注其他机会同步推进`, urgency: 'high' },
    ],
    written_test: [
      { maxDays: 3, text: '笔试临近，集中刷题巩固高频考点', urgency: 'high' },
      { maxDays: 7, text: `笔试已过${days}天，建议开始准备面试常见问题`, urgency: 'medium' },
      { maxDays: Infinity, text: `笔试已过${days}天，如无面试通知可主动跟进`, urgency: 'high' },
    ],
    interview: [
      { maxDays: 1, text: '面试刚结束，及时复盘记录面试问题', urgency: 'medium' },
      { maxDays: 5, text: `面试已过${days}天，可发送感谢信跟进结果`, urgency: 'medium' },
      { maxDays: 10, text: `面试已过${days}天，建议同步准备其他公司面试`, urgency: 'high' },
      { maxDays: Infinity, text: `面试已过${days}天，如无反馈可礼貌询问HR结果`, urgency: 'high' },
    ],
    offer: [
      { maxDays: Infinity, text: '恭喜！仔细评估offer条款，做出最佳选择', urgency: 'low' },
    ],
    rejected: [
      { maxDays: Infinity, text: '别灰心，总结经验继续投递下一个机会', urgency: 'medium' },
    ],
  }

  const statusSuggestions = suggestions[status]
  if (!statusSuggestions) return null

  for (const s of statusSuggestions) {
    if (days <= s.maxDays) {
      return { text: s.text, urgency: s.urgency }
    }
  }
  return null
}

const industries = ['互联网', '金融', '教育', '医疗', '制造业', '快消', '咨询', '能源', '汽车', '高校/科研']

interface AddForm {
  company: string
  position: string
  industry: string
  status: 'wishlist' | 'applied' | 'written_test' | 'interview' | 'offer' | 'rejected'
  appliedDate: string
  notes: string
  link: string
  resumeId: string
  resumeName: string
  nextStep: string
}

export default function ApplicationTracker() {
  const { applications, addApplication, updateApplicationStatus, removeApplication, targetPosition, targetIndustry, resumeDraft } = useProfileStore()
  const [positions, setPositions] = useState<PositionItem[]>([])
  useEffect(() => {
    positionApi.getFlat().then(setPositions).catch(() => {})
  }, [])
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [editingInterview, setEditingInterview] = useState<string | null>(null)
  const [interviewForm, setInterviewForm] = useState({ date: '', notes: '', result: '' })
  const [form, setForm] = useState<AddForm>({
    company: '',
    position: targetPosition || '',
    industry: targetIndustry || '',
    status: 'wishlist',
    appliedDate: new Date().toISOString().split('T')[0],
    notes: '',
    link: '',
    resumeId: '',
    resumeName: '',
    nextStep: '',
  })

  // 获取已保存的简历列表（从 localStorage）
  const savedResumes = (() => {
    try {
      const data = JSON.parse(localStorage.getItem('resume_list') || '[]')
      return Array.isArray(data) ? data : []
    } catch { return [] }
  })()

  const handleAdd = () => {
    if (!form.company || !form.position) return
    addApplication({
      ...form,
      interviewNotes: '',
      interviewDate: '',
      interviewResult: '',
    })
    setForm({
      company: '',
      position: targetPosition || '',
      industry: targetIndustry || '',
      status: 'wishlist',
      appliedDate: new Date().toISOString().split('T')[0],
      notes: '',
      link: '',
      resumeId: '',
      resumeName: '',
      nextStep: '',
    })
    setShowAddForm(false)
  }

  const handleSaveInterview = (appId: string) => {
    const app = applications.find((a) => a.id === appId)
    if (!app) return
    addApplication({
      company: app.company,
      position: app.position,
      industry: app.industry,
      status: app.status,
      appliedDate: app.appliedDate,
      notes: app.notes,
      link: app.link,
      resumeId: app.resumeId,
      resumeName: app.resumeName,
      nextStep: app.nextStep,
      interviewNotes: interviewForm.notes,
      interviewDate: interviewForm.date,
      interviewResult: interviewForm.result,
    })
    removeApplication(appId)
    setEditingInterview(null)
    setInterviewForm({ date: '', notes: '', result: '' })
  }

  const stats = {
    total: applications.length,
    wishlist: applications.filter((a) => a.status === 'wishlist').length,
    applied: applications.filter((a) => a.status === 'applied').length,
    written_test: applications.filter((a) => a.status === 'written_test').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offer: applications.filter((a) => a.status === 'offer').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }

  const activeCount = stats.applied + stats.written_test + stats.interview
  const offerRate = stats.total > 0 ? Math.round((stats.offer / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-400" />
            求职进度追踪
          </h2>
          <p className="text-slate-400 text-sm mt-1">看板式管理你的投递全流程，从网申到Offer一目了然</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          添加投递
        </button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <div className="card text-center py-3">
          <p className="text-xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">总投递</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xl font-bold text-blue-400">{activeCount}</p>
          <p className="text-xs text-slate-400 mt-1">进行中</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xl font-bold text-emerald-400">{stats.offer}</p>
          <p className="text-xs text-slate-400 mt-1">已Offer</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xl font-bold text-red-400">{stats.rejected}</p>
          <p className="text-xs text-slate-400 mt-1">已拒绝</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xl font-bold text-accent-400">{offerRate}%</p>
          <p className="text-xs text-slate-400 mt-1">Offer率</p>
        </div>
      </div>

      {/* 添加表单 */}
      {showAddForm && (
        <div className="card border-primary-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">添加投递记录</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">公司名称 *</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="如：腾讯"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">岗位名称 *</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="input-field"
              >
                <option value="" className="bg-surface-dark">请选择岗位</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.name} className="bg-surface-dark">{pos.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">行业</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="input-field"
              >
                <option value="" className="bg-surface-dark">请选择行业</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind} className="bg-surface-dark">{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">当前状态</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AddForm['status'] })}
                className="input-field"
              >
                {statusColumns.map((col) => (
                  <option key={col.id} value={col.id} className="bg-surface-dark">{col.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">投递日期</label>
              <input
                type="date"
                value={form.appliedDate}
                onChange={(e) => setForm({ ...form, appliedDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">关联简历</label>
              <select
                value={form.resumeId}
                onChange={(e) => {
                  const resume = savedResumes.find((r: any) => r.id === e.target.value)
                  setForm({ ...form, resumeId: e.target.value, resumeName: resume?.name || '' })
                }}
                className="input-field"
              >
                <option value="" className="bg-surface-dark">不关联</option>
                {savedResumes.map((r: any) => (
                  <option key={r.id} value={r.id} className="bg-surface-dark">{r.name || '未命名简历'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">投递链接</label>
              <input
                type="text"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="可选"
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">下一步计划</label>
              <input
                type="text"
                value={form.nextStep}
                onChange={(e) => setForm({ ...form, nextStep: e.target.value })}
                placeholder="如：准备笔试、等待面试通知"
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-slate-400 mb-1 block">备注</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="如：内推人、关键时间节点等"
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button onClick={handleAdd} disabled={!form.company || !form.position} className="btn-primary">
                <Check className="w-4 h-4 inline mr-1" />
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 看板列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusColumns.map((col) => {
          const Icon = col.icon
          const items = applications.filter((a) => a.status === col.id)
          return (
            <div key={col.id} className={`card ${col.bgColor} border ${col.borderColor} min-h-[200px] flex flex-col`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${col.color}`} />
                  <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${col.bgColor} ${col.color}`}>
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-slate-500 text-center py-4">暂无投递</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1">
                  {items.map((app) => {
                    const isExpanded = expandedCard === app.id
                    const isEditing = editingInterview === app.id
                    return (
                      <div key={app.id} className="bg-surface-dark/50 rounded-lg p-3 border border-surface-border/20">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-white truncate">{app.company}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{app.position}</p>
                          </div>
                          <button
                            onClick={() => setExpandedCard(isExpanded ? null : app.id)}
                            className="text-slate-500 hover:text-white p-1 shrink-0"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-surface-border/20 space-y-2">
                            {app.industry && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Building2 className="w-3 h-3" />
                                {app.industry}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {app.appliedDate}
                            </div>
                            {app.resumeName && (
                              <div className="flex items-center gap-1.5 text-xs text-primary-400">
                                <FileText className="w-3 h-3" />
                                简历：{app.resumeName}
                              </div>
                            )}
                            {app.nextStep && (
                              <div className="flex items-center gap-1.5 text-xs text-accent-400">
                                <ArrowRight className="w-3 h-3" />
                                下一步：{app.nextStep}
                              </div>
                            )}
                            {app.link && (
                              <a href={app.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300">
                                <ExternalLink className="w-3 h-3" />
                                查看投递链接
                              </a>
                            )}
                            {app.notes && (
                              <p className="text-xs text-slate-500 bg-surface-hover rounded p-1.5">{app.notes}</p>
                            )}

                            {/* 智能建议 */}
                            {(() => {
                              const suggestion = getStatusSuggestion(app.status, app.appliedDate)
                              if (!suggestion) return null
                              const urgencyStyles = {
                                high: 'bg-red-500/10 border-red-500/20 text-red-300',
                                medium: 'bg-accent-500/10 border-accent-500/20 text-accent-300',
                                low: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
                              }
                              return (
                                <div className={`flex items-start gap-2 p-2 rounded-lg border ${urgencyStyles[suggestion.urgency]}`}>
                                  <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs leading-relaxed">{suggestion.text}</p>
                                  </div>
                                </div>
                              )
                            })()}

                            {/* 面试记录 */}
                            {app.interviewDate && (
                              <div className="bg-surface-hover rounded-lg p-2 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-accent-400 font-medium">
                                  <ClipboardList className="w-3 h-3" />
                                  面试记录
                                </div>
                                <p className="text-xs text-slate-400">日期：{app.interviewDate}</p>
                                {app.interviewResult && (
                                  <p className="text-xs text-slate-400">结果：{app.interviewResult}</p>
                                )}
                                {app.interviewNotes && (
                                  <p className="text-xs text-slate-500">{app.interviewNotes}</p>
                                )}
                              </div>
                            )}

                            {/* 面试笔记编辑 */}
                            {isEditing && (
                              <div className="bg-surface-hover rounded-lg p-2 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs text-accent-400 font-medium">
                                  <ClipboardList className="w-3 h-3" />
                                  添加面试记录
                                </div>
                                <input
                                  type="date"
                                  value={interviewForm.date}
                                  onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                                  className="input-field text-xs"
                                  placeholder="面试日期"
                                />
                                <input
                                  type="text"
                                  value={interviewForm.result}
                                  onChange={(e) => setInterviewForm({ ...interviewForm, result: e.target.value })}
                                  className="input-field text-xs"
                                  placeholder="面试结果（如：通过/待定）"
                                />
                                <textarea
                                  value={interviewForm.notes}
                                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                                  className="input-field text-xs"
                                  rows={2}
                                  placeholder="面试笔记..."
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveInterview(app.id)}
                                    className="text-xs px-2 py-1 rounded bg-primary-600 text-white"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={() => setEditingInterview(null)}
                                    className="text-xs px-2 py-1 rounded bg-surface-hover text-slate-400"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 操作按钮 */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => {
                                  setEditingInterview(app.id)
                                  setInterviewForm({
                                    date: app.interviewDate || '',
                                    notes: app.interviewNotes || '',
                                    result: app.interviewResult || '',
                                  })
                                }}
                                className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"
                              >
                                <ClipboardList className="w-3 h-3" />
                                面试笔记
                              </button>
                            </div>

                            {/* 状态切换 */}
                            <div className="pt-2">
                              <label className="text-xs text-slate-500 mb-1 block">切换状态</label>
                              <select
                                value={app.status}
                                onChange={(e) => updateApplicationStatus(app.id, e.target.value as typeof app.status)}
                                className="w-full text-xs px-2 py-1.5 rounded bg-surface-hover border border-surface-border text-slate-300 focus:outline-none focus:border-primary-500"
                              >
                                {statusColumns.map((s) => (
                                  <option key={s.id} value={s.id} className="bg-surface-dark">{s.label}</option>
                                ))}
                              </select>
                            </div>

                            <button
                              onClick={() => removeApplication(app.id)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 pt-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              删除
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 空状态 */}
      {applications.length === 0 && !showAddForm && (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-surface-hover mx-auto flex items-center justify-center mb-4">
            <Briefcase className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">开始记录你的求职进度</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            添加投递记录，关联简历版本，追踪每个岗位的申请状态和面试情况
          </p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            <Plus className="w-4 h-4 inline mr-1.5" />
            添加第一个投递
          </button>
        </div>
      )}
    </div>
  )
}