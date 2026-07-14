import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Heart, Calendar, Loader2, Users, MessageSquare, UserCheck, Star, Sparkles } from 'lucide-react'
import { experienceApi, type ExperienceItem } from '@/api'

const industries = ['全部', '互联网', '金融', '咨询', '快消', '制造', '教育', '医疗']

const roundTabs = [
  { key: '全部', label: '全部', icon: null },
  { key: '一面', label: '一面', icon: MessageSquare },
  { key: '二面', label: '二面', icon: UserCheck },
  { key: '三面', label: '三面', icon: Star },
  { key: '群面', label: '群面', icon: Users },
  { key: 'HR面', label: 'HR面', icon: null },
]

const roundColors: Record<string, string> = {
  '一面': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  '二面': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  '三面': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  '群面': 'bg-accent-500/15 text-accent-400 border-accent-500/30',
  'HR面': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
}

export default function ExperienceList() {
  const navigate = useNavigate()
  const [experiences, setExperiences] = useState<ExperienceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [interviewRound, setInterviewRound] = useState('全部')
  const [companyFilter, setCompanyFilter] = useState('')
  const [industryFilter, setIndustryFilter] = useState('全部')
  const [positionFilter, setPositionFilter] = useState('')

  const [searching, setSearching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const mountedRef = useRef(true)

  // AI 生成面经
  const [generating, setGenerating] = useState(false)
  const [generatingError, setGeneratingError] = useState('')

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // 搜索条件变化时，从数据库搜索（防抖 400ms）
  const doSearch = useCallback((round: string, company: string, position: string, industry: string) => {
    if (!mountedRef.current) return

    // 如果没有任何筛选条件，加载全部
    if (round === '全部' && !company.trim() && !position.trim() && industry === '全部') {
      setLoading(true)
      experienceApi.list()
        .then((data) => {
          if (mountedRef.current) setExperiences(data)
        })
        .catch((err) => {
          if (mountedRef.current) setError(err.message || '搜索失败')
        })
        .finally(() => {
          if (mountedRef.current) { setLoading(false); setSearching(false) }
        })
      return
    }

    setSearching(true)
    setLoading(true)
    experienceApi.search({
      interview_round: round !== '全部' ? round : undefined,
      company: company.trim() || undefined,
      position: position.trim() || undefined,
      industry: industry !== '全部' ? industry : undefined,
    })
      .then((data) => {
        if (mountedRef.current) setExperiences(data)
      })
      .catch((err) => {
        if (mountedRef.current) setError(err.message || '搜索失败')
      })
      .finally(() => {
        if (mountedRef.current) { setLoading(false); setSearching(false) }
      })
  }, [])

  // AI 生成面经
  const handleAIGenerate = async () => {
    if (!companyFilter.trim() && !positionFilter.trim()) return
    setGenerating(true)
    setGeneratingError('')
    try {
      const result = await experienceApi.generateExperience({
        company: companyFilter.trim() || positionFilter.trim(),
        position: positionFilter.trim() || companyFilter.trim(),
        industry: industryFilter !== '全部' ? industryFilter : undefined,
        interview_round: interviewRound !== '全部' ? interviewRound : undefined,
      })
      if (mountedRef.current && result) {
        navigate(`/experience/${result.id}`)
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setGeneratingError(err.message || 'AI 生成失败，请确认 AI 服务已启动')
      }
    } finally {
      if (mountedRef.current) setGenerating(false)
    }
  }

  // 防抖搜索
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      doSearch(interviewRound, companyFilter, positionFilter, industryFilter)
    }, 400)
    return () => { clearTimeout(searchTimerRef.current) }
  }, [interviewRound, companyFilter, positionFilter, industryFilter, doSearch])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">实习面经</h2>
          <p className="text-slate-400 text-sm mt-1">按面试轮次筛选，精准查找你需要的面经</p>
        </div>
        <button
          onClick={() => navigate('/experience/post')}
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          发布实习面经
        </button>
      </div>

      {/* 面试轮次 Tab */}
      <div className="flex gap-2 p-1 rounded-lg bg-surface-hover/50 w-fit flex-wrap">
        {roundTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setInterviewRound(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                interviewRound === tab.key
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 筛选栏 */}
      <div className="card !p-4">
        <p className="text-xs text-slate-500 mb-3">
          {interviewRound === '全部' ? '当前展示全部轮次，可通过下方条件进一步搜索' : `当前筛选：${interviewRound}面经`} — 输入公司名和职位进行精确搜索
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="公司名称，如：字节跳动"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="input-field"
          >
            <option value="全部" className="bg-surface-dark">全部行业</option>
            {industries.filter(i => i !== '全部').map((ind) => (
              <option key={ind} value={ind} className="bg-surface-dark">{ind}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="职位名称，如：后端开发"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        {searching && (
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            正在数据库中搜索...
          </div>
        )}
      </div>

      {/* 面经列表 */}
      {loading && !searching ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      ) : experiences.length === 0 ? (
        <div className="card text-center py-12 space-y-4">
          {(companyFilter || positionFilter || interviewRound !== '全部' || industryFilter !== '全部') ? (
            <>
              <p className="text-slate-400">没有找到匹配的面经</p>
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-slate-500">可以让 AI 根据你的搜索条件生成一份模拟面经</p>
                <button
                  onClick={handleAIGenerate}
                  disabled={generating || (!companyFilter.trim() && !positionFilter.trim())}
                  className="btn-primary flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI 正在生成面经...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI 生成「{companyFilter.trim() || positionFilter.trim() || '...'}」面经
                    </>
                  )}
                </button>
                {generatingError && (
                  <p className="text-sm text-red-400">{generatingError}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-400">还没有面经分享，快来发布第一篇吧！</p>
              <p className="text-sm text-slate-500">或在搜索框中输入公司名，让 AI 帮你生成</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              onClick={() => navigate(`/experience/${exp.id}`)}
              className="card hover:border-primary-500/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white truncate">{exp.company}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="badge-primary">{exp.position}</span>
                    <span className="badge-accent">{exp.industry}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${roundColors[exp.interview_round] || roundColors['一面']}`}>
                      {exp.interview_round || '一面'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                {exp.summary}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-surface-hover flex items-center justify-center">
                    <span className="text-[10px] text-slate-400">{exp.author_nickname?.charAt(0) || '匿'}</span>
                  </div>
                  <span>{exp.author_nickname || '匿名用户'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {exp.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {exp.created_at ? new Date(exp.created_at).toLocaleDateString('zh-CN') : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}