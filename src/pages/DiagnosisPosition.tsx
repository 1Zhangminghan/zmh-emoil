import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { positionApi, type PositionItem, type PositionIndustry } from '@/api'
import {
  Code2, Layout, Lightbulb, BarChart3, Palette,
  ChevronRight, Target, ChevronLeft,
  GraduationCap, Sparkles, Star, Loader2, Search,
} from 'lucide-react'

const recruitmentTypeConfig: Record<string, {
  label: string
  subtitle: string
  desc: string
  gradient: string
  tagBg: string
  tagText: string
  borderColor: string
  tips: string[]
}> = {
  fall: {
    label: '秋招',
    subtitle: '秋季校园招聘',
    desc: '每年8-11月，大规模集中招聘，岗位最多',
    gradient: 'from-blue-600 to-blue-400',
    tagBg: 'bg-blue-500/20',
    tagText: 'text-blue-300',
    borderColor: 'border-blue-500/30',
    tips: [
      '秋招岗位数量最多，建议优先准备核心岗位',
      '提前批一般在7-8月开始，建议尽早关注',
      '笔试环节占比高，需要系统刷题',
    ],
  },
  intern: {
    label: '日常实习',
    subtitle: '全年实习机会',
    desc: '全年可投，时间灵活，可转正',
    gradient: 'from-purple-600 to-purple-400',
    tagBg: 'bg-purple-500/20',
    tagText: 'text-purple-300',
    borderColor: 'border-purple-500/30',
    tips: [
      '日常实习面试更注重基础能力和学习潜力',
      '建议大二/大三开始投递，积累多段实习经历',
      '表现优异可获转正，是进入大厂的重要途径',
    ],
  },
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2, Layout, Lightbulb, BarChart3, Palette,
}

export default function DiagnosisPosition() {
  const navigate = useNavigate()
  const location = useLocation()
  const { type = 'fall' } = useParams<{ type: string }>()
  const config = recruitmentTypeConfig[type] || recruitmentTypeConfig.fall

  const state = location.state as { graduationYear?: string } | null
  const graduationYear = state?.graduationYear || '2027'

  // 从 API 加载职位数据
  const [industries, setIndustries] = useState<PositionIndustry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    positionApi.getHierarchy()
      .then((data) => {
        if (!cancelled) setIndustries(data.industries)
      })
      .catch(() => {
        // 降级：使用 positionApi.getFlat() 构造层级结构
        if (!cancelled) {
          positionApi.getFlat().then((positions) => {
            if (!cancelled) {
              const map = new Map<string, Map<string, PositionItem[]>>()
              for (const p of positions) {
                if (!map.has(p.industry)) map.set(p.industry, new Map())
                const catMap = map.get(p.industry)!
                if (!catMap.has(p.category)) catMap.set(p.category, [])
                catMap.get(p.category)!.push(p)
              }
              setIndustries(
              Array.from(map.entries()).map(([name, catMap]) => ({
                name,
                categories: Array.from(catMap.entries()).map(([catName, pos]) => ({
                  name: catName,
                  positions: pos,
                })),
              }))
            )
            }
          }).catch(() => {
            // 降级方案也失败，保持空数组
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // 选择状态
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  // 当前选中的行业数据
  const currentIndustry = industries.find((i) => i.name === selectedIndustry)
  const currentCategory = currentIndustry?.categories.find((c) => c.name === selectedCategory)

  // 所有职位（扁平，用于搜索）
  const allPositions = industries.flatMap((i) =>
    i.categories.flatMap((c) => c.positions)
  )
  const selectedPositionData = allPositions.find((p) => p.id === selectedPosition)

  // 搜索过滤
  const filteredPositions = searchText.trim()
    ? allPositions.filter((p) =>
        p.name.includes(searchText.trim()) ||
        p.industry.includes(searchText.trim()) ||
        p.category.includes(searchText.trim()) ||
        p.skills.some((s) => s.includes(searchText.trim()))
      )
    : []

  const handleSelectIndustry = (industry: string) => {
    if (selectedIndustry === industry) {
      setSelectedIndustry(null)
      setSelectedCategory(null)
      setSelectedPosition(null)
    } else {
      setSelectedIndustry(industry)
      setSelectedCategory(null)
      setSelectedPosition(null)
    }
  }

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category)
    setSelectedPosition(null)
  }

  const handleSelectPosition = (positionId: string) => {
    setSelectedPosition(selectedPosition === positionId ? null : positionId)
  }

  const handleStartDiagnosis = () => {
    if (!selectedPosition) return
    navigate(`/diagnosis/${type}/${selectedPosition}`, {
      state: { recruitmentType: type, graduationYear },
    })
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/diagnosis')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">返回选择</span>
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.tagBg} ${config.tagText}`}>
              {config.label}
            </span>
            <h2 className="text-2xl font-bold text-white">选择目标岗位</h2>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {config.desc} · {graduationYear}届 · AI 将针对{config.label}特点生成专属诊断测试
          </p>
        </div>
      </div>

      {/* 校招类型提示卡片 */}
      <div className={`card ${config.borderColor} bg-gradient-to-r from-surface-card to-surface-dark/50`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} bg-opacity-20 flex items-center justify-center shrink-0`}>
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">{config.subtitle} · 准备要点</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {config.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Star className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-400" />
                  <span className="text-xs text-slate-300">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="搜索岗位名称、行业、技能...（如：产品运营、Java、金融）"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                if (e.target.value.trim()) {
                  setSelectedIndustry(null)
                  setSelectedCategory(null)
                  setSelectedPosition(null)
                }
              }}
            />
          </div>

          {/* 搜索结果 */}
          {searchText.trim() && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3">
                搜索结果（{filteredPositions.length} 个岗位）
              </h3>
              {filteredPositions.length === 0 ? (
                <p className="text-slate-500 text-sm">未找到匹配的岗位</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPositions.map((pos) => {
                    const Icon = iconMap[pos.icon] || Target
                    const isSelected = selectedPosition === pos.id
                    return (
                      <button
                        key={pos.id}
                        onClick={() => handleSelectPosition(pos.id)}
                        className={`card text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30'
                            : 'hover:border-primary-500/30 hover:bg-surface-hover/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary-500/20' : 'bg-primary-500/10'
                          }`}>
                            <Icon className="w-5 h-5 text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-semibold ${isSelected ? 'text-primary-300' : 'text-white'}`}>
                              {pos.name}
                            </h3>
                            <span className="text-xs text-slate-500">{pos.industry} · {pos.category}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 层级选择器（非搜索模式） */}
          {!searchText.trim() && (
            <>
              {/* 步骤1：选择行业 */}
              <div>
                <h3 className="text-base font-semibold text-white mb-3">选择行业</h3>
                <div className="flex gap-2 flex-wrap">
                  {industries.map((ind) => (
                    <button
                      key={ind.name}
                      onClick={() => handleSelectIndustry(ind.name)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedIndustry === ind.name
                          ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25'
                          : 'bg-surface-hover text-slate-300 hover:text-white border border-surface-border/30'
                      }`}
                    >
                      {ind.name}
                      <span className="ml-1.5 text-xs opacity-60">
                        ({ind.categories.reduce((s, c) => s + c.positions.length, 0)})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 步骤2：选择大类 */}
              {selectedIndustry && currentIndustry && (
                <div>
                  <h3 className="text-base font-semibold text-white mb-3">
                    选择分类 · <span className="text-primary-400">{selectedIndustry}</span>
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {currentIndustry.categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleSelectCategory(cat.name)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedCategory === cat.name
                            ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
                            : 'bg-surface-hover text-slate-300 hover:text-white border border-surface-border/30'
                        }`}
                      >
                        {cat.name}
                        <span className="ml-1.5 text-xs opacity-60">({cat.positions.length})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 步骤3：选择具体岗位 */}
              {selectedCategory && currentCategory && (
                <div>
                  <h3 className="text-base font-semibold text-white mb-3">
                    选择岗位 · <span className="text-primary-400">{selectedIndustry}</span> · <span className="text-accent-400">{selectedCategory}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCategory.positions.map((pos) => {
                      const Icon = iconMap[pos.icon] || Target
                      const isSelected = selectedPosition === pos.id
                      return (
                        <button
                          key={pos.id}
                          onClick={() => handleSelectPosition(pos.id)}
                          className={`card text-left transition-all duration-200 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30'
                              : 'hover:border-primary-500/30 hover:bg-surface-hover/20'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-primary-500/20' : 'bg-primary-500/10'
                            }`}>
                              <Icon className="w-6 h-6 text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-lg font-semibold ${
                                isSelected ? 'text-primary-300' : 'text-white'
                              }`}>
                                {pos.name}
                              </h3>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0 mt-2">
                                <ChevronRight className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {pos.skills.slice(0, 5).map((skill) => (
                              <span key={skill} className="px-2 py-0.5 text-xs rounded-md bg-surface-hover text-slate-300 border border-surface-border/30">
                                {skill}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                            {pos.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 开始诊断按钮 */}
      {selectedPosition && selectedPositionData && (
        <div className="card border-primary-500/30 bg-primary-500/5 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">
              已选择：{selectedPositionData.name}
            </p>
            <p className="text-slate-400 text-sm">
              {graduationYear}届 · {selectedPositionData.industry} · {selectedPositionData.category} · {config.label} · AI 将为你生成专属诊断测试
            </p>
          </div>
          <button onClick={handleStartDiagnosis} className="btn-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            开始诊断测试
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}