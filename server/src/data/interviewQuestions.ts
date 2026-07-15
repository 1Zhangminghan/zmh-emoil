// ============ 面试题库种子数据 ============

export interface InterviewQuestion {
  id: string
  type: string // technical, hr, comprehensive, behavioral
  question: string
  dimension: string
}

export const interviewQuestions: Record<string, InterviewQuestion[]> = {
  technical: [
    { id: 'it1', type: 'technical', question: '请做一个简单的自我介绍，重点介绍你的技术背景和项目经验。', dimension: '自我介绍' },
    { id: 'it2', type: 'technical', question: '请介绍一个你参与过的最有挑战性的项目，你在其中担任什么角色，解决了什么问题？', dimension: '项目经验' },
    { id: 'it3', type: 'technical', question: '在你的项目中，你如何保证代码质量？请具体说明。', dimension: '工程实践' },
    { id: 'it4', type: 'technical', question: '如果线上服务出现性能问题，你会如何排查和解决？', dimension: '问题解决' },
    { id: 'it5', type: 'technical', question: '请谈谈你对技术发展的看法，以及你未来的职业规划。', dimension: '职业规划' },
  ],
  hr: [
    { id: 'ih1', type: 'hr', question: '请做一个简单的自我介绍。', dimension: '自我介绍' },
    { id: 'ih2', type: 'hr', question: '你为什么选择我们公司？对我们公司有什么了解？', dimension: '求职动机' },
    { id: 'ih3', type: 'hr', question: '请谈谈你的优点和缺点。', dimension: '自我认知' },
    { id: 'ih4', type: 'hr', question: '你期望的薪资是多少？为什么？', dimension: '薪资期望' },
    { id: 'ih5', type: 'hr', question: '你未来3-5年的职业规划是什么？', dimension: '职业规划' },
  ],
  comprehensive: [
    { id: 'ic1', type: 'comprehensive', question: '请做一个简单的自我介绍。', dimension: '自我介绍' },
    { id: 'ic2', type: 'comprehensive', question: '请描述一个你在工作中遇到的困难，以及你是如何解决的。', dimension: '问题解决' },
    { id: 'ic3', type: 'comprehensive', question: '如果你和同事在工作中产生分歧，你会如何处理？', dimension: '团队协作' },
    { id: 'ic4', type: 'comprehensive', question: '请谈谈你对加班的看法。', dimension: '工作态度' },
    { id: 'ic5', type: 'comprehensive', question: '你有什么问题想问我们的吗？', dimension: '主动性' },
  ],
  behavioral: [
    { id: 'ib1', type: 'behavioral', question: '请描述一个你领导团队完成项目的经历。', dimension: '领导力' },
    { id: 'ib2', type: 'behavioral', question: '请举例说明你是如何处理工作中的压力的。', dimension: '抗压能力' },
    { id: 'ib3', type: 'behavioral', question: '请分享一个你从失败中学习的经历。', dimension: '学习能力' },
    { id: 'ib4', type: 'behavioral', question: '请描述一次你主动承担额外责任的经历。', dimension: '主动性' },
    { id: 'ib5', type: 'behavioral', question: '请举例说明你如何与不同性格的同事合作。', dimension: '团队协作' },
  ],
}