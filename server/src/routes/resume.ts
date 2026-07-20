import { Router, Request, Response } from 'express'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import path from 'path'
import db from '../db'
import { analyzeResume, parseResumeText } from '../ai'
import type { AIClientOptions } from '../aiClient'

const router = Router()
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

const JWT_SECRET = process.env.JWT_SECRET || 'ai-job-coach-jwt-secret-change-in-production'

// multer 配置：内存存储，限制 5MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const allowed = ['.pdf', '.docx', '.doc', '.txt']
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件格式：${ext}，请上传 PDF、DOCX 或 TXT 文件`))
    }
  },
})

// 从 JWT Bearer token 中提取 user_id
function getUserId(req: Request): string {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    return payload.userId
  } catch {
    return ''
  }
}

// 从请求头提取 AI 配置（用户自定义 Key 优先，服务端 .env 兜底）
function getAIOptions(req: Request): AIClientOptions {
  return {
    apiKey: (req.headers['x-ai-key'] as string) || process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_API_BASE_URL || (req.headers['x-ai-base-url'] as string) || '',
    model: process.env.AI_MODEL || (req.headers['x-ai-model'] as string) || '',
  }
}

// GET / - 获取当前用户的所有简历
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const rows = db.prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC').all(userId) as Array<Record<string, unknown>>
    const result = rows.map((row) => ({
      ...row,
      data: JSON.parse(String(row.data)),
    }))
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: '获取简历列表失败' })
  }
})

// POST / - 创建新简历（每次创建新记录，支持多份简历）
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { data } = req.body

    if (!data) {
      res.status(400).json({ error: '缺少简历数据' })
      return
    }

    const now = new Date().toISOString()
    const dataStr = JSON.stringify(data)
    const id = genId()

    db.prepare('INSERT INTO resumes (id, user_id, data, status, score, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, userId, dataStr, 'draft', 0, now)

    res.json({ id, message: '简历已创建' })
  } catch (error) {
    res.status(500).json({ error: '保存简历失败' })
  }
})

// PUT /:id - 更新指定简历
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { data } = req.body

    if (!data) {
      res.status(400).json({ error: '缺少简历数据' })
      return
    }

    const existing = db.prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, userId)
    if (!existing) {
      res.status(404).json({ error: '简历不存在' })
      return
    }

    const now = new Date().toISOString()
    const dataStr = JSON.stringify(data)

    db.prepare('UPDATE resumes SET data = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .run(dataStr, now, req.params.id, userId)

    res.json({ id: req.params.id, message: '简历已更新' })
  } catch (error) {
    res.status(500).json({ error: '更新简历失败' })
  }
})

// DELETE /:id - 删除简历
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const existing = db.prepare('SELECT id FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, userId)
    if (!existing) {
      res.status(404).json({ error: '简历不存在' })
      return
    }

    db.prepare('DELETE FROM resumes WHERE id = ? AND user_id = ?').run(req.params.id, userId)
    res.json({ message: '简历已删除' })
  } catch (error) {
    res.status(500).json({ error: '删除简历失败' })
  }
})

// GET /:id - 获取单个简历
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const row = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, userId) as Record<string, unknown> | undefined
    if (!row) {
      res.status(404).json({ error: '简历不存在' })
      return
    }
    res.json({ ...row, data: JSON.parse(String(row.data)) })
  } catch (error) {
    res.status(500).json({ error: '获取简历失败' })
  }
})

// POST /analyze - 分析简历
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { data } = req.body

    if (!data) {
      res.status(400).json({ error: '缺少简历数据' })
      return
    }

    const analysis = await analyzeResume(data, getAIOptions(req))

    // 保存评分到简历记录
    const existing = db.prepare('SELECT id FROM resumes WHERE user_id = ?').get(userId) as { id: string } | undefined
    const now = new Date().toISOString()
    if (existing) {
      db.prepare('UPDATE resumes SET score = ?, updated_at = ? WHERE user_id = ?')
        .run(analysis.overallScore, now, userId)
    }

    res.json(analysis)
  } catch (error) {
    res.status(500).json({ error: '简历分析失败' })
  }
})

// ============ 文件解析辅助函数 ============

// 从 .doc 二进制文件中提取可读文本（简单启发式方法）
function extractTextFromDocBinary(buffer: Buffer): string {
  const result: string[] = []
  let current = ''

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i]
    const nextByte = i + 1 < buffer.length ? buffer[i + 1] : 0

    // 检测中文 UTF-16LE 编码的文本（常见于 .doc 文件）
    if (byte >= 0x20 && byte < 0x7f && nextByte === 0) {
      // ASCII 字符在 UTF-16LE 编码中
      current += String.fromCharCode(byte)
      i++ // 跳过 null 字节
    } else if (byte >= 0x80 && nextByte >= 0x4e) {
      // 可能是中文字符（UTF-16LE）
      const code = (nextByte << 8) | byte
      if (code >= 0x4e00 && code <= 0x9fff) {
        current += String.fromCharCode(code)
        i++ // 跳过下一个字节
      } else if (code >= 0x3000 && code <= 0x303f) {
        // CJK 标点符号
        current += String.fromCharCode(code)
        i++
      } else if (code >= 0xff00 && code <= 0xffef) {
        // 全角字符
        current += String.fromCharCode(code)
        i++
      }
    } else if (byte === 0x0d || byte === 0x0a) {
      // 换行符
      if (current.trim().length > 0) {
        result.push(current.trim())
        current = ''
      }
    }
  }

  if (current.trim().length > 0) {
    result.push(current.trim())
  }

  return result.join('\n')
}

async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase()

  if (ext === '.txt') {
    // 尝试 UTF-8，如果失败则尝试其他编码
    let text = buffer.toString('utf-8')
    // 检测是否为 UTF-16LE（BOM: FF FE）
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
      text = buffer.toString('utf16le')
    } else if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
      // UTF-16BE：交换字节后按 utf16le 读取
      const swapped = Buffer.alloc(buffer.length)
      for (let i = 0; i < buffer.length; i += 2) {
        if (i + 1 < buffer.length) {
          swapped[i] = buffer[i + 1]
          swapped[i + 1] = buffer[i]
        } else {
          swapped[i] = buffer[i]
        }
      }
      text = swapped.toString('utf16le')
    }
    // 统一换行符为 \n
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  }

  if (ext === '.pdf') {
    try {
      const pdfParseModule = await import('pdf-parse')
      const pdfParse = (pdfParseModule as any).default || pdfParseModule
      const data = await pdfParse(buffer)
      return data.text
    } catch (err: any) {
      console.error('[Resume] PDF 解析失败:', err.message)
      throw new Error('PDF 文件解析失败，请确保文件未加密且可读取')
    }
  }

  if (ext === '.docx') {
    try {
      const mammoth = (await import('mammoth')).default
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch (err: any) {
      console.error('[Resume] DOCX 解析失败:', err.message)
      throw new Error('Word 文件解析失败，请确保文件格式正确')
    }
  }

  if (ext === '.doc') {
    // .doc 是旧版 Word 二进制格式，mammoth 不支持
    // 尝试从二进制中提取可读文本
    try {
      const text = extractTextFromDocBinary(buffer)
      if (text && text.trim().length >= 10) {
        return text
      }
    } catch (err: any) {
      console.error('[Resume] DOC 二进制解析失败:', err.message)
    }
    throw new Error('旧版 .doc 格式暂不支持直接解析，请用 Word 将文件另存为 .docx 格式后再上传')
  }

  throw new Error(`不支持的文件格式：${ext}`)
}

// POST /parse/file - 上传文件并 AI 解析简历
router.post('/parse/file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请上传简历文件' })
      return
    }

    const { buffer, originalname } = req.file
    console.log(`[Resume] 收到文件: ${originalname} (${(buffer.length / 1024).toFixed(1)} KB)`)

    // 提取文本
    const text = await extractTextFromBuffer(buffer, originalname)

    if (!text || text.trim().length < 10) {
      res.status(400).json({ error: '无法从文件中提取文本内容，请检查文件是否有效' })
      return
    }

    console.log(`[Resume] 提取文本: ${text.length} 字符`)

    // AI 解析
    const parsed = await parseResumeText(text, getAIOptions(req))

    // 为解析出的条目生成前端需要的 ID
    const result = {
      ...parsed,
      education: parsed.education.map((e, i) => ({ id: `edu_${i + 1}`, ...e })),
      workExperience: parsed.workExperience.map((w, i) => ({ id: `work_${i + 1}`, ...w })),
      projectExperience: parsed.projectExperience.map((p, i) => ({ id: `proj_${i + 1}`, ...p })),
    }

    res.json(result)
  } catch (error: any) {
    console.error('[Resume] 文件解析失败:', error.message)
    res.status(500).json({ error: error.message || '简历文件解析失败' })
  }
})

// POST /parse - 解析简历文本（兼容旧接口）
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text: string }

    if (!text || text.trim().length < 10) {
      res.status(400).json({ error: '简历文本内容过短，无法解析' })
      return
    }

    const parsed = await parseResumeText(text, getAIOptions(req))

    const result = {
      ...parsed,
      education: parsed.education.map((e, i) => ({ id: `edu_${i + 1}`, ...e })),
      workExperience: parsed.workExperience.map((w, i) => ({ id: `work_${i + 1}`, ...w })),
      projectExperience: parsed.projectExperience.map((p, i) => ({ id: `proj_${i + 1}`, ...p })),
    }

    res.json(result)
  } catch (error) {
    console.error('[Resume] 解析失败:', error)
    res.status(500).json({ error: '简历解析失败' })
  }
})

export default router