import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { authApi, setToken } from '@/api/index'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !nickname) return

    setLoading(true)
    setError('')

    try {
      const result = await authApi.register({ email, password, nickname })
      setToken(result.token)
      setAuth(result.user, result.token, true)
      navigate('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-500 rounded-2xl mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">注册 AI 求职辅导</h1>
          <p className="text-slate-400 mt-2 text-sm">创建账号，开启智能求职之旅</p>
        </div>

        {/* 注册卡片 */}
        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                昵称
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入你的昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                邮箱地址
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="请输入邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                密码
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="请设置密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || !nickname}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-slate-400 text-sm">已有账号？</span>
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 text-sm font-medium ml-1 transition-colors"
            >
              立即登录
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          演示环境 · 输入任意信息即可注册
        </p>
      </div>
    </div>
  )
}