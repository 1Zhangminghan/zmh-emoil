import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/store/useProfileStore'
import { resumeApi } from '@/api'
import { Plus, FileText, Clock, Trash2, Loader2, Eye } from 'lucide-react'

interface ResumeItem {
  id: string
  name: string
  score: number
  status: 'completed' | 'draft'
  updatedAt: string
}

function getScoreBadge(score: number) {
  if (score > 80) return 'badge-success'
  if (score >= 60) return 'badge-accent'
  return 'badge-danger'
}

function getStatusBadge(status: ResumeItem['status']) {
  if (status === 'completed') return 'badge-success'
  return 'badge-accent'
}

function getStatusLabel(status: ResumeItem['status']) {
  if (status === 'completed') return '已完成'
  return '草稿'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '未知'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

export default function ResumeList() {
  const navigate = useNavigate()
  const { resumeDraft, loadResumeAnalysis, lastResumeId } = useProfileStore()
  const storedAnalysis = loadResumeAnalysis()
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const deletingRef = useRef(false)

  // 从后端加载简历列表
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    resumeApi.list()
      .then((data) => {
        if (cancelled) return
        const items: ResumeItem[] = data.map((r) => {
          const d = r.data as Record<string, unknown>
          return {
            id: r.id,
            name: (d.name as string) || '未命名简历',
            score: r.score || 0,
            status: (r.status as ResumeItem['status']) || 'draft',
            updatedAt: r.updated_at || '',
          }
        })
        setResumes(items)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '加载简历列表失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [resumeDraft])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    deletingRef.current = true
    if (!confirm('确定要删除这份简历吗？')) {
      deletingRef.current = false
      return
    }
    try {
      await resumeApi.delete(id)
      setResumes((prev) => prev.filter((r) => r.id !== id))
    } catch {
      alert('删除失败，请重试')
    } finally {
      deletingRef.current = false
    }
  }

  const isEmpty = !loading && resumes.length === 0

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">我的简历</h2>
          <p className="text-slate-400 text-sm mt-1">管理你的简历，优化求职竞争力</p>
        </div>
        <button
          onClick={() => navigate('/resume/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建新简历
        </button>
      </div>

      {/* 上次分析结果入口 */}
      {storedAnalysis.analysis && lastResumeId && (
        <div className="card border-primary-500/30 bg-primary-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {(storedAnalysis.formData as Record<string, unknown>)?.name as string || '简历'} · 上次分析结果
                </h3>
                <p className="text-slate-400 text-sm">
                  综合评分 <span className="text-primary-400 font-bold">{(storedAnalysis.analysis as Record<string, unknown>)?.overallScore as number || 0}分</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/resume/${lastResumeId}/analysis`)}
              className="btn-primary flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              查看分析
            </button>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      ) : isEmpty ? (
        <div className="card flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-surface-hover rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">还没有简历</h3>
          <p className="text-slate-400 text-sm mb-6">创建你的第一份简历，开始智能优化之旅</p>
          <button
            onClick={() => navigate('/resume/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建第一份简历
          </button>
        </div>
      ) : (
        /* 简历卡片网格 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              onClick={() => { if (!deletingRef.current) navigate(`/resume/${resume.id}`) }}
              className="card hover:border-primary-500/40 hover:bg-surface-hover/30 cursor-pointer transition-all duration-200 group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold group-hover:text-primary-300 transition-colors">
                      {resume.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={getStatusBadge(resume.status)}>
                        {getStatusLabel(resume.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={getScoreBadge(resume.score)}>
                  {resume.score > 0 ? `${resume.score}分` : '--'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>最后更新：{formatDate(resume.updatedAt)}</span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, resume.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1"
                  title="删除简历"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}