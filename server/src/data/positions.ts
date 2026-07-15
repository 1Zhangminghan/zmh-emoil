// ============ 职位层级数据 ============
// 结构：行业 > 大类 > 具体岗位

export interface Position {
  id: string
  name: string
  industry: string
  category: string
  icon: string
  description: string
  skills: string[]
  dimensions: string[]
}

export interface PositionGroup {
  industry: string
  categories: Array<{
    name: string
    positions: Position[]
  }>
}

export const positionSeedData: PositionGroup[] = [
  {
    industry: '互联网',
    categories: [
      {
        name: '技术研发',
        positions: [
          {
            id: 'java-backend', name: 'Java后端开发', industry: '互联网', category: '技术研发', icon: 'Code2',
            description: '负责服务端架构设计、业务逻辑开发、数据库优化等后端开发工作',
            skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', '微服务'],
            dimensions: ['Java基础', '框架应用', '数据库', '系统设计', '算法', '项目经验'],
          },
          {
            id: 'go-backend', name: 'Go后端开发', industry: '互联网', category: '技术研发', icon: 'Code2',
            description: '使用Go语言进行高并发服务端开发，负责API设计、微服务架构等',
            skills: ['Go', 'gRPC', 'MySQL', 'Redis', 'Kubernetes'],
            dimensions: ['Go基础', '并发编程', '数据库', '系统设计', '微服务', '容器化'],
          },
          {
            id: 'python-backend', name: 'Python后端开发', industry: '互联网', category: '技术研发', icon: 'Code2',
            description: '使用Python进行Web后端开发，负责API服务、数据处理等',
            skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Celery'],
            dimensions: ['Python基础', 'Web框架', '数据库', '异步编程', '系统设计', '数据处理'],
          },
          {
            id: 'cpp-backend', name: 'C++后端开发', industry: '互联网', category: '技术研发', icon: 'Code2',
            description: '使用C++进行高性能服务端开发，负责底层系统、中间件等',
            skills: ['C++', 'STL', 'Linux', '网络编程', '多线程'],
            dimensions: ['C++基础', '内存管理', '网络编程', '并发编程', '系统设计', '性能优化'],
          },
          {
            id: 'frontend', name: 'Web前端开发', industry: '互联网', category: '技术研发', icon: 'Layout',
            description: '负责Web/移动端页面开发、组件封装、性能优化等前端开发工作',
            skills: ['React', 'Vue', 'TypeScript', 'Webpack', 'Node.js'],
            dimensions: ['HTML/CSS', 'JavaScript', '框架掌握', '工程化', '性能优化', '跨端开发'],
          },
          {
            id: 'android', name: 'Android开发', industry: '互联网', category: '技术研发', icon: 'Layout',
            description: '负责Android客户端应用的开发和维护',
            skills: ['Java', 'Kotlin', 'Android SDK', 'Jetpack', '性能优化'],
            dimensions: ['Java/Kotlin', 'Android框架', 'UI开发', '性能优化', '架构设计', 'NDK'],
          },
          {
            id: 'ios', name: 'iOS开发', industry: '互联网', category: '技术研发', icon: 'Layout',
            description: '负责iOS客户端应用的开发和维护',
            skills: ['Swift', 'Objective-C', 'UIKit', 'SwiftUI', 'Xcode'],
            dimensions: ['Swift', 'UIKit', '架构设计', '性能优化', 'Core Data', '网络编程'],
          },
          {
            id: 'fullstack', name: '全栈开发', industry: '互联网', category: '技术研发', icon: 'Layout',
            description: '负责前后端全栈开发，具备独立完成项目的能力',
            skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
            dimensions: ['前端框架', '后端开发', '数据库', 'DevOps', '系统设计', '全栈项目'],
          },
          {
            id: 'data-analyst', name: '数据分析师', industry: '互联网', category: '技术研发', icon: 'BarChart3',
            description: '负责数据采集、清洗、分析、可视化，为业务决策提供数据支持',
            skills: ['SQL', 'Python', 'Tableau', 'Excel', '机器学习'],
            dimensions: ['统计学', 'SQL', 'Python/R', '可视化', '业务理解', '机器学习'],
          },
          {
            id: 'algorithm-engineer', name: '算法工程师', industry: '互联网', category: '技术研发', icon: 'BarChart3',
            description: '负责推荐、搜索、广告等核心算法的研发和优化',
            skills: ['Python', 'TensorFlow', 'PyTorch', 'Spark', '推荐系统'],
            dimensions: ['机器学习', '深度学习', '推荐算法', 'NLP', '工程能力', '数学基础'],
          },
          {
            id: 'ai-engineer', name: 'AI/机器学习工程师', industry: '互联网', category: '技术研发', icon: 'BarChart3',
            description: '负责AI模型训练、部署、优化，以及AI应用开发',
            skills: ['Python', 'PyTorch', 'TensorFlow', 'MLOps', 'LangChain'],
            dimensions: ['深度学习', '模型部署', 'MLOps', '大模型应用', '数学基础', '工程能力'],
          },
          {
            id: 'bigdata-engineer', name: '大数据开发', industry: '互联网', category: '技术研发', icon: 'BarChart3',
            description: '负责大数据平台建设、数据管道开发、数据仓库设计',
            skills: ['Hadoop', 'Spark', 'Flink', 'Hive', 'Kafka'],
            dimensions: ['Hadoop生态', 'Spark/Flink', '数据仓库', '实时计算', 'SQL', 'Java/Scala'],
          },
          {
            id: 'qa-engineer', name: '测试开发', industry: '互联网', category: '技术研发', icon: 'Code2',
            description: '负责自动化测试框架搭建、测试工具开发、质量保障',
            skills: ['Python', 'Selenium', 'Jenkins', 'Docker', '性能测试'],
            dimensions: ['测试理论', '自动化测试', '性能测试', '编程能力', 'CI/CD', '工具开发'],
          },
          {
            id: 'sre-engineer', name: '运维开发(SRE)', industry: '互联网', category: '技术研发', icon: 'Code2',
            description: '负责服务稳定性保障、自动化运维、监控告警体系建设',
            skills: ['Linux', 'Kubernetes', 'Docker', 'Prometheus', 'Terraform'],
            dimensions: ['Linux', 'Kubernetes', '监控告警', '自动化运维', '网络', '脚本编程'],
          },
          {
            id: 'security-engineer', name: '安全工程师', industry: '互联网', category: '技术研发', icon: 'Code2',
            description: '负责应用安全、网络安全、数据安全等安全防护工作',
            skills: ['Python', '渗透测试', '安全审计', 'WAF', '密码学'],
            dimensions: ['Web安全', '网络安全', '密码学', '安全开发', '渗透测试', '合规'],
          },
        ],
      },
      {
        name: '产品',
        positions: [
          {
            id: 'product-manager', name: '产品经理', industry: '互联网', category: '产品', icon: 'Lightbulb',
            description: '负责产品规划、需求管理、原型设计、跨部门协作等产品工作',
            skills: ['PRD撰写', 'Axure', 'SQL', 'A/B测试', '敏捷开发'],
            dimensions: ['需求分析', '产品设计', '数据分析', '项目管理', '商业思维', '沟通协调'],
          },
          {
            id: 'growth-pm', name: '增长产品经理', industry: '互联网', category: '产品', icon: 'Lightbulb',
            description: '通过数据驱动和实验方法，负责用户增长和留存策略',
            skills: ['A/B测试', 'SQL', '用户增长', '数据驱动', '漏斗分析'],
            dimensions: ['增长方法论', '数据分析', '实验设计', '用户心理', '渠道运营', '产品设计'],
          },
          {
            id: 'data-pm', name: '数据产品经理', industry: '互联网', category: '产品', icon: 'Lightbulb',
            description: '负责数据平台、BI工具、数据产品等规划和设计',
            skills: ['SQL', '数据可视化', '数据仓库', '指标体系', '产品设计'],
            dimensions: ['数据思维', '产品设计', 'SQL', '可视化', '指标体系', '项目管理'],
          },
          {
            id: 'ai-pm', name: 'AI产品经理', industry: '互联网', category: '产品', icon: 'Lightbulb',
            description: '负责AI产品定义、场景挖掘、效果评估，连接技术与用户需求',
            skills: ['AI基础', '产品设计', 'Prompt工程', '数据分析', '用户研究'],
            dimensions: ['AI理解', '产品设计', '用户研究', '数据分析', '技术理解', '商业思维'],
          },
        ],
      },
      {
        name: '设计',
        positions: [
          {
            id: 'ui-designer', name: 'UI设计师', industry: '互联网', category: '设计', icon: 'Palette',
            description: '负责产品界面设计、交互设计、设计系统搭建等设计工作',
            skills: ['Figma', 'Sketch', 'AE', 'C4D', '设计系统'],
            dimensions: ['视觉设计', '交互设计', '设计规范', '工具掌握', '用户研究', '动效设计'],
          },
          {
            id: 'ux-designer', name: 'UX设计师', industry: '互联网', category: '设计', icon: 'Palette',
            description: '负责用户体验设计，通过用户研究、信息架构、交互设计提升产品体验',
            skills: ['用户研究', '信息架构', '交互设计', '可用性测试', 'Figma'],
            dimensions: ['用户研究', '信息架构', '交互设计', '可用性测试', '设计思维', '原型设计'],
          },
          {
            id: 'visual-designer', name: '视觉设计师', industry: '互联网', category: '设计', icon: 'Palette',
            description: '负责品牌视觉、运营视觉、营销物料等视觉设计工作',
            skills: ['Photoshop', 'Illustrator', 'AE', 'C4D', '品牌设计'],
            dimensions: ['视觉设计', '品牌设计', '排版', '动效', '插画', '3D设计'],
          },
        ],
      },
      {
        name: '运营',
        positions: [
          {
            id: 'product-ops', name: '产品运营', industry: '互联网', category: '运营', icon: 'Lightbulb',
            description: '负责产品上线后的运营策略、用户反馈收集、产品优化迭代',
            skills: ['数据分析', '用户运营', '活动策划', '产品思维', 'SQL'],
            dimensions: ['数据分析', '用户运营', '活动策划', '产品理解', '沟通协作', '内容运营'],
          },
          {
            id: 'content-ops', name: '内容运营', industry: '互联网', category: '运营', icon: 'Lightbulb',
            description: '负责内容策划、内容生产、内容分发和内容效果评估',
            skills: ['内容策划', '文案撰写', '数据分析', '社区运营', '短视频'],
            dimensions: ['内容策划', '文案能力', '数据分析', '用户洞察', '热点追踪', '社区运营'],
          },
          {
            id: 'user-ops', name: '用户运营', industry: '互联网', category: '运营', icon: 'Lightbulb',
            description: '负责用户拉新、促活、留存、转化，搭建用户成长体系',
            skills: ['用户分层', '数据分析', '活动策划', 'CRM', '用户调研'],
            dimensions: ['用户分层', '数据分析', '活动策划', '用户心理', '会员体系', '沟通能力'],
          },
          {
            id: 'event-ops', name: '活动运营', industry: '互联网', category: '运营', icon: 'Lightbulb',
            description: '负责线上/线下活动策划、执行、复盘，提升用户参与度和品牌影响力',
            skills: ['活动策划', '项目管理', '数据分析', '文案撰写', '资源协调'],
            dimensions: ['活动策划', '项目管理', '数据分析', '创意能力', '执行能力', '复盘总结'],
          },
          {
            id: 'new-media-ops', name: '新媒体运营', industry: '互联网', category: '运营', icon: 'Lightbulb',
            description: '负责微信公众号、抖音、小红书等新媒体平台的内容运营和粉丝增长',
            skills: ['文案撰写', '短视频制作', '数据分析', '选题策划', '社交平台'],
            dimensions: ['内容创作', '平台运营', '数据分析', '热点追踪', '用户增长', '品牌传播'],
          },
          {
            id: 'community-ops', name: '社区运营', industry: '互联网', category: '运营', icon: 'Lightbulb',
            description: '负责社区氛围建设、用户互动引导、KOL/KOC运营',
            skills: ['社区管理', '用户运营', '内容策划', '数据分析', '活动策划'],
            dimensions: ['社区管理', '用户运营', '内容策划', '数据分析', '沟通能力', '危机处理'],
          },
          {
            id: 'ecommerce-ops', name: '电商运营', industry: '互联网', category: '运营', icon: 'Lightbulb',
            description: '负责电商店铺运营、商品管理、促销策划、供应链协调',
            skills: ['数据分析', '商品运营', '活动策划', '供应链', '平台规则'],
            dimensions: ['数据分析', '商品运营', '活动策划', '供应链', '用户运营', '平台规则'],
          },
        ],
      },
      {
        name: '市场/商务',
        positions: [
          {
            id: 'marketing', name: '市场营销', industry: '互联网', category: '市场/商务', icon: 'Lightbulb',
            description: '负责市场调研、品牌推广、营销活动策划和执行',
            skills: ['市场调研', '品牌策划', '数据分析', '广告投放', '活动策划'],
            dimensions: ['市场分析', '品牌策略', '广告投放', '数据分析', '创意策划', '项目管理'],
          },
          {
            id: 'bd', name: '商务拓展(BD)', industry: '互联网', category: '市场/商务', icon: 'Lightbulb',
            description: '负责合作伙伴拓展、商务谈判、渠道建设',
            skills: ['商务谈判', '资源整合', '合同管理', '行业分析', '关系维护'],
            dimensions: ['商务谈判', '资源整合', '行业分析', '项目管理', '沟通能力', '法律基础'],
          },
          {
            id: 'brand-pr', name: '品牌公关', industry: '互联网', category: '市场/商务', icon: 'Lightbulb',
            description: '负责品牌传播、媒体关系、危机公关等企业形象管理',
            skills: ['品牌传播', '媒体关系', '危机公关', '文案撰写', '舆情监测'],
            dimensions: ['品牌传播', '媒体关系', '危机公关', '文案撰写', '舆情监测', '活动策划'],
          },
        ],
      },
      {
        name: '游戏',
        positions: [
          {
            id: 'game-planner', name: '游戏策划', industry: '互联网', category: '游戏', icon: 'Lightbulb',
            description: '负责游戏玩法设计、数值策划、关卡设计、系统策划',
            skills: ['游戏设计', '数值策划', '关卡设计', '用户体验', '竞品分析'],
            dimensions: ['游戏设计', '数值策划', '系统策划', '用户体验', '文档撰写', '数据分析'],
          },
          {
            id: 'game-developer', name: '游戏开发', industry: '互联网', category: '游戏', icon: 'Code2',
            description: '负责游戏客户端/服务端开发，使用Unity/Unreal等引擎',
            skills: ['C#', 'Unity', 'C++', 'Unreal', '图形学'],
            dimensions: ['引擎掌握', '图形学', '性能优化', '网络编程', '团队协作', '工具开发'],
          },
          {
            id: 'game-ops', name: '游戏运营', industry: '互联网', category: '游戏', icon: 'Lightbulb',
            description: '负责游戏日常运营、活动策划、用户维护、商业化',
            skills: ['数据分析', '活动策划', '用户运营', '商业化', '社区运营'],
            dimensions: ['数据分析', '活动策划', '用户运营', '商业化', '社区运营', '竞品分析'],
          },
        ],
      },
    ],
  },
  {
    industry: '金融',
    categories: [
      {
        name: '投资银行',
        positions: [
          {
            id: 'ib-analyst', name: '投行分析师', industry: '金融', category: '投资银行', icon: 'BarChart3',
            description: '负责行业研究、公司估值、财务建模、并购交易支持',
            skills: ['财务建模', '估值分析', '行业研究', 'PPT/Excel', '尽职调查'],
            dimensions: ['财务分析', '估值建模', '行业研究', '交易执行', '沟通能力', '法律法规'],
          },
          {
            id: 'equity-research', name: '行业研究员', industry: '金融', category: '投资银行', icon: 'BarChart3',
            description: '负责特定行业的深度研究，撰写研究报告，提供投资建议',
            skills: ['行业研究', '财务分析', '估值建模', '报告撰写', '数据挖掘'],
            dimensions: ['行业研究', '财务分析', '估值建模', '报告撰写', '数据能力', '逻辑思维'],
          },
        ],
      },
      {
        name: '银行',
        positions: [
          {
            id: 'bank-rm', name: '客户经理', industry: '金融', category: '银行', icon: 'Lightbulb',
            description: '负责银行客户开发、维护，提供综合金融服务方案',
            skills: ['客户关系', '金融产品', '风控', '沟通谈判', '营销'],
            dimensions: ['客户关系', '金融产品', '风险控制', '沟通能力', '营销能力', '合规意识'],
          },
          {
            id: 'risk-management', name: '风险管理', industry: '金融', category: '银行', icon: 'BarChart3',
            description: '负责信贷风险、市场风险、操作风险的识别、评估和控制',
            skills: ['风控模型', 'SQL', 'Python', '统计分析', '金融法规'],
            dimensions: ['风控模型', '统计分析', 'SQL/Python', '金融法规', '业务理解', '逻辑思维'],
          },
        ],
      },
      {
        name: '量化',
        positions: [
          {
            id: 'quant-researcher', name: '量化研究员', industry: '金融', category: '量化', icon: 'BarChart3',
            description: '负责量化策略研发、因子挖掘、回测优化、业绩归因',
            skills: ['Python', 'C++', '统计学', '机器学习', '金融市场'],
            dimensions: ['数学基础', '编程能力', '金融知识', '机器学习', '策略研发', '回测系统'],
          },
          {
            id: 'quant-dev', name: '量化开发', industry: '金融', category: '量化', icon: 'Code2',
            description: '负责量化交易系统开发、低延迟优化、数据处理平台建设',
            skills: ['C++', 'Python', 'Linux', '低延迟', '分布式系统'],
            dimensions: ['C++/Python', '系统设计', '网络编程', '性能优化', '金融市场', '数据处理'],
          },
        ],
      },
    ],
  },
  {
    industry: '咨询',
    categories: [
      {
        name: '咨询顾问',
        positions: [
          {
            id: 'strategy-consultant', name: '战略咨询顾问', industry: '咨询', category: '咨询顾问', icon: 'Lightbulb',
            description: '为企业提供战略规划、市场进入、组织变革等咨询服务',
            skills: ['逻辑分析', 'PPT/Excel', '行业研究', '商业分析', '沟通表达'],
            dimensions: ['逻辑分析', '商业分析', '行业研究', '沟通表达', '项目管理', '解决问题'],
          },
          {
            id: 'it-consultant', name: 'IT咨询顾问', industry: '咨询', category: '咨询顾问', icon: 'Code2',
            description: '为企业的数字化转型、IT架构、系统实施提供咨询服务',
            skills: ['IT架构', '项目管理', '业务流程', '技术方案', '沟通表达'],
            dimensions: ['IT架构', '项目管理', '业务理解', '技术方案', '沟通表达', '行业知识'],
          },
        ],
      },
    ],
  },
  {
    industry: '快消/零售',
    categories: [
      {
        name: '管理培训生',
        positions: [
          {
            id: 'brand-manager', name: '品牌管理', industry: '快消/零售', category: '管理培训生', icon: 'Lightbulb',
            description: '负责品牌策略制定、市场推广、消费者洞察、预算管理',
            skills: ['品牌策略', '市场分析', '消费者洞察', '预算管理', '跨部门协作'],
            dimensions: ['品牌策略', '市场分析', '消费者洞察', '预算管理', '沟通协作', '创意策划'],
          },
          {
            id: 'supply-chain', name: '供应链管理', industry: '快消/零售', category: '管理培训生', icon: 'BarChart3',
            description: '负责供应链规划、采购管理、库存优化、物流管理',
            skills: ['供应链', '数据分析', 'ERP', '物流管理', '采购谈判'],
            dimensions: ['供应链规划', '数据分析', '采购管理', '库存优化', '物流管理', '沟通谈判'],
          },
          {
            id: 'sales-manager', name: '销售管理', industry: '快消/零售', category: '管理培训生', icon: 'Lightbulb',
            description: '负责渠道管理、客户开发、销售策略制定、团队管理',
            skills: ['销售策略', '渠道管理', '客户关系', '数据分析', '团队管理'],
            dimensions: ['销售策略', '渠道管理', '客户关系', '数据分析', '团队管理', '市场洞察'],
          },
        ],
      },
    ],
  },
  {
    industry: '汽车',
    categories: [
      {
        name: '智能驾驶',
        positions: [
          {
            id: 'autonomous-driving', name: '自动驾驶算法', industry: '汽车', category: '智能驾驶', icon: 'Code2',
            description: '负责感知、规划、控制等自动驾驶核心算法的研发',
            skills: ['C++', 'Python', 'ROS', '深度学习', 'SLAM'],
            dimensions: ['C++', '感知算法', '规划控制', 'SLAM', '深度学习', '工程能力'],
          },
          {
            id: 'smart-cockpit', name: '智能座舱开发', industry: '汽车', category: '智能驾驶', icon: 'Layout',
            description: '负责车载系统UI开发、语音交互、车联网应用开发',
            skills: ['Android Auto', 'Qt', 'C++', '语音交互', '车载系统'],
            dimensions: ['Android/Qt', 'C++', 'UI开发', '语音交互', '车载协议', '性能优化'],
          },
        ],
      },
    ],
  },
  {
    industry: '半导体',
    categories: [
      {
        name: '芯片设计',
        positions: [
          {
            id: 'ic-design', name: '芯片设计工程师', industry: '半导体', category: '芯片设计', icon: 'Code2',
            description: '负责数字/模拟芯片的设计、验证、综合和时序分析',
            skills: ['Verilog', 'SystemVerilog', 'UVM', 'EDA工具', '电路设计'],
            dimensions: ['Verilog/VHDL', '数字电路', '验证方法', 'EDA工具', '时序分析', '功耗优化'],
          },
          {
            id: 'ic-verification', name: '芯片验证工程师', industry: '半导体', category: '芯片设计', icon: 'Code2',
            description: '负责芯片功能验证、UVM验证平台搭建、覆盖率和回归测试',
            skills: ['SystemVerilog', 'UVM', 'Python', '脚本', '验证方法学'],
            dimensions: ['SystemVerilog', 'UVM', '验证方法学', 'Python', '覆盖率', '调试能力'],
          },
        ],
      },
    ],
  },
  {
    industry: '教育',
    categories: [
      {
        name: '教研/课程',
        positions: [
          {
            id: 'curriculum-design', name: '课程设计', industry: '教育', category: '教研/课程', icon: 'Lightbulb',
            description: '负责在线课程内容设计、教学方案制定、学习效果评估',
            skills: ['教学设计', '课程开发', '用户研究', '内容创作', '数据分析'],
            dimensions: ['教学设计', '课程开发', '用户研究', '内容创作', '数据分析', '教育心理学'],
          },
          {
            id: 'edtech-ops', name: '在线教育运营', industry: '教育', category: '教研/课程', icon: 'Lightbulb',
            description: '负责在线教育平台的用户增长、课程推广、社群运营',
            skills: ['用户增长', '社群运营', '数据分析', '内容策划', '活动策划'],
            dimensions: ['用户增长', '社群运营', '数据分析', '内容策划', '活动策划', '教育行业'],
          },
        ],
      },
    ],
  },
  {
    industry: '制造业',
    categories: [
      {
        name: '工程技术',
        positions: [
          {
            id: 'mechanical-engineer', name: '机械工程师', industry: '制造业', category: '工程技术', icon: 'Code2',
            description: '负责机械结构设计、零部件设计、制造工艺优化',
            skills: ['CAD', 'SolidWorks', 'FEA', '机械设计', '制造工艺'],
            dimensions: ['机械设计', 'CAD/CAE', '材料力学', '制造工艺', '项目管理', '质量管理'],
          },
          {
            id: 'electrical-engineer', name: '电气工程师', industry: '制造业', category: '工程技术', icon: 'Code2',
            description: '负责电气系统设计、PLC编程、自动化设备调试',
            skills: ['PLC', '电气设计', '自动化', 'CAD', '调试'],
            dimensions: ['PLC编程', '电气设计', '自动化', 'CAD', '调试', '项目管理'],
          },
        ],
      },
    ],
  },
]