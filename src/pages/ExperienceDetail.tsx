import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Heart, MessageCircle, Calendar, Eye,
  ChevronDown, ChevronUp, Loader2, Play,
  Send, Bookmark,
} from 'lucide-react'
import { experienceApi, type ExperienceItem } from '@/api'

export default function ExperienceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [experience, setExperience] = useState<ExperienceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [showAllQuestions, setShowAllQuestions] = useState(false)

  // 评论
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [localComments, setLocalComments] = useState<Array<{ id: string; author_nickname: string; content: string; created_at: string }>>([])

  useEffect(() => {
    if (!id) return
    // 检查收藏状态
    const bookmarks = JSON.parse(localStorage.getItem('exp_bookmarks') || '[]') as string[]
    setBookmarked(bookmarks.includes(id))
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    experienceApi.get(id)
      .then((data) => {
        if (!cancelled) {
          setExperience(data)
          setLikeCount(data.likes || 0)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '加载面经详情失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  const toggleLike = async () => {
    if (!id || liked) return
    try {
      const result = await experienceApi.like(id)
      setLiked(true)
      setLikeCount(result.likes)
    } catch {
      setLiked(true)
      setLikeCount((prev) => prev + 1)
    }
  }

  const toggleBookmark = () => {
    if (!id) return
    const bookmarks = JSON.parse(localStorage.getItem('exp_bookmarks') || '[]') as string[]
    if (bookmarked) {
      const idx = bookmarks.indexOf(id)
      if (idx >= 0) bookmarks.splice(idx, 1)
    } else {
      bookmarks.push(id)
    }
    localStorage.setItem('exp_bookmarks', JSON.stringify(bookmarks))
    setBookmarked(!bookmarked)
  }

  const handleSubmitComment = async () => {
    if (!id || !commentText.trim()) return
    setCommentSubmitting(true)
    try {
      const result = await experienceApi.addComment(id, { content: commentText.trim(), authorNickname: '我' })
      setLocalComments((prev) => [...prev, result as any])
      setCommentText('')
    } catch {
      // 本地添加
      setLocalComments((prev) => [...prev, { id: Date.now().toString(), author_nickname: '我', content: commentText.trim(), created_at: new Date().toISOString() }])
      setCommentText('')
    } finally {
      setCommentSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  if (error || !experience) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-xl text-slate-400">{error || '面经不存在'}</p>
        <button onClick={() => navigate('/experience')} className="btn-secondary">
          返回面经列表
        </button>
      </div>
    )
  }

  const renderContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-white mt-6 mb-3">
            {line.replace('## ', '')}
          </h3>
        )
      }
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="text-base font-medium text-primary-400 mt-4 mb-2">
            {line.replace('### ', '')}
          </h4>
        )
      }
      if (/^\d+\. /.test(line)) {
        return (
          <li key={index} className="text-sm text-slate-300 ml-4 mb-1 list-decimal">
            {line.replace(/^\d+\. /, '')}
          </li>
        )
      }
      if (line.trim() === '') {
        return <div key={index} className="h-3" />
      }
      return (
        <p key={index} className="text-sm text-slate-300 leading-relaxed">
          {line}
        </p>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/experience')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回面经列表
        </button>
        <button
          onClick={() => navigate('/interview', {
            state: {
              company: experience.company,
              position: experience.position,
              interviewType: experience.interview_round,
            },
          })}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Play className="w-4 h-4" />
          模拟面试 {experience.company} · {experience.position}
        </button>
      </div>

      {/* 头部信息 */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{experience.company}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge-primary">{experience.position}</span>
              <span className="badge-accent">{experience.industry}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                experience.interview_round === '一面' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                experience.interview_round === '二面' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                experience.interview_round === '三面' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                experience.interview_round === '群面' ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30' :
                'bg-pink-500/15 text-pink-400 border border-pink-500/30'
              }`}>
                {experience.interview_round || '一面'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center">
              <span className="text-xs text-slate-400">{experience.author_nickname?.charAt(0) || '匿'}</span>
            </div>
            <span>{experience.author_nickname || '匿名用户'}</span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {experience.created_at ? new Date(experience.created_at).toLocaleDateString('zh-CN') : ''}
          </span>
        </div>
      </div>

      {/* 内容区 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">面试详情</h3>
        <div className="space-y-1">{renderContent(experience.content)}</div>
      </div>

      {/* 面试问题 */}
      {experience.questions.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">面试问题</h3>
          <div className="space-y-2">
            {experience.questions.slice(0, showAllQuestions ? undefined : 3).map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover/50">
                <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300">{q}</span>
              </div>
            ))}
          </div>
          {experience.questions.length > 3 && (
            <button
              onClick={() => setShowAllQuestions(!showAllQuestions)}
              className="flex items-center gap-1 mt-3 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {showAllQuestions ? (
                <>收起 <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>查看全部 {experience.questions.length} 个问题 <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* 互动栏 */}
      <div className="card flex items-center gap-6">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            liked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'
          }`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>{likeCount}</span>
        </button>
        <button
          onClick={toggleBookmark}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            bookmarked ? 'text-accent-400' : 'text-slate-400 hover:text-accent-400'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
          <span>{bookmarked ? '已收藏' : '收藏'}</span>
        </button>
        <span className="flex items-center gap-1.5 text-sm text-slate-400">
          <MessageCircle className="w-5 h-5" />
          <span>{(experience.comments?.length ?? 0) + localComments.length}</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm text-slate-400">
          <Eye className="w-5 h-5" />
          <span>{Math.floor(Math.random() * 500) + 200}</span>
        </span>
      </div>

      {/* 评论区 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">
          评论 ({((experience.comments?.length ?? 0) + localComments.length)})
        </h3>

        {/* 评论列表 */}
        <div className="space-y-4 mb-4">
          {/* 服务器评论 */}
          {experience.comments && experience.comments.length > 0 && experience.comments.map((comment, idx) => (
            <div key={comment.id || idx} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs text-slate-400">
                  {comment.author_nickname?.charAt(0) || '匿'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-200">
                    {comment.author_nickname || '匿名用户'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {comment.created_at ? new Date(comment.created_at).toLocaleDateString('zh-CN') : ''}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
          {/* 本地评论 */}
          {localComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs text-primary-400">
                  {comment.author_nickname?.charAt(0) || '我'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-primary-300">
                    {comment.author_nickname || '我'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {comment.created_at ? new Date(comment.created_at).toLocaleDateString('zh-CN') : ''}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
          {/* 无评论 */}
          {(!experience.comments || experience.comments.length === 0) && localComments.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">暂无评论，来说点什么吧</p>
          )}
        </div>

        {/* 评论输入框 */}
        <div className="flex gap-3 pt-4 border-t border-surface-border/30">
          <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0 mt-1">
            <span className="text-xs text-slate-400">我</span>
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的想法..."
              rows={2}
              className="input-field resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || commentSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {commentSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                发布评论
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}