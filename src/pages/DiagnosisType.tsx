import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/store/useProfileStore'
import { Target, Calendar, ChevronRight, Sparkles, GraduationCap, Zap, Star, Info, Eye } from 'lucide-react'

const recruitmentLabels: Record<string, string> = {
  fall: '秋招',
  spring: '春招',
  intern: '日常实习',
}

const graduationYears = ['2026', '2027', '2028', '2029', '2030']

const allRecruitmentTypes = [
  {
    id: 'fall',
    label: '秋招',
    subtitle: '秋季校园招聘',
    desc: '每年8-11月，企业规模最大、岗位最全的校招季，是应届生求职的黄金窗口',
    icon: Target,
    gradient: 'from-blue-600 to-blue-400',
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    borderColor: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-400/50',
    tagBg: 'bg-blue-500/20',
    tagText: 'text-blue-300',
    features: ['大厂集中招聘，岗位数量最多', '正式校招流程，含笔试+多轮面试', '面向次年毕业的应届生'],
    timeline: '大三/研二下学期开始准备，暑期实习+秋招提前批→正式批→补录',
    availableFor: ['2027'],
  },
  {
    id: 'intern',
    label: '日常实习',
    subtitle: '全年实习机会',
    desc: '全年可投，时间灵活，适合各年级同学积累经验，优秀者可转正',
    icon: Calendar,
    gradient: 'from-purple-600 to-purple-400',
    bgGradient: 'from-purple-500/10 to-purple-600/5',
    borderColor: 'border-purple-500/30',
    hoverBorder: 'hover:border-purple-400/50',
    tagBg: 'bg-purple-500/20',
    tagText: 'text-purple-300',
    features: ['全年滚动招聘，时间灵活', '面试流程相对简单', '表现优异可获转正机会'],
    timeline: '任意年级均可投递，建议大二/大三开始积累实习经验',
    availableFor: ['2026', '2027', '2028', '2029', '2030'],
  },
]

export default function DiagnosisType() {
  const navigate = useNavigate()
  const { graduationYear: profileYear, loadDiagnosisReport } = useProfileStore()
  const [graduationYear, setGraduationYear] = useState(profileYear || '2027')

  const storedReport = loadDiagnosisReport()

  const is27 = graduationYear === '2027'
  const availableTypes = allRecruitmentTypes.filter((t) => t.availableFor.includes(graduationYear))

  const handleSelectType = (typeId: string) => {
    navigate(`/diagnosis/${typeId}`, {
      state: { graduationYear },
    })
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-sm mb-6">
          <GraduationCap className="w-4 h-4" />
          AI 个性化学习诊断
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          选择你的
          <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent"> 校招类型</span>
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto">
          不同类型的校招有不同的时间线和准备策略，AI 将根据你的选择生成专属诊断测试和学习计划
        </p>
      </div>

      {/* 上次诊断报告入口 */}
      {storedReport && (
        <div className="card border-primary-500/30 bg-primary-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {storedReport.positionName} · {recruitmentLabels[storedReport.recruitmentType] || '诊断'}
                </h3>
                <p className="text-slate-400 text-sm">
                  综合评分 <span className="text-primary-400 font-bold">{storedReport.totalScore}分</span> · 上次诊断报告
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/diagnosis/${storedReport.recruitmentType}/${storedReport.positionId}/report`)}
              className="btn-primary flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              查看报告
            </button>
          </div>
        </div>
      )}

      {/* 毕业年份选择 */}
      <div className="card max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">你的毕业年份</h3>
            <p className="text-xs text-slate-400">选择毕业年份后，系统将为你匹配合适的校招类型</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {graduationYears.map((year) => (
            <button
              key={year}
              onClick={() => setGraduationYear(year)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                graduationYear === year
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-surface-hover text-slate-300 hover:text-white border border-surface-border/30'
              }`}
            >
              {year}届
            </button>
          ))}
        </div>
      </div>

      {/* 可用类型说明 */}
      {!is27 && (
        <div className="flex items-center justify-center gap-2 text-amber-400/80 text-sm">
          <Info className="w-4 h-4" />
          <span>非27届学生现阶段仅开放日常实习，秋招需等到毕业前一年</span>
        </div>
      )}

      {is27 && (
        <div className="flex items-center justify-center gap-2 text-emerald-400/80 text-sm">
          <Info className="w-4 h-4" />
          <span>27届学生可选择秋招或日常实习，建议优先准备秋招</span>
        </div>
      )}

      {/* 校招类型卡片 */}
      <div className={`grid gap-5 ${availableTypes.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto'}`}>
        {availableTypes.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.id}
              onClick={() => handleSelectType(type.id)}
              className={`group relative card text-left transition-all duration-300 cursor-pointer
                ${type.borderColor} ${type.hoverBorder}
                hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1
                overflow-hidden`}
            >
              {/* 背景渐变 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${type.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10">
                {/* 图标 */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.gradient} bg-opacity-20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* 标题 */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white">{type.label}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${type.tagBg} ${type.tagText}`}>
                    {type.subtitle}
                  </span>
                </div>

                {/* 描述 */}
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  {type.desc}
                </p>

                {/* 特性列表 */}
                <div className="space-y-2 mb-5">
                  {type.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Star className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${type.tagText}`} />
                      <span className="text-xs text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* 时间线 */}
                <div className="p-3 rounded-lg bg-surface-dark/50 border border-surface-border/20 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400 font-medium">时间规划</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{type.timeline}</p>
                </div>

                {/* 底部按钮 */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-border/20">
                  <span className="text-sm text-slate-400">开始准备</span>
                  <div className={`flex items-center gap-1 text-sm font-medium ${type.tagText} group-hover:gap-2 transition-all`}>
                    选择此类型
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 底部提示 */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-slate-500 text-sm">
          <Sparkles className="w-4 h-4" />
          <span>选择校招类型后，AI 将结合你的毕业年份和目标岗位生成专属诊断测试</span>
        </div>
      </div>
    </div>
  )
}