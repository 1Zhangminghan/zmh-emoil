// ============ 学习材料种子数据 ============

export interface LearningMaterial {
  id: string
  dimension: string
  title: string
  type: string
  content: string
}

export const learningMaterialsSeedData: LearningMaterial[] = [
  // Java基础
  { id: 'lm_java_01', dimension: 'Java基础', title: 'Java集合框架深入理解', type: 'article', content: '深入理解Java集合框架，包括List、Set、Map的区别，以及ArrayList、LinkedList、HashMap的底层实现原理。重点掌握HashMap的哈希冲突处理、ConcurrentHashMap的线程安全机制。' },
  { id: 'lm_java_02', dimension: 'Java基础', title: 'Java并发编程实战', type: 'article', content: '掌握Java并发编程的核心概念：线程生命周期、synchronized关键字、volatile关键字、Lock接口、线程池、CountDownLatch、CyclicBarrier等。' },
  { id: 'lm_java_03', dimension: 'Java基础', title: 'JVM内存模型与GC', type: 'article', content: '理解JVM运行时数据区域（堆、栈、方法区等），垃圾回收算法（标记-清除、复制、标记-整理），常见GC收集器（CMS、G1、ZGC）的特点和适用场景。' },
  // 框架应用
  { id: 'lm_fw_01', dimension: '框架应用', title: 'Spring Boot自动配置原理', type: 'article', content: '理解Spring Boot的自动配置机制，@EnableAutoConfiguration注解的工作原理，如何自定义Starter。' },
  { id: 'lm_fw_02', dimension: '框架应用', title: 'Spring Cloud微服务实战', type: 'article', content: '掌握Spring Cloud核心组件：Eureka服务注册发现、Ribbon负载均衡、Feign声明式调用、Hystrix熔断降级、Gateway网关。' },
  // 数据库
  { id: 'lm_db_01', dimension: '数据库', title: 'MySQL索引优化实战', type: 'article', content: '深入理解B+树索引结构，掌握索引类型（主键索引、唯一索引、联合索引），学会使用EXPLAIN分析SQL执行计划。' },
  { id: 'lm_db_02', dimension: '数据库', title: 'Redis核心数据结构与应用', type: 'article', content: '掌握Redis的五种基本数据类型（String、Hash、List、Set、ZSet），理解缓存穿透、缓存击穿、缓存雪崩的解决方案。' },
  // 系统设计
  { id: 'lm_sys_01', dimension: '系统设计', title: '分布式系统设计模式', type: 'article', content: '学习常见分布式设计模式：服务发现、负载均衡、熔断器、限流、分布式锁、分布式事务（2PC、TCC、Saga）。' },
  { id: 'lm_sys_02', dimension: '系统设计', title: '高并发系统设计原则', type: 'article', content: '掌握高并发系统的设计原则：无状态设计、异步处理、缓存策略、数据分片、读写分离、CDN加速。' },
  // HTML/CSS
  { id: 'lm_html_01', dimension: 'HTML/CSS', title: 'CSS布局完全指南', type: 'article', content: '掌握Flexbox和Grid布局的核心概念，理解BFC、层叠上下文、响应式布局的实现方式。' },
  { id: 'lm_html_02', dimension: 'HTML/CSS', title: 'CSS动画与性能优化', type: 'article', content: '学习CSS Transition、Animation的使用，理解GPU加速原理，掌握will-change、transform等性能优化技巧。' },
  // JavaScript
  { id: 'lm_js_01', dimension: 'JavaScript', title: 'JS异步编程深度解析', type: 'article', content: '理解回调函数、Promise、async/await的演进，掌握事件循环、宏任务微任务队列。' },
  { id: 'lm_js_02', dimension: 'JavaScript', title: 'JS原型链与继承', type: 'article', content: '深入理解原型链机制，掌握ES6 Class语法糖的本质，了解各种继承方式的优缺点。' },
  // 框架掌握
  { id: 'lm_fw2_01', dimension: '框架掌握', title: 'React Hooks深入理解', type: 'article', content: '掌握useState、useEffect、useMemo、useCallback的使用场景，理解Fiber架构和并发模式。' },
  { id: 'lm_fw2_02', dimension: '框架掌握', title: 'Vue3响应式原理', type: 'article', content: '理解Vue3的Proxy响应式系统，掌握Composition API的使用，了解虚拟DOM和Diff算法优化。' },
  // 需求分析
  { id: 'lm_pm_01', dimension: '需求分析', title: '用户需求挖掘方法论', type: 'article', content: '学习用户访谈、问卷调查、可用性测试等方法，掌握KANO模型对需求进行分类和优先级排序。' },
  // 产品设计
  { id: 'lm_pm_02', dimension: '产品设计', title: '产品原型设计最佳实践', type: 'article', content: '掌握原型设计的基本原则（清晰、高效、一致），学习Axure/Figma高级功能，了解Material Design和Human Interface Guidelines。' },
  // 数据分析
  { id: 'lm_da_01', dimension: '数据分析', title: '产品数据指标体系搭建', type: 'article', content: '理解AARRR模型（获取、激活、留存、收入、传播），学习北极星指标的选择方法，掌握数据看板的设计原则。' },
  // SQL
  { id: 'lm_sql_01', dimension: 'SQL', title: 'SQL高级查询技巧', type: 'article', content: '掌握窗口函数（ROW_NUMBER、RANK、LAG、LEAD），CTE递归查询，复杂JOIN和子查询优化。' },
  // Python/R
  { id: 'lm_py_01', dimension: 'Python/R', title: 'Pandas数据分析实战', type: 'article', content: '掌握DataFrame的常用操作：数据清洗、分组聚合、透视表、时间序列处理、数据可视化。' },
  // 视觉设计
  { id: 'lm_ui_01', dimension: '视觉设计', title: '色彩理论与配色技巧', type: 'article', content: '理解色彩三要素（色相、饱和度、明度），掌握配色方案（互补色、邻近色、三角色），学习色彩在UI中的情感表达。' },
  { id: 'lm_ui_02', dimension: '视觉设计', title: '排版设计原则', type: 'article', content: '掌握字体选择、层级关系、行距字距、对齐方式等排版核心原则，理解栅格系统的应用。' },
  // 交互设计
  { id: 'lm_ui_03', dimension: '交互设计', title: '交互设计原则与实践', type: 'article', content: '学习尼尔森十大可用性原则，理解用户心智模型，掌握交互设计的常见模式（导航、表单、反馈）。' },
]