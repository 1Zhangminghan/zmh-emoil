import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'

const industries = ['互联网', '金融', '咨询', '快消', '制造', '教育', '医疗']

interface FormData {
  company: string
  position: string
  industry: string
  content: string
  isAnonymous: boolean
}

const initialFormData: FormData = {
  company: '',
  position: '',
  industry: '互联网',
  content: '',
  isAnonymous: false,
}

export default function ExperiencePost() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.company.trim()) newErrors.company = '请填写公司名称'
    if (!formData.position.trim()) newErrors.position = '请填写职位名称'
    if (!formData.content.trim()) newErrors.content = '请填写面经内容'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    setSubmitted(true)
    setTimeout(() => {
      navigate('/experience')
    }, 1500)
  }

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Send className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white">发布成功！</h2>
        <p className="text-slate-400">你的面经已成功发布，正在跳转...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/experience')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        返回面经列表
      </button>

      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-white">发布实习面经</h2>
        <p className="text-slate-400 text-sm mt-1">分享你的实习面试经历，帮助更多同学</p>
      </div>

      {/* 表单 */}
      <div className="card space-y-5">
        {/* 公司名称 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            公司名称 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="例如：字节跳动"
            value={formData.company}
            onChange={(e) => updateField('company', e.target.value)}
            className={`input-field ${errors.company ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          {errors.company && (
            <p className="text-red-400 text-xs mt-1">{errors.company}</p>
          )}
        </div>

        {/* 职位名称 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            职位名称 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="例如：Java后端开发"
            value={formData.position}
            onChange={(e) => updateField('position', e.target.value)}
            className={`input-field ${errors.position ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          {errors.position && (
            <p className="text-red-400 text-xs mt-1">{errors.position}</p>
          )}
        </div>

        {/* 行业选择 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">所属行业</label>
          <select
            value={formData.industry}
            onChange={(e) => updateField('industry', e.target.value)}
            className="input-field"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind} className="bg-surface-dark">{ind}</option>
            ))}
          </select>
        </div>

        {/* 面经内容 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            面经内容 <span className="text-red-400">*</span>
          </label>
          <textarea
            placeholder="分享你的面试经历，包括面试流程、考察内容、面试建议等..."
            rows={10}
            value={formData.content}
            onChange={(e) => updateField('content', e.target.value)}
            className={`input-field resize-none ${errors.content ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          {errors.content && (
            <p className="text-red-400 text-xs mt-1">{errors.content}</p>
          )}
        </div>

        {/* 匿名发布 */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => updateField('isAnonymous', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-surface-hover rounded-full peer-checked:bg-primary-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
          <span className="text-sm text-slate-300">匿名发布</span>
        </div>

        {/* 提交按钮 */}
        <button onClick={handleSubmit} className="btn-primary w-full flex items-center justify-center gap-2">
          <Send className="w-4 h-4" />
          发布
        </button>
      </div>
    </div>
  )
}