import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useProfileStore } from '@/store/useProfileStore'
import { Save, CheckCircle, User, Briefcase, Building2, Calendar, Cpu, Eye, EyeOff, Trash2 } from 'lucide-react'
import { setAIKey, getAIKey, isAIKeyConfigured, positionApi, type PositionItem } from '@/api'

const industries = ['互联网', '金融', '教育', '医疗', '电商', '游戏', '人工智能', '物联网']
const workYearsOptions = ['应届生', '1年以下', '1-3年', '3-5年', '5-10年', '10年以上']

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const { setTargetPosition: syncProfilePosition } = useProfileStore()
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [targetPosition, setTargetPosition] = useState(user?.targetPosition || '')
  const [targetIndustry, setTargetIndustry] = useState(user?.targetIndustry || '')
  const [workYears, setWorkYears] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const [positions, setPositions] = useState<PositionItem[]>([])
  useEffect(() => {
    positionApi.getFlat().then(setPositions).catch(() => {})
  }, [])

  // AI Key 状态
  const [aiKeyInput, setAiKeyInput] = useState(getAIKey() || '')
  const [showAIKey, setShowAIKey] = useState(false)
  const [aiKeySaved, setAiKeySaved] = useState(isAIKeyConfigured())
  const [aiKeySaving, setAiKeySaving] = useState(false)

  const handleSaveAIKey = async () => {
    setAiKeySaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const trimmed = aiKeyInput.trim()
    setAIKey(trimmed || null)
    setAiKeySaved(!!trimmed)
    setAiKeySaving(false)
  }

  const handleClearAIKey = () => {
    setAiKeyInput('')
    setAIKey(null)
    setAiKeySaved(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    updateUser({
      nickname,
      targetPosition,
      targetIndustry,
    })

    // 同步到 ProfileStore，确保首页/Dashboard等模块读取到最新值
    syncProfilePosition(targetPosition, targetIndustry)

    setSaving(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-white">个人设置</h2>
        <p className="text-slate-400 text-sm mt-1">管理你的个人信息和求职偏好</p>
      </div>

      {/* 成功提示 */}
      {showSuccess && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 animate-in">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300 text-sm">个人信息已保存成功！</span>
        </div>
      )}

      {/* 设置表单 */}
      <div className="card">
        <form onSubmit={handleSave} className="space-y-6">
          {/* 昵称 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <User className="w-4 h-4 text-primary-400" />
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

          {/* 目标岗位 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Briefcase className="w-4 h-4 text-primary-400" />
              目标岗位
            </label>
            <select
              className="input-field"
              value={targetPosition}
              onChange={(e) => setTargetPosition(e.target.value)}
              required
            >
              <option value="" disabled>请选择目标岗位</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.name}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>

          {/* 目标行业 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Building2 className="w-4 h-4 text-primary-400" />
              目标行业
            </label>
            <select
              className="input-field"
              value={targetIndustry}
              onChange={(e) => setTargetIndustry(e.target.value)}
              required
            >
              <option value="" disabled>请选择目标行业</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          {/* 工作年限 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 text-primary-400" />
              工作年限
            </label>
            <select
              className="input-field"
              value={workYears}
              onChange={(e) => setWorkYears(e.target.value)}
            >
              <option value="" disabled>请选择工作年限</option>
              {workYearsOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* 当前邮箱（只读） */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <User className="w-4 h-4 text-slate-500" />
              当前邮箱
            </label>
            <input
              type="email"
              className="input-field opacity-60 cursor-not-allowed"
              value={user?.email || ''}
              disabled
              readOnly
            />
            <p className="text-slate-500 text-xs mt-1">邮箱地址暂不支持修改</p>
          </div>

          {/* 保存按钮 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {saving ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </form>
      </div>

      {/* AI 设置 */}
      <div className="card">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-1">
          <Cpu className="w-5 h-5 text-primary-400" />
          AI 智能分析
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          默认使用 <strong className="text-slate-300">Ollama 本地千问模型</strong>（完全免费，无需 API Key）。也可以切换到云端 API 或自定义 API Key。
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">自定义 API Key（可选）</label>
            <div className="relative">
              <input
                type={showAIKey ? 'text' : 'password'}
                className="input-field pr-20"
                placeholder="sk-xxxxxxxxxxxxxxxx"
                value={aiKeyInput}
                onChange={(e) => setAiKeyInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowAIKey(!showAIKey)}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                {showAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {aiKeyInput && (
                <button
                  type="button"
                  onClick={handleClearAIKey}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveAIKey}
              disabled={aiKeySaving}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
            >
              {aiKeySaving ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {aiKeySaving ? '保存中...' : '保存 API Key'}
            </button>

            {aiKeySaved && (
              <span className="flex items-center gap-1 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                已使用自定义Key
              </span>
            )}
            {!aiKeySaved && !aiKeyInput.trim() && (
              <span className="text-slate-400 text-sm">使用服务端默认配置</span>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300 mb-1">AI 接入方式</p>
            <p>1. <span className="text-emerald-400 font-medium">Ollama 本地模型</span> — 默认方案，完全免费，无需注册。安装后运行 <code className="bg-slate-700 px-1 rounded">ollama pull qwen3:8b</code> 即可使用千问</p>
            <p>2. <a href="https://cloud.siliconflow.cn" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">硅基流动</a> — 云端 API，注册送2000万Token，支持千问/DeepSeek/GLM等</p>
            <p>3. <a href="https://bailian.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">阿里云百炼</a> — 千问官方 API，新用户免费100万tokens/月</p>
          </div>
        </div>
      </div>
    </div>
  )
}