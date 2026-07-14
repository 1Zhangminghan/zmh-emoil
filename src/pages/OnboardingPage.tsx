import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useProfileStore } from '@/store/useProfileStore'
import {
  Sparkles, FileText, Target, MessageCircle, Rocket,
  ChevronLeft, ChevronRight, Check, X,
} from 'lucide-react'

interface Step {
  icon: React.ElementType
  title: string
  subtitle: string
  description: string
  features: string[]
  color: string
  bgColor: string
}

const steps: Step[] = [
  {
    icon: Sparkles,
    title: '欢迎来到 AI 求职辅导',
    subtitle: '你的智能求职助手',
    description: '一站式求职准备平台，从简历优化到面试模拟，AI 全程陪伴你的校招之路。',
    features: [
      'AI 智能分析，精准定位求职短板',
      '覆盖简历、诊断、面试、题库全流程',
      '个性化学习计划，高效备战校招',
    ],
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/10',
  },
  {
    icon: FileText,
    title: '智能简历优化',
    subtitle: '让简历脱颖而出',
    description: '上传简历或在线编辑，AI 从内容完整性、关键词匹配、排版规范等多维度评分，并提供针对性的优化建议。',
    features: [
      '支持 PDF / DOCX / TXT 一键解析',
      '多维度评分 + 逐条修改建议',
      '一键导出优化版简历',
    ],
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: Target,
    title: '能力水平诊断',
    subtitle: '精准定位短板',
    description: '选择目标岗位进行能力诊断，AI 生成雷达图分析报告，明确你的优势和薄弱维度，制定个性化学习计划。',
    features: [
      '覆盖技术、产品、运营等多岗位',
      '多维度能力雷达图',
      'AI 生成三阶段学习路径',
    ],
    color: 'text-accent-400',
    bgColor: 'bg-accent-500/10',
  },
  {
    icon: MessageCircle,
    title: 'AI 模拟面试',
    subtitle: '实战演练提升',
    description: '与 AI 面试官进行一对一模拟面试，支持技术面、HR面、综合面等多种类型，面试后获取详细评分报告。',
    features: [
      '多种面试类型可选',
      '实时 AI 问答 + 评分反馈',
      '维度评分 + 提升建议报告',
    ],
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
]

const popularCompanies = [
  '腾讯', '阿里巴巴', '字节跳动', '百度', '美团', '京东', '网易',
  '华为', '小米', '拼多多', '快手', '小红书', 'B站', '滴滴',
  '蚂蚁集团', '携程', '商汤科技', '大疆', '蔚来', '理想汽车',
]

const popularCities = [
  '北京', '上海', '深圳', '杭州', '广州', '成都', '南京', '武汉', '西安', '苏州',
]

const graduationYears = ['2026', '2027', '2028', '2029', '2030']

const skillLevels = [
  { value: 'beginner', label: '入门', desc: '刚开始学习，基础薄弱' },
  { value: 'intermediate', label: '进阶', desc: '有一定基础，做过项目' },
  { value: 'advanced', label: '熟练', desc: '有实习经验，技术扎实' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { completeOnboarding } = useAuthStore()
  const { setTargetCompanies, setPreferredCities, setSkillLevel, setGraduationYear } = useProfileStore()
  const [currentStep, setCurrentStep] = useState(0)

  // 数据收集表单状态
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [graduationYear, setGradYear] = useState('')
  const [skillLevel, setSkill] = useState('')

  const isInfoStep = currentStep < steps.length
  const isFormStep = currentStep === steps.length
  const isLastStep = currentStep === steps.length + 1

  const handleNext = () => {
    if (isLastStep) {
      // 保存所有收集的数据
      if (selectedCompanies.length > 0) setTargetCompanies(selectedCompanies)
      if (selectedCities.length > 0) setPreferredCities(selectedCities)
      if (skillLevel) setSkillLevel(skillLevel)
      if (graduationYear) setGraduationYear(graduationYear)
      completeOnboarding()
      navigate('/dashboard', { replace: true })
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length + 1))
  }

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSkip = () => {
    completeOnboarding()
    navigate('/dashboard', { replace: true })
  }

  const toggleCompany = (company: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]
    )
  }

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    )
  }

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* 跳过按钮 */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            跳过引导，直接开始
          </button>
        </div>

        {/* 进度指示器 */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[...steps, { icon: Target, title: '', subtitle: '', description: '', features: [], color: '', bgColor: '' }, { icon: Rocket, title: '', subtitle: '', description: '', features: [], color: '', bgColor: '' }].map((_, idx) => (
            <button
              key={idx}
              onClick={() => idx < steps.length && setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-8 bg-primary-500'
                  : idx < currentStep
                    ? 'w-4 bg-primary-500/50'
                    : 'w-4 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* 功能介绍步骤 */}
        {isInfoStep && (() => {
          const step = steps[currentStep]
          const Icon = step.icon
          return (
            <div className="card text-center space-y-6 animate-in">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${step.bgColor} mx-auto`}>
                <Icon className={`w-10 h-10 ${step.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                <p className="text-slate-400 text-sm mt-1">{step.subtitle}</p>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
              <div className="space-y-2.5 text-left">
                {step.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover/50">
                    <Check className={`w-4 h-4 ${step.color} shrink-0 mt-0.5`} />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* 数据收集步骤 */}
        {isFormStep && (
          <div className="card space-y-6 animate-in">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent-500/10 mx-auto mb-4">
                <Target className="w-10 h-10 text-accent-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">定制你的求职画像</h2>
              <p className="text-slate-400 text-sm mt-1">告诉我们你的目标，AI 将为你提供更精准的辅导</p>
            </div>

            {/* 目标公司 */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">目标公司（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {popularCompanies.map((company) => (
                  <button
                    key={company}
                    onClick={() => toggleCompany(company)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      selectedCompanies.includes(company)
                        ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                        : 'bg-surface-hover border-surface-border/30 text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {company}
                    {selectedCompanies.includes(company) && (
                      <Check className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
              {selectedCompanies.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">已选择 {selectedCompanies.length} 家公司</p>
              )}
            </div>

            {/* 目标城市 */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">期望城市（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {popularCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      selectedCities.includes(city)
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-surface-hover border-surface-border/30 text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {city}
                    {selectedCities.includes(city) && (
                      <Check className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 毕业年份 */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">毕业年份</label>
              <div className="flex flex-wrap gap-2">
                {graduationYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setGradYear(year)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                      graduationYear === year
                        ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                        : 'bg-surface-hover border-surface-border/30 text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {year}届
                  </button>
                ))}
              </div>
            </div>

            {/* 技能水平自评 */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">当前技能水平</label>
              <div className="grid grid-cols-3 gap-2">
                {skillLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setSkill(level.value)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      skillLevel === level.value
                        ? 'bg-accent-600/20 border-accent-500/40'
                        : 'bg-surface-hover border-surface-border/30 hover:border-slate-500'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${skillLevel === level.value ? 'text-accent-300' : 'text-white'}`}>
                      {level.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{level.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 准备就绪 */}
        {isLastStep && (
          <div className="card text-center space-y-6 animate-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-500/10 mx-auto">
              <Rocket className="w-10 h-10 text-rose-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">准备就绪，开始冲刺</h2>
              <p className="text-slate-400 text-sm mt-1">祝你斩获心仪 Offer</p>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
              {selectedCompanies.length > 0
                ? `你将重点关注 ${selectedCompanies.slice(0, 3).join('、')}${selectedCompanies.length > 3 ? '等' + selectedCompanies.length + '家公司' : ''}`
                : '完成设置后，AI 将为你的求职之路提供全程陪伴'}
            </p>
            <div className="space-y-2.5 text-left">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">AI 将根据你的目标公司提供针对性面试题</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">简历优化建议将匹配你的目标岗位要求</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">校招日历将展示与你相关的关键时间节点</span>
              </div>
            </div>
          </div>
        )}

        {/* 底部导航 */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>

          <span className="text-xs text-slate-600">
            {currentStep + 1} / {steps.length + 2}
          </span>

          <button
            onClick={handleNext}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              isLastStep
                ? 'bg-primary-600 text-white hover:bg-primary-500'
                : 'btn-primary'
            }`}
          >
            {isLastStep ? (
              <>
                开始使用
                <Rocket className="w-4 h-4" />
              </>
            ) : (
              <>
                下一步
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}