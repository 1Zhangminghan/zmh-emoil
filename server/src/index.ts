import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import { initDatabase } from './db'
import authRoutes from './routes/auth'
import profileRoutes from './routes/profile'
import resumeRoutes from './routes/resume'
import diagnosisRoutes from './routes/diagnosis'
import learningRoutes from './routes/learning'
import quizRoutes from './routes/quiz'
import interviewRoutes from './routes/interview'
import experienceRoutes from './routes/experience'
import applicationRoutes from './routes/application'
import positionRoutes from './routes/positions'
import calendarRoutes from './routes/calendar'
import aiRoutes from './routes/ai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

// CORS
const allowedOrigins = isProduction
  ? true // 生产环境允许所有来源（或替换为具体域名）
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178']
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '10mb' }))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/diagnosis', diagnosisRoutes)
app.use('/api/learning', learningRoutes)
app.use('/api/quiz', quizRoutes)
app.use('/api/interview', interviewRoutes)
app.use('/api/experiences', experienceRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/positions', positionRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/ai', aiRoutes)

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// AI 配置状态检查（前端根据此接口判断是否使用真实 AI）
app.get('/api/ai/status', async (_req, res) => {
  const baseUrl = process.env.AI_API_BASE_URL || ''
  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
  const hasApiKey = !!process.env.AI_API_KEY

  let configured = hasApiKey || isLocal
  let provider = '未配置（使用本地规则引擎）'

  if (isLocal) {
    // 检测 Ollama 是否在运行
    try {
      const ollamaRes = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) })
      if (ollamaRes.ok) {
        const models = (await ollamaRes.json()) as { models?: Array<{ name: string }> }
        const modelList = models.models?.map((m: { name: string }) => m.name).join(', ') || '未知'
        provider = `本地模型 (Ollama) - 已加载: ${modelList}`
      } else {
        configured = false
        provider = 'Ollama 未运行，请先启动 Ollama 服务'
      }
    } catch {
      configured = false
      provider = 'Ollama 未运行，请先启动 Ollama 并拉取模型'
    }
  } else if (hasApiKey) {
    provider = '云端 API 已配置'
  }

  res.json({
    configured,
    model: process.env.AI_MODEL || 'qwen3:8b',
    provider,
    isLocal,
  })
})

// 生产环境：托管前端静态文件
if (isProduction) {
  const publicPath = path.join(__dirname, '..', 'public')
  app.use(express.static(publicPath))

  // SPA 回退：所有非 API 请求返回 index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'))
  })
  console.log(`[Server] 生产模式：托管静态文件 ${publicPath}`)
}

// 全局错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] 未捕获错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

// 初始化数据库并启动服务
initDatabase().then(() => {
  console.log('[Server] 数据库初始化完成')

  app.listen(PORT, () => {
    console.log(`[Server] AI求职辅导后端服务已启动: http://localhost:${PORT}`)
  })
}).catch((err) => {
  console.error('[Server] 数据库初始化失败，服务仍将启动:', err.message)
  app.listen(PORT, () => {
    console.log(`[Server] AI求职辅导后端服务已启动（无数据库）: http://localhost:${PORT}`)
  })
})

export default app