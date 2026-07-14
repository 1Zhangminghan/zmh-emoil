import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProfileStore } from '@/store/useProfileStore'
import { resumeApi } from '@/api'
import MonthPicker from '@/components/MonthPicker'
import {
  ChevronLeft, Sparkles, Loader2, User, GraduationCap,
  Briefcase, FolderGit2, Wrench, Upload, FileText, Plus, Trash2,
  ScanLine, CheckCircle, AlertCircle,
} from 'lucide-react'

// ============ 类型定义 ============

interface EducationEntry {
  id: string
  school: string
  degree: string
  major: string
  startDate: string
  endDate: string
}

interface WorkEntry {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
}

interface ProjectEntry {
  id: string
  projectName: string
  role: string
  description: string
  techStack: string
}

interface FormData {
  name: string
  email: string
  phone: string
  targetPosition: string
  targetIndustry: string
  education: EducationEntry[]
  workExperience: WorkEntry[]
  projectExperience: ProjectEntry[]
  skills: string
  certifications: string
}

// ============ 辅助函数 ============

let idCounter = 0
function genId(prefix: string) {
  return `${prefix}_${++idCounter}`
}

// ============ 组件 ============

export default function ResumeDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { targetPosition, targetIndustry, setTargetPosition, saveResumeDraft, loadResumeDraft } = useProfileStore()

  const mountedRef = useRef(true)
  const processingRef = useRef(false)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'upload' | 'manual'>('upload')
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // 组件卸载时标记，防止异步操作完成后 setState
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // 从 localStorage 恢复草稿，同时同步 profile 中的目标岗位
  const [formData, setFormData] = useState<FormData>(() => {
    const saved = loadResumeDraft() as FormData | null
    if (saved && saved.name) {
      return {
        ...saved,
        targetPosition: saved.targetPosition || targetPosition || '',
        targetIndustry: saved.targetIndustry || targetIndustry || '',
      }
    }
    return {
      name: '',
      email: '',
      phone: '',
      targetPosition: targetPosition || '',
      targetIndustry: targetIndustry || '',
      education: [{ id: genId('edu'), school: '', degree: '', major: '', startDate: '', endDate: '' }],
      workExperience: [{ id: genId('work'), company: '', position: '', startDate: '', endDate: '', description: '' }],
      projectExperience: [{ id: genId('proj'), projectName: '', role: '', description: '', techStack: '' }],
      skills: '',
      certifications: '',
    }
  })

  const isNew = id === 'new'

  // 加载已有简历数据
  useEffect(() => {
    if (!id || id === 'new') return
    let cancelled = false
    setPageLoading(true)
    resumeApi.get(id)
      .then((res) => {
        if (cancelled) return
        const d = res.data as Record<string, unknown>
        const hasData = !!(d.name || (d.education as unknown[])?.length > 0 || (d.workExperience as unknown[])?.length > 0)
        setResumeId(id)
        setFormData((prev) => ({
          ...prev,
          name: (d.name as string) || prev.name,
          email: (d.email as string) || prev.email,
          phone: (d.phone as string) || prev.phone,
          targetPosition: (d.targetPosition as string) || targetPosition || '',
          targetIndustry: (d.targetIndustry as string) || targetIndustry || '',
          education: (d.education as EducationEntry[])?.length > 0 ? (d.education as EducationEntry[]) : prev.education,
          workExperience: (d.workExperience as WorkEntry[])?.length > 0 ? (d.workExperience as WorkEntry[]) : prev.workExperience,
          projectExperience: (d.projectExperience as ProjectEntry[])?.length > 0 ? (d.projectExperience as ProjectEntry[]) : prev.projectExperience,
          skills: (d.skills as string) || prev.skills,
          certifications: (d.certifications as string) || prev.certifications,
        }))
        // 只有真正有内容的简历才跳过上传页，自动保存的空简历保留上传入口
        if (!cancelled) {
          if (hasData) {
            setUploadMode('manual')
            setParsed(true)
          }
          // 无数据的简历（自动保存产生的）保持 upload 模式
        }
      })
      .catch(() => {
        if (!cancelled) navigate('/resume', { replace: true })
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false)
      })
    return () => { cancelled = true }
  }, [id, navigate, targetPosition, targetIndustry])

  // 自动保存到后端（防抖 2s）
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    setSaveIndicator('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        if (resumeId) {
          await resumeApi.update(resumeId, formData as unknown as Record<string, unknown>)
        } else {
          const result = await resumeApi.save(formData as unknown as Record<string, unknown>)
          setResumeId(result.id)
          // 不 navigate，保持在上传/填写页面，让用户继续操作
        }
        setSaveIndicator('saved')
        // 2 秒后恢复为 idle
        setTimeout(() => setSaveIndicator('idle'), 2000)
      } catch {
        saveResumeDraft(formData as unknown as Record<string, unknown>)
        setSaveIndicator('error')
        setTimeout(() => setSaveIndicator('idle'), 3000)
      }
    }, 2000)
    return () => { clearTimeout(saveTimerRef.current) }
  }, [formData, resumeId])

  // 上传并解析简历——直接发送文件，由后端解析 PDF/DOCX/TXT
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 防止并发上传
    if (processingRef.current) return
    processingRef.current = true

    setUploadedFile(file.name)
    setUploading(true)
    setParsed(false)

    try {
      if (!mountedRef.current) return

      // 检查文件格式
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
        alert(`不支持的文件格式（.${ext}），请上传 PDF、DOCX 或 TXT 格式的简历文件。`)
        if (mountedRef.current) setUploading(false)
        processingRef.current = false
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      // 检查文件大小（5MB 限制）
      if (file.size > 5 * 1024 * 1024) {
        alert('文件大小超过 5MB 限制，请压缩后重新上传。')
        if (mountedRef.current) setUploading(false)
        processingRef.current = false
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      setUploading(false)
      setParsing(true)

      try {
        // 直接发送文件到后端，由后端解析 PDF/DOCX/TXT
        const parsed = await resumeApi.parseFile(file)
        if (!mountedRef.current) return

        setParsed(true)
        setFormData((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          targetPosition: parsed.targetPosition || prev.targetPosition,
          targetIndustry: parsed.targetIndustry || prev.targetIndustry,
          education: parsed.education.length > 0 ? parsed.education : prev.education,
          workExperience: parsed.workExperience.length > 0 ? parsed.workExperience : prev.workExperience,
          projectExperience: parsed.projectExperience.length > 0 ? parsed.projectExperience : prev.projectExperience,
          skills: parsed.skills || prev.skills,
          certifications: parsed.certifications || prev.certifications,
        }))
      } finally {
        if (mountedRef.current) {
          setParsing(false)
        }
      }
    } catch (err: any) {
      console.error('简历解析失败:', err)
      if (mountedRef.current) {
        alert(err.message || '简历解析失败，请检查文件格式或网络连接。')
      }
    } finally {
      if (mountedRef.current) {
        setUploading(false)
        setParsing(false)
      }
      processingRef.current = false
      // 重置文件输入，允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [])

  // 更新字段
  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // 教育经历操作
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { id: genId('edu'), school: '', degree: '', major: '', startDate: '', endDate: '' }],
    }))
  }

  const removeEducation = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }))
  }

  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }))
  }

  // 实习经历操作
  const addWork = () => {
    setFormData((prev) => ({
      ...prev,
      workExperience: [...prev.workExperience, { id: genId('work'), company: '', position: '', startDate: '', endDate: '', description: '' }],
    }))
  }

  const removeWork = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((w) => w.id !== id),
    }))
  }

  const updateWork = (id: string, field: keyof WorkEntry, value: string) => {
    setFormData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    }))
  }

  // 项目经验操作
  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projectExperience: [...prev.projectExperience, { id: genId('proj'), projectName: '', role: '', description: '', techStack: '' }],
    }))
  }

  const removeProject = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      projectExperience: prev.projectExperience.filter((p) => p.id !== id),
    }))
  }

  const updateProject = (id: string, field: keyof ProjectEntry, value: string) => {
    setFormData((prev) => ({
      ...prev,
      projectExperience: prev.projectExperience.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }))
  }

  // AI 分析——跳转到独立分析结果页
  const handleAnalyze = () => {
    // 保存草稿后再跳转
    saveResumeDraft(formData as unknown as Record<string, unknown>)
    if (formData.targetPosition) {
      setTargetPosition(formData.targetPosition, formData.targetIndustry)
    }
    navigate(`/resume/${id || 'new'}/analysis`, {
      state: { formData },
    })
  }

  // 渲染输入框
  const inputField = (label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        type={type || 'text'}
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )

  const textareaField = (label: string, value: string, onChange: (v: string) => void, placeholder?: string, rows?: number) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <textarea
        className="input-field min-h-[80px] resize-y"
        placeholder={placeholder}
        value={value}
        rows={rows || 3}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )

  const dateField = (label: string, value: string, onChange: (v: string) => void, allowPresent?: boolean) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <MonthPicker value={value} onChange={onChange} placeholder="选择年月" allowPresent={allowPresent} />
    </div>
  )

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>, title: string, subtitle: string }) => (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-surface-border/30">
      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {pageLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : (
        <>
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/resume')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">返回列表</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">{isNew ? '创建新简历' : '简历详情'}</h2>
          <p className="text-slate-400 text-sm mt-1">
            {isNew ? '上传简历自动解析，或手动填写信息' : `ID: ${id}`}
            <span className="ml-3 inline-flex items-center gap-1">
              {saveIndicator === 'saving' && (
                <><Loader2 className="w-3 h-3 animate-spin text-primary-400" /><span className="text-primary-400">保存中...</span></>
              )}
              {saveIndicator === 'saved' && (
                <><CheckCircle className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">已自动保存</span></>
              )}
              {saveIndicator === 'error' && (
                <><AlertCircle className="w-3 h-3 text-red-400" /><span className="text-red-400">保存失败，已存本地</span></>
              )}
            </span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setUploadMode('manual')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              uploadMode === 'manual' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            手动填写
          </button>
          <button
            onClick={() => setUploadMode('upload')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              uploadMode === 'upload' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            上传解析
          </button>
        </div>
      </div>

      {/* 上传区域 */}
      {uploadMode === 'upload' && !parsed && (
        <div className="card">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-surface-border/60 hover:border-primary-500/50 rounded-xl p-10 text-center cursor-pointer transition-all duration-200 hover:bg-surface-hover/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
                <div>
                  <p className="text-white font-medium text-lg">正在上传简历...</p>
                  <p className="text-slate-400 text-sm mt-1">{uploadedFile}</p>
                </div>
              </div>
            ) : parsing ? (
              <div className="flex flex-col items-center gap-4">
                <ScanLine className="w-12 h-12 text-primary-400 animate-pulse" />
                <div>
                  <p className="text-white font-medium text-lg">AI 正在解析简历...</p>
                  <p className="text-slate-400 text-sm mt-1">正在识别你的教育背景、实习经历、项目经验和技能信息</p>
                </div>
                <div className="w-48 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-lg">点击上传简历文件</p>
                  <p className="text-slate-400 text-sm mt-1">支持 PDF、Word、TXT 格式，AI 将自动解析并填充下方表单</p>
                </div>
                <span className="btn-primary inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  选择文件
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 网申表单 */}
      {(uploadMode === 'manual' || parsed) && (
        <div className="space-y-5">
          {/* 基本信息 */}
          <div className="card">
            <SectionHeader icon={User} title="基本信息" subtitle="求职者个人信息与求职意向" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputField('姓名', formData.name, (v) => updateField('name', v), '请输入你的姓名')}
              {inputField('邮箱', formData.email, (v) => updateField('email', v), '请输入邮箱地址', 'email')}
              {inputField('手机号', formData.phone, (v) => updateField('phone', v), '请输入手机号', 'tel')}
              {inputField('目标岗位', formData.targetPosition, (v) => updateField('targetPosition', v), '如：Java后端开发')}
              {inputField('目标行业', formData.targetIndustry, (v) => updateField('targetIndustry', v), '如：互联网、金融、教育')}
            </div>
          </div>

          {/* 教育经历 */}
          <div className="card">
            <SectionHeader icon={GraduationCap} title="教育经历" subtitle="从最高学历开始填写" />
            <div className="space-y-4">
              {formData.education.map((edu, idx) => (
                <div key={edu.id} className="p-4 rounded-lg bg-surface-dark/40 border border-surface-border/20 relative">
                  {formData.education.length > 1 && (
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inputField('学校名称', edu.school, (v) => updateEducation(edu.id, 'school', v), '请输入学校全称')}
                    {inputField('学历', edu.degree, (v) => updateEducation(edu.id, 'degree', v), '本科/硕士/博士')}
                    {inputField('专业', edu.major, (v) => updateEducation(edu.id, 'major', v), '请输入专业名称')}
                    {dateField('开始时间', edu.startDate, (v) => updateEducation(edu.id, 'startDate', v))}
                    {dateField('结束时间', edu.endDate, (v) => updateEducation(edu.id, 'endDate', v), true)}
                  </div>
                </div>
              ))}
              <button onClick={addEducation} className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                <Plus className="w-4 h-4" /> 添加教育经历
              </button>
            </div>
          </div>

          {/* 实习/工作经历 */}
          <div className="card">
            <SectionHeader icon={Briefcase} title="实习/工作经历" subtitle="填写与目标岗位相关的实习或工作经历" />
            <div className="space-y-4">
              {formData.workExperience.map((work) => (
                <div key={work.id} className="p-4 rounded-lg bg-surface-dark/40 border border-surface-border/20 relative">
                  {formData.workExperience.length > 1 && (
                    <button
                      onClick={() => removeWork(work.id)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {inputField('公司名称', work.company, (v) => updateWork(work.id, 'company', v), '请输入公司全称')}
                    {inputField('职位', work.position, (v) => updateWork(work.id, 'position', v), '如：Java后端实习生')}
                    {dateField('开始时间', work.startDate, (v) => updateWork(work.id, 'startDate', v))}
                    {dateField('结束时间', work.endDate, (v) => updateWork(work.id, 'endDate', v), true)}
                  </div>
                  {textareaField('工作描述', work.description, (v) => updateWork(work.id, 'description', v), '请描述你的工作职责、成果和收获，建议使用量化数据（如"提升XX%性能"）')}
                </div>
              ))}
              <button onClick={addWork} className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                <Plus className="w-4 h-4" /> 添加实习/工作经历
              </button>
            </div>
          </div>

          {/* 项目经验 */}
          <div className="card">
            <SectionHeader icon={FolderGit2} title="项目经验" subtitle="展示你的课程项目、比赛项目或开源贡献" />
            <div className="space-y-4">
              {formData.projectExperience.map((proj) => (
                <div key={proj.id} className="p-4 rounded-lg bg-surface-dark/40 border border-surface-border/20 relative">
                  {formData.projectExperience.length > 1 && (
                    <button
                      onClick={() => removeProject(proj.id)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {inputField('项目名称', proj.projectName, (v) => updateProject(proj.id, 'projectName', v), '请给项目起一个简洁的名称')}
                    {inputField('担任角色', proj.role, (v) => updateProject(proj.id, 'role', v), '如：后端负责人、核心开发')}
                    {inputField('技术栈', proj.techStack, (v) => updateProject(proj.id, 'techStack', v), '如：Spring Boot, Vue, MySQL')}
                  </div>
                  {textareaField('项目描述', proj.description, (v) => updateProject(proj.id, 'description', v), '请描述项目背景、你的贡献和项目成果，建议突出技术难点和量化成果')}
                </div>
              ))}
              <button onClick={addProject} className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                <Plus className="w-4 h-4" /> 添加项目经验
              </button>
            </div>
          </div>

          {/* 技能证书 */}
          <div className="card">
            <SectionHeader icon={Wrench} title="技能与证书" subtitle="展示你的专业技能和获得的证书荣誉" />
            <div className="space-y-4">
              {textareaField(
                '专业技能',
                formData.skills,
                (v) => updateField('skills', v),
                '请用逗号或换行分隔，例如：Java, Spring Boot, MySQL, Redis, Linux',
                3,
              )}
              {textareaField(
                '证书与荣誉',
                formData.certifications,
                (v) => updateField('certifications', v),
                '请用逗号或换行分隔，例如：CET-6, 软考高级, ACM银奖, 奖学金',
                3,
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => {
                if (formData.targetPosition) {
                  setTargetPosition(formData.targetPosition, formData.targetIndustry)
                }
                saveResumeDraft(formData as unknown as Record<string, unknown>)
                navigate('/resume')
              }} className="btn-secondary">
              保存草稿
            </button>
            <button
              onClick={handleAnalyze}
              className="btn-accent flex items-center gap-2 text-base px-6 py-3"
            >
              <Sparkles className="w-5 h-5" />
              AI 智能分析
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}