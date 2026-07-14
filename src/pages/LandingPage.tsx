import { Link } from 'react-router-dom'
import {
  GraduationCap, FileText, Brain, MessageSquare, BookOpen, BarChart3,
  ArrowRight, Target, Sparkles, ChevronRight, Zap, Users, Shield, Eye,
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'AI 优化简历',
    desc: '没有实习经历也能写出好简历！AI 帮你挖掘课程项目、社团经历中的亮点，用 STAR 法则包装，让 HR 一眼看中你。',
    color: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: Brain,
    title: '个性化学习',
    desc: '不确定企业需要什么技能？选好目标岗位，AI 诊断你的当前水平，生成专属学习计划，把有限时间花在刀刃上。',
    color: 'from-violet-500/20 to-purple-500/10',
    iconColor: 'text-violet-400',
    borderColor: 'border-violet-500/20',
  },
  {
    icon: MessageSquare,
    title: 'AI 模拟面试',
    desc: '第一次面试紧张？AI 模拟真实校招面试场景，从技术面到 HR 面全方位练习，提前熟悉流程，上场不慌。',
    color: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  {
    icon: BookOpen,
    title: '实习面经',
    desc: '学长学姐的实习面试真实分享，按公司、岗位筛选，看看大厂实习面都问些什么，提前避坑。',
    color: 'from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
  {
    icon: BarChart3,
    title: '个人成长看板',
    desc: '能力雷达图、面试趋势、学习进度一目了然，看着自己每天都在进步，校招季更有信心。',
    color: 'from-rose-500/20 to-pink-500/10',
    iconColor: 'text-rose-400',
    borderColor: 'border-rose-500/20',
  },
]

const steps = [
  { step: '01', title: '优化简历', desc: '上传你的简历，AI 挖掘校园经历亮点并给出优化建议' },
  { step: '02', title: '水平诊断', desc: '选择目标校招岗位，AI 出题测试你的当前水平' },
  { step: '03', title: '个性化学习', desc: '根据诊断短板，AI 生成专属三阶段学习计划' },
  { step: '04', title: '模拟面试', desc: 'AI 模拟真实校招面试，提前适应节奏和压力' },
  { step: '05', title: '持续进步', desc: '面试反馈驱动学习调整，能力稳步提升' },
]

const stats = [
  { value: '5', label: '核心模块', suffix: '' },
  { value: '10', label: '校招岗位', suffix: '+', icon: Target },
  { value: '50', label: 'AI面试题', suffix: '+', icon: Sparkles },
  { value: '100', label: 'AI驱动', suffix: '%', icon: Zap },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-dark text-white overflow-x-hidden">
      {/* ====== Hero ====== */}
      <section className="relative pt-16 pb-24 px-4">
        {/* 背景光晕 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[250px] h-[250px] bg-cyan-600/6 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            专为大学生打造的 AI 校招辅导平台
          </div>

          {/* 标题 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent">
              从校园到职场，
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-cyan-300 bg-clip-text text-transparent">
              AI 陪你拿下心仪 Offer
            </span>
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            春招秋招就在眼前，简历空空、面试紧张、不知道从何准备？AI求职辅导专为大学生设计，
            从简历优化到模拟面试，帮你把校园经历变成求职竞争力，校招季不再焦虑。
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="btn-primary flex items-center gap-2.5 px-8 py-3.5 text-lg font-semibold rounded-xl shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              开始备战校招
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/demo"
              className="flex items-center gap-2 px-8 py-3.5 text-lg rounded-xl border border-accent-500/30 text-accent-300 hover:bg-accent-500/10 transition-all duration-300"
            >
              先体验
              <Eye className="w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="btn-secondary flex items-center gap-2 px-8 py-3.5 text-lg rounded-xl border-slate-500/50"
            >
              免费注册
            </Link>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                  {stat.value}
                  <span className="text-primary-400">{stat.suffix}</span>
                </div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Feature Cards ====== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              一站式<span className="text-primary-400">校招备战方案</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              五大核心模块，从零开始带你搞定校招每一步
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`relative group card bg-gradient-to-br ${feature.color} ${feature.borderColor} hover:scale-[1.02] transition-all duration-300`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-surface-card flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2.5">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====== How It Works ====== */}
      <section className="py-20 px-4 bg-surface-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              校招备战<span className="text-primary-400">五步走</span>
            </h2>
            <p className="text-slate-400 text-lg">从零开始，跟着节奏走，校招不再迷茫</p>
          </div>

          <div className="relative">
            {/* 连接线 */}
            <div className="hidden md:block absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600/40 via-violet-500/40 to-rose-500/40" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {steps.map((step, idx) => (
                <div key={step.step} className="relative text-center group">
                  {/* 圆点 */}
                  <div className="relative z-10 w-20 h-20 mx-auto mb-5 rounded-full bg-surface-card border-2 border-primary-500/40 flex flex-col items-center justify-center group-hover:border-primary-500 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary-500/10">
                    <span className="text-xs text-slate-400">{step.step}</span>
                    <span className="text-lg font-bold text-white">{idx + 1}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              立即体验完整流程
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== Trust Bar ====== */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">专为校招设计</h3>
              <p className="text-slate-400 text-sm">聚焦春招秋招场景，零经验也能上手</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">AI 驱动个性化</h3>
              <p className="text-slate-400 text-sm">根据你的基础和岗位，定制专属方案</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">全程陪伴</h3>
              <p className="text-slate-400 text-sm">从简历到面试，AI 陪你走完校招全程</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Footer CTA ====== */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card bg-gradient-to-br from-primary-600/20 to-violet-600/20 border-primary-500/20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-6">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              准备好拿下你的第一份 Offer 了吗？
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto">
              校招不焦虑，让 AI 成为你的专属求职教练，陪你走好从校园到职场的第一步
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="btn-primary flex items-center gap-2.5 px-8 py-3.5 text-lg rounded-xl"
              >
                立即开始
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="btn-accent flex items-center gap-2 px-8 py-3.5 text-lg rounded-xl"
              >
                免费注册
                <Users className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-slate-500 text-xs mt-6">免费使用 · 专为大学生打造的校招备战平台</p>
          </div>
        </div>
      </section>

      {/* ====== Footer ====== */}
      <footer className="py-8 px-4 border-t border-surface-border/30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-400">AI求职辅导</span>
          </div>
          <p className="text-slate-500 text-xs">
            演示项目 · AI 驱动的智能求职辅导平台
          </p>
        </div>
      </footer>
    </div>
  )
}