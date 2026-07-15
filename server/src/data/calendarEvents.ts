// ============ 预设校招关键时间节点 ============

export interface PresetCalendarEvent {
  id: string
  title: string
  company: string
  type: string
  date: string
  recruitment_type: string
  position?: string
  industry?: string
}

export const presetCalendarEvents: PresetCalendarEvent[] = [
  // ============ 秋招 2026 ============
  // --- 提前批 ---
  { id: 'preset_fall_01', title: '秋招提前批启动', company: '各大厂', type: 'info_session', date: '2026-07-01', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_02', title: '华为秋招提前批网申', company: '华为', type: 'deadline', date: '2026-07-20', recruitment_type: 'fall', industry: '制造', position: '技术类' },
  { id: 'preset_fall_03', title: '字节跳动提前批笔试', company: '字节跳动', type: 'written_test', date: '2026-08-01', recruitment_type: 'fall', industry: '互联网', position: '技术类' },

  // --- 互联网正式批 ---
  { id: 'preset_fall_04', title: '秋招正式批启动', company: '各大厂', type: 'info_session', date: '2026-08-15', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_05', title: '腾讯秋招网申开始', company: '腾讯', type: 'info_session', date: '2026-08-20', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_06', title: '阿里巴巴秋招网申开始', company: '阿里巴巴', type: 'info_session', date: '2026-08-25', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_07', title: '美团秋招网申开始', company: '美团', type: 'info_session', date: '2026-09-01', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_08', title: '拼多多秋招网申开始', company: '拼多多', type: 'info_session', date: '2026-09-01', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_09', title: '腾讯秋招网申截止', company: '腾讯', type: 'deadline', date: '2026-09-15', recruitment_type: 'fall', industry: '互联网', position: '技术类' },
  { id: 'preset_fall_10', title: '阿里秋招网申截止', company: '阿里巴巴', type: 'deadline', date: '2026-09-20', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_11', title: '字节跳动秋招笔试', company: '字节跳动', type: 'written_test', date: '2026-09-25', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_12', title: '百度秋招网申截止', company: '百度', type: 'deadline', date: '2026-10-10', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_13', title: '美团秋招面试期', company: '美团', type: 'interview', date: '2026-10-15', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_14', title: '京东秋招网申截止', company: '京东', type: 'deadline', date: '2026-10-20', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_15', title: '网易秋招笔试', company: '网易', type: 'written_test', date: '2026-10-25', recruitment_type: 'fall', industry: '互联网' },

  // --- 更多互联网公司 ---
  { id: 'preset_fall_16', title: '京东秋招网申开始', company: '京东', type: 'info_session', date: '2026-08-28', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_17', title: '京东秋招笔试', company: '京东', type: 'written_test', date: '2026-09-28', recruitment_type: 'fall', industry: '互联网', position: '技术类' },
  { id: 'preset_fall_18', title: '京东秋招面试', company: '京东', type: 'interview', date: '2026-10-25', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_19', title: '网易秋招网申开始', company: '网易', type: 'info_session', date: '2026-09-05', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_20', title: '网易秋招面试', company: '网易', type: 'interview', date: '2026-11-05', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_21', title: '滴滴秋招网申开始', company: '滴滴', type: 'info_session', date: '2026-09-05', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_22', title: '滴滴秋招笔试', company: '滴滴', type: 'written_test', date: '2026-09-30', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_23', title: 'B站秋招网申开始', company: 'B站', type: 'info_session', date: '2026-09-08', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_24', title: 'B站秋招笔试', company: 'B站', type: 'written_test', date: '2026-10-08', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_25', title: '小米秋招网申开始', company: '小米', type: 'info_session', date: '2026-09-01', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_26', title: '小米秋招笔试', company: '小米', type: 'written_test', date: '2026-09-25', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_27', title: '携程秋招网申开始', company: '携程', type: 'info_session', date: '2026-09-10', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_28', title: '字节跳动秋招面试', company: '字节跳动', type: 'interview', date: '2026-10-10', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_29', title: '腾讯秋招面试', company: '腾讯', type: 'interview', date: '2026-10-05', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_30', title: '阿里巴巴秋招面试', company: '阿里巴巴', type: 'interview', date: '2026-10-12', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_31', title: '拼多多秋招面试', company: '拼多多', type: 'interview', date: '2026-10-20', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_32', title: '百度秋招面试', company: '百度', type: 'interview', date: '2026-10-28', recruitment_type: 'fall', industry: '互联网' },

  // --- 金融 ---
  { id: 'preset_fall_33', title: '中金公司秋招网申开始', company: '中金公司', type: 'info_session', date: '2026-09-01', recruitment_type: 'fall', industry: '金融' },
  { id: 'preset_fall_34', title: '中金公司秋招网申截止', company: '中金公司', type: 'deadline', date: '2026-10-15', recruitment_type: 'fall', industry: '金融', position: '投行/研究' },
  { id: 'preset_fall_35', title: '中金公司秋招面试', company: '中金公司', type: 'interview', date: '2026-11-01', recruitment_type: 'fall', industry: '金融' },
  { id: 'preset_fall_36', title: '招商银行秋招网申开始', company: '招商银行', type: 'info_session', date: '2026-09-05', recruitment_type: 'fall', industry: '金融' },
  { id: 'preset_fall_37', title: '招商银行秋招笔试', company: '招商银行', type: 'written_test', date: '2026-10-10', recruitment_type: 'fall', industry: '金融' },
  { id: 'preset_fall_38', title: '招商银行秋招面试', company: '招商银行', type: 'interview', date: '2026-11-05', recruitment_type: 'fall', industry: '金融' },

  // --- 咨询 ---
  { id: 'preset_fall_39', title: '麦肯锡秋招网申开始', company: '麦肯锡', type: 'info_session', date: '2026-09-01', recruitment_type: 'fall', industry: '咨询' },
  { id: 'preset_fall_40', title: '麦肯锡秋招网申截止', company: '麦肯锡', type: 'deadline', date: '2026-10-10', recruitment_type: 'fall', industry: '咨询', position: '咨询顾问' },
  { id: 'preset_fall_41', title: '麦肯锡秋招面试', company: '麦肯锡', type: 'interview', date: '2026-11-10', recruitment_type: 'fall', industry: '咨询' },
  { id: 'preset_fall_42', title: '安永秋招网申开始', company: '安永', type: 'info_session', date: '2026-09-10', recruitment_type: 'fall', industry: '咨询' },
  { id: 'preset_fall_43', title: '安永秋招笔试', company: '安永', type: 'written_test', date: '2026-10-15', recruitment_type: 'fall', industry: '咨询' },

  // --- 快消 ---
  { id: 'preset_fall_44', title: '宝洁秋招网申开始', company: '宝洁', type: 'info_session', date: '2026-09-05', recruitment_type: 'fall', industry: '快消' },
  { id: 'preset_fall_45', title: '宝洁秋招网申截止', company: '宝洁', type: 'deadline', date: '2026-10-10', recruitment_type: 'fall', industry: '快消', position: '市场/供应链' },
  { id: 'preset_fall_46', title: '宝洁秋招面试', company: '宝洁', type: 'interview', date: '2026-11-10', recruitment_type: 'fall', industry: '快消' },
  { id: 'preset_fall_47', title: '联合利华秋招网申开始', company: '联合利华', type: 'info_session', date: '2026-09-08', recruitment_type: 'fall', industry: '快消' },
  { id: 'preset_fall_48', title: '联合利华秋招笔试', company: '联合利华', type: 'written_test', date: '2026-10-12', recruitment_type: 'fall', industry: '快消' },

  // --- 制造/汽车 ---
  { id: 'preset_fall_49', title: '华为秋招面试', company: '华为', type: 'interview', date: '2026-09-15', recruitment_type: 'fall', industry: '制造' },
  { id: 'preset_fall_50', title: '蔚来秋招网申开始', company: '蔚来', type: 'info_session', date: '2026-09-01', recruitment_type: 'fall', industry: '制造' },
  { id: 'preset_fall_51', title: '蔚来秋招笔试', company: '蔚来', type: 'written_test', date: '2026-09-25', recruitment_type: 'fall', industry: '制造', position: '自动驾驶' },
  { id: 'preset_fall_52', title: '理想汽车秋招网申开始', company: '理想汽车', type: 'info_session', date: '2026-09-05', recruitment_type: 'fall', industry: '制造' },
  { id: 'preset_fall_53', title: '理想汽车秋招笔试', company: '理想汽车', type: 'written_test', date: '2026-09-28', recruitment_type: 'fall', industry: '制造' },

  // --- 补录 ---
  { id: 'preset_fall_54', title: '秋招补录阶段启动', company: '各大厂', type: 'info_session', date: '2026-11-01', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_55', title: '秋招offer发放高峰期', company: '各大厂', type: 'other', date: '2026-11-20', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_56', title: '秋招补录面试', company: '各大厂', type: 'interview', date: '2026-12-01', recruitment_type: 'fall', industry: '互联网' },
  { id: 'preset_fall_57', title: '秋招最终offer确认截止', company: '各大厂', type: 'deadline', date: '2026-12-31', recruitment_type: 'fall', industry: '互联网' },

  // ============ 春招 2027 ============
  { id: 'preset_spring_01', title: '春招提前批启动', company: '各大厂', type: 'info_session', date: '2027-02-10', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_02', title: '春招正式批网申开始', company: '各大厂', type: 'info_session', date: '2027-03-01', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_03', title: '腾讯春招网申截止', company: '腾讯', type: 'deadline', date: '2027-03-15', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_04', title: '字节跳动春招笔试', company: '字节跳动', type: 'written_test', date: '2027-03-20', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_05', title: '阿里巴巴春招网申截止', company: '阿里巴巴', type: 'deadline', date: '2027-03-25', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_06', title: '阿里春招面试期', company: '阿里巴巴', type: 'interview', date: '2027-04-01', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_07', title: '美团春招面试期', company: '美团', type: 'interview', date: '2027-04-05', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_08', title: '百度春招笔试', company: '百度', type: 'written_test', date: '2027-04-10', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_09', title: '春招补录阶段', company: '各大厂', type: 'info_session', date: '2027-04-20', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_10', title: '春招offer发放', company: '各大厂', type: 'other', date: '2027-05-10', recruitment_type: 'spring', industry: '互联网' },

  // --- 春招更多公司 ---
  { id: 'preset_spring_11', title: '京东春招网申开始', company: '京东', type: 'info_session', date: '2027-03-01', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_12', title: '京东春招笔试', company: '京东', type: 'written_test', date: '2027-03-18', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_13', title: '网易春招网申开始', company: '网易', type: 'info_session', date: '2027-03-05', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_14', title: '拼多多春招网申开始', company: '拼多多', type: 'info_session', date: '2027-03-05', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_15', title: '小米春招网申开始', company: '小米', type: 'info_session', date: '2027-03-01', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_16', title: '滴滴春招网申开始', company: '滴滴', type: 'info_session', date: '2027-03-08', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_17', title: 'B站春招网申开始', company: 'B站', type: 'info_session', date: '2027-03-10', recruitment_type: 'spring', industry: '互联网' },
  { id: 'preset_spring_18', title: '携程春招网申开始', company: '携程', type: 'info_session', date: '2027-03-08', recruitment_type: 'spring', industry: '互联网' },

  // --- 春招金融 ---
  { id: 'preset_spring_19', title: '中金公司春招网申', company: '中金公司', type: 'info_session', date: '2027-03-01', recruitment_type: 'spring', industry: '金融' },
  { id: 'preset_spring_20', title: '招商银行春招网申', company: '招商银行', type: 'info_session', date: '2027-03-05', recruitment_type: 'spring', industry: '金融' },

  // --- 春招咨询 ---
  { id: 'preset_spring_21', title: '麦肯锡春招网申', company: '麦肯锡', type: 'info_session', date: '2027-03-01', recruitment_type: 'spring', industry: '咨询' },
  { id: 'preset_spring_22', title: '安永春招网申', company: '安永', type: 'info_session', date: '2027-03-10', recruitment_type: 'spring', industry: '咨询' },

  // --- 春招快消 ---
  { id: 'preset_spring_23', title: '宝洁春招网申', company: '宝洁', type: 'info_session', date: '2027-03-05', recruitment_type: 'spring', industry: '快消' },
  { id: 'preset_spring_24', title: '联合利华春招网申', company: '联合利华', type: 'info_session', date: '2027-03-08', recruitment_type: 'spring', industry: '快消' },

  // --- 春招制造 ---
  { id: 'preset_spring_25', title: '华为春招网申', company: '华为', type: 'info_session', date: '2027-03-01', recruitment_type: 'spring', industry: '制造' },
  { id: 'preset_spring_26', title: '蔚来春招网申', company: '蔚来', type: 'info_session', date: '2027-03-05', recruitment_type: 'spring', industry: '制造' },
  { id: 'preset_spring_27', title: '理想汽车春招网申', company: '理想汽车', type: 'info_session', date: '2027-03-08', recruitment_type: 'spring', industry: '制造' },

  // ============ 日常实习 ============
  { id: 'preset_intern_01', title: '腾讯寒假实习招聘期', company: '腾讯', type: 'info_session', date: '2026-11-01', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_02', title: '字节跳动寒假实习网申', company: '字节跳动', type: 'deadline', date: '2026-12-01', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_03', title: '阿里巴巴寒假实习招聘', company: '阿里巴巴', type: 'info_session', date: '2026-11-15', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_04', title: '京东寒假实习招聘', company: '京东', type: 'info_session', date: '2026-11-10', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_05', title: '美团寒假实习招聘', company: '美团', type: 'info_session', date: '2026-11-05', recruitment_type: 'intern', industry: '互联网' },

  { id: 'preset_intern_06', title: '暑期实习提前批启动', company: '各大厂', type: 'info_session', date: '2027-02-01', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_07', title: '腾讯暑期实习网申', company: '腾讯', type: 'deadline', date: '2027-03-01', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_08', title: '字节暑期实习网申', company: '字节跳动', type: 'deadline', date: '2027-03-10', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_09', title: '字节暑期实习笔试', company: '字节跳动', type: 'written_test', date: '2027-03-15', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_10', title: '阿里暑期实习面试', company: '阿里巴巴', type: 'interview', date: '2027-03-20', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_11', title: '美团暑期实习网申截止', company: '美团', type: 'deadline', date: '2027-03-25', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_12', title: '京东暑期实习网申', company: '京东', type: 'deadline', date: '2027-03-20', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_13', title: '网易暑期实习网申', company: '网易', type: 'info_session', date: '2027-03-01', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_14', title: '小米暑期实习网申', company: '小米', type: 'info_session', date: '2027-03-05', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_15', title: 'B站暑期实习招聘', company: 'B站', type: 'info_session', date: '2027-03-10', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_16', title: '滴滴暑期实习招聘', company: '滴滴', type: 'info_session', date: '2027-03-08', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_17', title: '暑期实习offer发放', company: '各大厂', type: 'other', date: '2027-04-15', recruitment_type: 'intern', industry: '互联网' },
  { id: 'preset_intern_18', title: '暑期实习入职', company: '各大厂', type: 'other', date: '2027-06-15', recruitment_type: 'intern', industry: '互联网' },
]