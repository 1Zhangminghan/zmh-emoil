// ============ SQLite 数据库 (基于 sql.js) ============

import initSqlJs, { type Database as SqlJsDatabase, type QueryExecResult } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { positionSeedData } from './data/positions'
import { experienceSeedData } from './data/experiences'
import { positionQuizData, aptitudeQuizData } from './data/quizData'
import { interviewQuestions } from './data/interviewQuestions'
import { presetCalendarEvents } from './data/calendarEvents'
import { learningMaterialsSeedData } from './data/learningMaterials'

const DB_PATH = path.join(__dirname, '..', 'data', 'app.db')
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let sqlDb: SqlJsDatabase | null = null

// 保存数据库到文件
function saveToFile() {
  if (!sqlDb) return
  try {
    const buffer = Buffer.from(sqlDb.export())
    fs.writeFileSync(DB_PATH, buffer)
  } catch (e) {
    console.error('[DB] 保存数据库失败:', e)
  }
}

// 封装 better-sqlite3 风格的 API
class PreparedStatement {
  private sql: string

  constructor(sql: string) {
    this.sql = sql
  }

  get(...params: unknown[]): Record<string, unknown> | undefined {
    try {
      const stmt = sqlDb!.prepare(this.sql)
      stmt.bind(params as any)
      if (stmt.step()) {
        const cols = stmt.getColumnNames()
        const vals = stmt.get()
        stmt.free()
        const result: Record<string, unknown> = {}
        cols.forEach((col, i) => { result[col] = vals[i] })
        return result
      }
      stmt.free()
      return undefined
    } catch (e) {
      console.error('[DB] get error:', this.sql, e)
      return undefined
    }
  }

  all(...params: unknown[]): Record<string, unknown>[] {
    try {
      const stmt = sqlDb!.prepare(this.sql)
      stmt.bind(params as any)
      const results: Record<string, unknown>[] = []
      const cols = stmt.getColumnNames()
      while (stmt.step()) {
        const vals = stmt.get()
        const row: Record<string, unknown> = {}
        cols.forEach((col, i) => { row[col] = vals[i] })
        results.push(row)
      }
      stmt.free()
      return results
    } catch (e) {
      console.error('[DB] all error:', this.sql, e)
      return []
    }
  }

  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint } {
    try {
      sqlDb!.run(this.sql, params as any)
      saveToFile()
      const rows = sqlDb!.exec('SELECT changes() as changes, last_insert_rowid() as id')
      return {
        changes: rows[0]?.values[0]?.[0] as number ?? 0,
        lastInsertRowid: rows[0]?.values[0]?.[1] as number ?? 0,
      }
    } catch (e) {
      console.error('[DB] run error:', this.sql, e)
      return { changes: 0, lastInsertRowid: 0 }
    }
  }
}

// 数据库封装对象
const db = {
  prepare: (sql: string) => new PreparedStatement(sql),
  exec: (sql: string) => {
    try {
      sqlDb!.run(sql)
      saveToFile()
    } catch (e) {
      console.error('[DB] exec error:', sql, e)
    }
  },
  // 兼容直接 exec 返回结果
  execQuery: (sql: string): QueryExecResult[] => {
    try {
      return sqlDb!.exec(sql)
    } catch (e) {
      console.error('[DB] execQuery error:', sql, e)
      return []
    }
  },
}

// ============ 初始化 ============

let initPromise: Promise<void> | null = null

export function initDatabase(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = initSqlJs().then((SQL) => {
    // 尝试从文件加载
    if (fs.existsSync(DB_PATH)) {
      try {
        const buffer = fs.readFileSync(DB_PATH)
        sqlDb = new SQL.Database(buffer)
        console.log('[DB] 数据库已从文件加载')
      } catch {
        sqlDb = new SQL.Database()
        console.log('[DB] 数据库文件损坏，创建新数据库')
      }
    } else {
      sqlDb = new SQL.Database()
      console.log('[DB] 创建新数据库')
    }

    // 创建表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nickname TEXT NOT NULL DEFAULT '',
        avatar TEXT NOT NULL DEFAULT '',
        target_position TEXT NOT NULL DEFAULT '',
        target_industry TEXT NOT NULL DEFAULT '',
        graduation_year TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        data TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'draft',
        score INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS diagnosis_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        position_id TEXT NOT NULL,
        position_name TEXT NOT NULL,
        type TEXT NOT NULL,
        scores TEXT NOT NULL DEFAULT '{}',
        results TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS learning_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        position_name TEXT NOT NULL,
        recruitment_type TEXT NOT NULL,
        stages TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS learning_task_completions (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        completed_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (plan_id) REFERENCES learning_plans(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS quiz_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        user_answer TEXT NOT NULL DEFAULT '[]',
        is_correct INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS interview_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL DEFAULT '',
        dimension TEXT NOT NULL,
        interview_type TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        feedback TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS experiences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        industry TEXT NOT NULL DEFAULT '互联网',
        interview_round TEXT NOT NULL DEFAULT '一面',
        author_nickname TEXT NOT NULL DEFAULT '匿名用户',
        author_avatar TEXT NOT NULL DEFAULT '',
        summary TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        questions TEXT NOT NULL DEFAULT '[]',
        likes INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS experience_comments (
        id TEXT PRIMARY KEY,
        experience_id TEXT NOT NULL,
        author_nickname TEXT NOT NULL DEFAULT '匿名用户',
        author_avatar TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'applied',
        applied_date TEXT NOT NULL DEFAULT (date('now')),
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'other',
        company TEXT NOT NULL DEFAULT '',
        position TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS preset_calendar_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'other',
        date TEXT NOT NULL,
        recruitment_type TEXT NOT NULL DEFAULT 'fall',
        position TEXT NOT NULL DEFAULT '',
        industry TEXT NOT NULL DEFAULT '',
        is_preset INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS learning_materials (
        id TEXT PRIMARY KEY,
        dimension TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'article',
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        industry TEXT NOT NULL,
        category TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'Code2',
        description TEXT NOT NULL DEFAULT '',
        skills TEXT NOT NULL DEFAULT '[]',
        dimensions TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'quiz',
        question_type TEXT NOT NULL DEFAULT 'choice',
        position_id TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        difficulty TEXT NOT NULL DEFAULT 'medium',
        question TEXT NOT NULL,
        options TEXT NOT NULL DEFAULT '[]',
        answer TEXT NOT NULL DEFAULT '[]',
        analysis TEXT NOT NULL DEFAULT '',
        knowledge_point TEXT NOT NULL DEFAULT '',
        dimension TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
      CREATE INDEX IF NOT EXISTS idx_diagnosis_user ON diagnosis_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_learning_plans_user ON learning_plans(user_id);
      CREATE INDEX IF NOT EXISTS idx_task_completions_plan ON learning_task_completions(plan_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_records_user ON quiz_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_interview_records_user ON interview_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_experiences_created ON experiences(created_at);
      CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
    `)

    // 导入职位种子数据
    const existingPositions = db.prepare('SELECT COUNT(*) as cnt FROM positions').get()
    if (existingPositions && Number(existingPositions.cnt) === 0) {
      const insertStmt = 'INSERT OR IGNORE INTO positions (id, name, industry, category, icon, description, skills, dimensions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      for (const group of positionSeedData) {
        for (const cat of group.categories) {
          for (const pos of cat.positions) {
            db.prepare(insertStmt).run(
              pos.id, pos.name, pos.industry, pos.category,
              pos.icon, pos.description,
              JSON.stringify(pos.skills), JSON.stringify(pos.dimensions)
            )
          }
        }
      }
      console.log(`[DB] 已导入职位数据（${positionSeedData.reduce((sum, g) => sum + g.categories.reduce((s, c) => s + c.positions.length, 0), 0)} 条）`)
    }

    // 迁移：为已有数据库添加 interview_round 列（如果不存在）
    try {
      db.exec("ALTER TABLE experiences ADD COLUMN interview_round TEXT NOT NULL DEFAULT '一面'")
    } catch {
      // 列已存在，忽略
    }

    // 导入面经种子数据（使用系统用户，自动补充新增条目）
    const existingExperiences = db.prepare('SELECT COUNT(*) as cnt FROM experiences').get()
    const existingCount = existingExperiences ? Number(existingExperiences.cnt) : 0

    // 确保有系统用户用于种子数据
    const sysUser = db.prepare("SELECT id FROM users WHERE email = 'system@ai-job.local'").get()
    const sysUserId = sysUser ? String(sysUser.id) : (() => {
      const uid = 'sys_user_001'
      db.prepare("INSERT OR IGNORE INTO users (id, email, password_hash, nickname) VALUES (?, ?, ?, ?)")
        .run(uid, 'system@ai-job.local', 'system', '面经知识库')
      return uid
    })()

    const insertExp = 'INSERT OR IGNORE INTO experiences (id, user_id, company, position, industry, interview_round, author_nickname, summary, content, questions, likes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    let importedCount = 0
    for (const exp of experienceSeedData) {
      // 检查是否已存在
      const existing = db.prepare('SELECT id FROM experiences WHERE id = ?').get(exp.id)
      if (existing) continue
      // 生成随机日期（过去 6 个月内）
      const daysAgo = Math.floor(Math.random() * 180) + 1
      const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
      db.prepare(insertExp).run(
        exp.id, sysUserId, exp.company, exp.position, exp.industry,
        exp.interview_round, exp.author_nickname, exp.summary, exp.content,
        JSON.stringify(exp.questions), exp.likes, date
      )
      importedCount++
    }
    if (importedCount > 0) {
      console.log(`[DB] 已导入面经种子数据 ${importedCount} 条（总计 ${existingCount + importedCount} 条）`)
    }

    // 导入题目种子数据（笔试题 + 面试题）
    const existingQuestions = db.prepare('SELECT COUNT(*) as cnt FROM questions').get()
    if (existingQuestions && Number(existingQuestions.cnt) === 0) {
      const insertQ = 'INSERT OR IGNORE INTO questions (id, type, question_type, position_id, category, difficulty, question, options, answer, analysis, knowledge_point, dimension) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'

      // 岗位题库
      for (const [posId, posData] of Object.entries(positionQuizData)) {
        for (const q of posData.questions) {
          db.prepare(insertQ).run(
            q.id, 'quiz', q.type, posId, q.category, q.difficulty,
            q.question, JSON.stringify(q.options), JSON.stringify(q.answer),
            q.analysis, q.knowledgePoint, ''
          )
        }
      }

      // 行测题库
      for (const q of aptitudeQuizData) {
        db.prepare(insertQ).run(
          q.id, 'aptitude', q.type, '', q.category, q.difficulty,
          q.question, JSON.stringify(q.options), JSON.stringify(q.answer),
          q.analysis, q.knowledgePoint, ''
        )
      }

      // 面试题库
      for (const [, questions] of Object.entries(interviewQuestions)) {
        for (const q of questions) {
          db.prepare(insertQ).run(
            q.id, 'interview', 'text', '', q.type, 'medium',
            q.question, '[]', '[]', '', '', q.dimension
          )
        }
      }

      const totalQuiz = Object.values(positionQuizData).reduce((sum, d) => sum + d.questions.length, 0) + aptitudeQuizData.length
      const totalInterview = Object.values(interviewQuestions).reduce((sum, qs) => sum + qs.length, 0)
      console.log(`[DB] 已导入题目种子数据（笔试题 ${totalQuiz} 道 + 面试题 ${totalInterview} 道）`)
    }

    // 导入日历预设事件种子数据
    const existingPresetEvents = db.prepare('SELECT COUNT(*) as cnt FROM preset_calendar_events').get()
    const existingPresetCount = existingPresetEvents ? Number(existingPresetEvents.cnt) : 0
    const insertPreset = 'INSERT OR IGNORE INTO preset_calendar_events (id, title, company, type, date, recruitment_type, position, industry) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    let importedPresetCount = 0
    for (const event of presetCalendarEvents) {
      const existing = db.prepare('SELECT id FROM preset_calendar_events WHERE id = ?').get(event.id)
      if (existing) continue
      db.prepare(insertPreset).run(
        event.id, event.title, event.company, event.type, event.date, event.recruitment_type,
        event.position || '', event.industry || ''
      )
      importedPresetCount++
    }
    if (importedPresetCount > 0) {
      console.log(`[DB] 已导入日历预设事件 ${importedPresetCount} 条（总计 ${existingPresetCount + importedPresetCount} 条）`)
    }

    // 导入学习材料种子数据
    const existingMaterials = db.prepare('SELECT COUNT(*) as cnt FROM learning_materials').get()
    if (existingMaterials && Number(existingMaterials.cnt) === 0) {
      const insertMaterial = 'INSERT OR IGNORE INTO learning_materials (id, dimension, title, type, content) VALUES (?, ?, ?, ?, ?)'
      for (const mat of learningMaterialsSeedData) {
        db.prepare(insertMaterial).run(
          mat.id, mat.dimension, mat.title, mat.type, mat.content
        )
      }
      console.log(`[DB] 已导入学习材料种子数据（${learningMaterialsSeedData.length} 条）`)
    }

    saveToFile()
    console.log('[DB] 数据库表初始化完成')
  }).catch((err) => {
    console.error('[DB] 数据库初始化失败:', err)
    throw err
  })

  return initPromise
}

export default db