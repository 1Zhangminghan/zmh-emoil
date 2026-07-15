// ============ 诊断测试题数据 ============

export const diagnosticQuestions: Record<string, Array<{
  id: string
  dimension: string
  type: 'choice' | 'short' | 'essay'
  difficulty: 'basic' | 'intermediate' | 'advanced'
  question: string
  options?: string[]
  expectedAnswer: string
}>> = {
  'java-backend': [
    { id: 'j1', dimension: 'Java基础', type: 'choice', difficulty: 'basic', question: 'Java中，以下哪个关键字用于实现接口？', options: ['extends', 'implements', 'abstract', 'interface'], expectedAnswer: 'implements' },
    { id: 'j2', dimension: 'Java基础', type: 'short', difficulty: 'intermediate', question: '请简述Java中HashMap的工作原理，以及JDK8中HashMap做了哪些优化？', expectedAnswer: 'HashMap基于哈希表实现，JDK8引入了红黑树优化冲突处理' },
    { id: 'j3', dimension: '框架应用', type: 'choice', difficulty: 'basic', question: 'Spring Boot中，以下哪个注解用于标记主启动类？', options: ['@Component', '@Service', '@SpringBootApplication', '@Configuration'], expectedAnswer: '@SpringBootApplication' },
    { id: 'j4', dimension: '框架应用', type: 'short', difficulty: 'intermediate', question: '请简述Spring的IoC和AOP的概念及其应用场景。', expectedAnswer: 'IoC控制反转实现依赖注入，AOP面向切面编程用于日志、事务等横切关注点' },
    { id: 'j5', dimension: '数据库', type: 'choice', difficulty: 'basic', question: 'MySQL中，InnoDB存储引擎默认的事务隔离级别是？', options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'], expectedAnswer: 'REPEATABLE READ' },
    { id: 'j6', dimension: '数据库', type: 'short', difficulty: 'advanced', question: '请解释MySQL中索引的最左前缀原则，并举例说明什么情况下索引会失效。', expectedAnswer: '联合索引从最左列开始匹配，LIKE前置%和函数操作会导致索引失效' },
    { id: 'j7', dimension: '系统设计', type: 'essay', difficulty: 'advanced', question: '请设计一个秒杀系统的架构方案，需要考虑到高并发、库存扣减、防止超卖等问题。', expectedAnswer: '需要考虑Redis预扣库存、消息队列削峰、限流、分布式锁等' },
    { id: 'j8', dimension: '算法', type: 'short', difficulty: 'intermediate', question: '请用你熟悉的语言实现一个LRU缓存淘汰算法，并说明时间复杂度。', expectedAnswer: '使用HashMap+双向链表实现，get和put都是O(1)' },
    { id: 'j9', dimension: '项目经验', type: 'essay', difficulty: 'intermediate', question: '请描述一个你遇到的最复杂的技术问题，以及你是如何解决它的。', expectedAnswer: '需要展示问题分析、方案设计、实施落地、效果验证的完整过程' },
    { id: 'j10', dimension: '系统设计', type: 'short', difficulty: 'intermediate', question: '请简述分布式系统中CAP理论的含义，以及在实际项目中如何权衡？', expectedAnswer: 'CAP分别是一致性、可用性、分区容错性，三者不可兼得，需根据业务场景权衡' },
  ],
  'frontend': [
    { id: 'f1', dimension: 'HTML/CSS', type: 'choice', difficulty: 'basic', question: 'CSS中，以下哪个属性可以实现元素的水平居中？', options: ['text-align: center', 'margin: 0 auto', 'vertical-align: middle', '以上都可以'], expectedAnswer: 'margin: 0 auto（块级元素）' },
    { id: 'f2', dimension: 'HTML/CSS', type: 'short', difficulty: 'intermediate', question: '请解释CSS盒模型，并说明box-sizing: border-box的作用。', expectedAnswer: '盒模型包含content、padding、border、margin，border-box让width包含padding和border' },
    { id: 'f3', dimension: 'JavaScript', type: 'choice', difficulty: 'basic', question: '以下哪个不是JavaScript的基本数据类型？', options: ['String', 'Number', 'Array', 'Boolean'], expectedAnswer: 'Array' },
    { id: 'f4', dimension: 'JavaScript', type: 'short', difficulty: 'intermediate', question: '请解释JavaScript中的事件循环（Event Loop）机制。', expectedAnswer: 'JS是单线程，通过事件循环处理异步任务，分为宏任务和微任务队列' },
    { id: 'f5', dimension: '框架掌握', type: 'choice', difficulty: 'basic', question: 'React中，以下哪个Hook用于管理副作用？', options: ['useState', 'useEffect', 'useMemo', 'useCallback'], expectedAnswer: 'useEffect' },
    { id: 'f6', dimension: '框架掌握', type: 'short', difficulty: 'intermediate', question: '请简述React的虚拟DOM的工作原理及其优势。', expectedAnswer: '虚拟DOM是JS对象表示的DOM树，通过Diff算法最小化真实DOM操作，提升性能' },
    { id: 'f7', dimension: '工程化', type: 'short', difficulty: 'intermediate', question: '请简述Webpack的核心概念（Entry、Output、Loader、Plugin）及其作用。', expectedAnswer: 'Entry是入口，Output是输出，Loader处理非JS文件，Plugin扩展功能' },
    { id: 'f8', dimension: '性能优化', type: 'essay', difficulty: 'advanced', question: '请列举前端性能优化的常用手段，并从加载性能和运行时性能两个维度说明。', expectedAnswer: '加载：代码分割、CDN、压缩、缓存；运行时：虚拟列表、防抖节流、懒加载' },
    { id: 'f9', dimension: '跨端开发', type: 'short', difficulty: 'intermediate', question: '请简述React Native与Flutter的异同点。', expectedAnswer: 'RN使用JS桥接原生组件，Flutter使用Skia引擎自绘，性能更好但包体积较大' },
    { id: 'f10', dimension: '工程化', type: 'short', difficulty: 'basic', question: '请解释Git中rebase和merge的区别，以及各自的使用场景。', expectedAnswer: 'merge保留分支历史，rebase线性化提交历史；个人分支用rebase，公共分支用merge' },
  ],
  'product-manager': [
    { id: 'p1', dimension: '需求分析', type: 'short', difficulty: 'basic', question: '请简述需求分析的常用方法有哪些？', expectedAnswer: '用户访谈、问卷调查、数据分析、竞品分析、用户画像等' },
    { id: 'p2', dimension: '需求分析', type: 'essay', difficulty: 'intermediate', question: '假如你发现用户反馈某个功能"不好用"，但数据却显示该功能使用率很高，你会如何分析？', expectedAnswer: '需要区分使用频率和满意度，通过用户访谈、可用性测试、漏斗分析定位问题' },
    { id: 'p3', dimension: '产品设计', type: 'choice', difficulty: 'basic', question: '绘制产品原型时，以下哪个工具最常用？', options: ['Photoshop', 'Figma/Axure', 'Premiere', 'Excel'], expectedAnswer: 'Figma/Axure' },
    { id: 'p4', dimension: '产品设计', type: 'short', difficulty: 'intermediate', question: '请简述MVP（最小可行产品）的概念及其设计原则。', expectedAnswer: 'MVP是用最小成本验证核心假设的产品版本，原则是聚焦核心功能、快速迭代' },
    { id: 'p5', dimension: '数据分析', type: 'choice', difficulty: 'basic', question: '以下哪个指标常用于衡量产品的用户粘性？', options: ['DAU', 'MAU', 'DAU/MAU', 'GMV'], expectedAnswer: 'DAU/MAU' },
    { id: 'p6', dimension: '数据分析', type: 'short', difficulty: 'intermediate', question: 'A/B测试中，如何判断实验结果是否显著？', expectedAnswer: '通过统计检验（如t检验），p值小于0.05通常认为结果显著' },
    { id: 'p7', dimension: '项目管理', type: 'short', difficulty: 'basic', question: '请简述敏捷开发（Scrum）的核心角色和流程。', expectedAnswer: 'PO、Scrum Master、开发团队；Sprint、每日站会、评审、回顾' },
    { id: 'p8', dimension: '商业思维', type: 'essay', difficulty: 'advanced', question: '假如你要为一款产品制定定价策略，你会考虑哪些因素？', expectedAnswer: '成本、竞品定价、用户支付意愿、价值定价、免费增值模式等' },
    { id: 'p9', dimension: '沟通协调', type: 'essay', difficulty: 'intermediate', question: '当开发团队说"技术上无法实现"你的需求时，你会如何处理？', expectedAnswer: '理解技术难点、与开发共同探讨替代方案、权衡优先级、必要时调整需求' },
    { id: 'p10', dimension: '产品设计', type: 'short', difficulty: 'intermediate', question: '请简述用户故事（User Story）的标准格式，并举一个例子。', expectedAnswer: '作为<角色>，我想要<功能>，以便<价值>。例如：作为用户，我想要一键登录，以便快速进入应用' },
  ],
  'data-analyst': [
    { id: 'd1', dimension: '统计学', type: 'choice', difficulty: 'basic', question: '以下哪个不是描述数据集中趋势的指标？', options: ['均值', '中位数', '标准差', '众数'], expectedAnswer: '标准差' },
    { id: 'd2', dimension: '统计学', type: 'short', difficulty: 'intermediate', question: '请解释p值的含义，以及在假设检验中如何使用p值。', expectedAnswer: 'p值是在原假设成立时观察到当前结果的概率，p<0.05拒绝原假设' },
    { id: 'd3', dimension: 'SQL', type: 'choice', difficulty: 'basic', question: 'SQL中，用于去重的关键字是？', options: ['UNIQUE', 'DISTINCT', 'DIFFERENT', 'GROUP BY'], expectedAnswer: 'DISTINCT' },
    { id: 'd4', dimension: 'SQL', type: 'short', difficulty: 'intermediate', question: '请写出SQL中JOIN的几种类型，并说明区别。', expectedAnswer: 'INNER JOIN取交集，LEFT JOIN保留左表全部，RIGHT JOIN保留右表，FULL JOIN取并集' },
    { id: 'd5', dimension: 'Python/R', type: 'choice', difficulty: 'basic', question: 'Python数据分析中，以下哪个库不是常用的？', options: ['pandas', 'numpy', 'matplotlib', 'django'], expectedAnswer: 'django' },
    { id: 'd6', dimension: 'Python/R', type: 'short', difficulty: 'intermediate', question: '请简述pandas中DataFrame和Series的区别。', expectedAnswer: 'Series是一维数据结构，DataFrame是二维表格结构，由多个Series组成' },
    { id: 'd7', dimension: '可视化', type: 'short', difficulty: 'basic', question: '请列举常用的数据可视化图表类型及其适用场景。', expectedAnswer: '折线图（趋势）、柱状图（对比）、饼图（占比）、散点图（相关性）、热力图（密度）' },
    { id: 'd8', dimension: '业务理解', type: 'essay', difficulty: 'intermediate', question: '假如某电商平台的GMV下降了10%，请描述你的分析思路。', expectedAnswer: '按维度拆解（用户、商品、渠道、时间），通过漏斗分析和对比分析定位问题' },
    { id: 'd9', dimension: '机器学习', type: 'short', difficulty: 'intermediate', question: '请简述监督学习和无监督学习的区别，并各举一个例子。', expectedAnswer: '监督学习有标签（分类、回归），无监督学习无标签（聚类、降维）' },
    { id: 'd10', dimension: '统计学', type: 'short', difficulty: 'advanced', question: '请解释相关系数和因果关系的区别，为什么不能把相关性等同于因果性？', expectedAnswer: '相关系数衡量两个变量的线性关联程度，因果关系需要实验或准实验设计来验证' },
  ],
  'ui-designer': [
    { id: 'u1', dimension: '视觉设计', type: 'choice', difficulty: 'basic', question: '以下哪个不是色彩三要素？', options: ['色相', '饱和度', '对比度', '明度'], expectedAnswer: '对比度' },
    { id: 'u2', dimension: '视觉设计', type: 'short', difficulty: 'intermediate', question: '请简述设计中的"格式塔原理"，并举例说明。', expectedAnswer: '格式塔原理包括接近性、相似性、闭合性、连续性等，指导视觉元素的组织' },
    { id: 'u3', dimension: '交互设计', type: 'choice', difficulty: 'basic', question: 'Fitts定律描述了什么？', options: ['颜色搭配原则', '目标大小与点击时间的关系', '用户阅读习惯', '信息层级'], expectedAnswer: '目标大小与点击时间的关系' },
    { id: 'u4', dimension: '交互设计', type: 'short', difficulty: 'intermediate', question: '请简述尼尔森十大可用性原则中的任意3条。', expectedAnswer: '状态可见性、系统与现实匹配、用户控制与自由、一致性与标准化、防错、识别而非回忆等' },
    { id: 'u5', dimension: '设计规范', type: 'short', difficulty: 'basic', question: '请简述设计系统（Design System）包含哪些核心内容？', expectedAnswer: '设计原则、颜色/字体/间距等Token、组件库、设计模式、文档规范' },
    { id: 'u6', dimension: '设计规范', type: 'short', difficulty: 'intermediate', question: '在移动端设计中，为什么推荐使用8px栅格系统？', expectedAnswer: '8px栅格系统保证了元素间距的一致性，且兼容大多数屏幕分辨率（8的倍数）' },
    { id: 'u7', dimension: '工具掌握', type: 'choice', difficulty: 'basic', question: 'Figma中，用于创建可复用组件的功能是？', options: ['Frame', 'Component', 'Group', 'Auto Layout'], expectedAnswer: 'Component' },
    { id: 'u8', dimension: '用户研究', type: 'essay', difficulty: 'intermediate', question: '请描述一个完整的用户研究流程，从确定目标到输出报告。', expectedAnswer: '确定研究目标→选择方法→招募用户→执行研究→分析数据→输出报告→落地设计' },
    { id: 'u9', dimension: '动效设计', type: 'short', difficulty: 'intermediate', question: '请简述动效设计在UI中的作用，以及何时应该使用动效。', expectedAnswer: '提供反馈、引导注意力、展示状态变化、增强体验；避免过度使用影响性能' },
    { id: 'u10', dimension: '视觉设计', type: 'short', difficulty: 'basic', question: '请解释什么是响应式设计，以及设计时需要考虑哪些断点。', expectedAnswer: '响应式设计让页面适配不同屏幕尺寸，常见断点：手机768px、平板1024px、桌面1280px' },
  ],
}