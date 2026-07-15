// ============ 真实 AI 客户端 ============
// 支持 OpenAI 兼容 API（DeepSeek / 通义千问 / 豆包 / ChatGPT / Ollama 等）
// API Key 优先级：用户自定义 Key > 环境变量 AI_API_KEY
// 支持本地 Ollama 模式（无需 API Key，自动检测 localhost）
// 都未配置时自动降级为本地规则引擎

const DEFAULT_API_KEY = process.env.AI_API_KEY || ''
const DEFAULT_API_BASE_URL = process.env.AI_API_BASE_URL || 'http://localhost:11434/v1'
const DEFAULT_MODEL = process.env.AI_MODEL || 'qwen3:8b'

// 记录最近一次 AI 调用失败的原因
let lastAIError = ''
export function getLastAIError(): string { return lastAIError }
export function clearLastAIError(): void { lastAIError = '' }

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export interface AIClientOptions {
  apiKey?: string
  baseUrl?: string
  model?: string
}

function resolveOptions(opts?: AIClientOptions) {
  return {
    apiKey: opts?.apiKey || DEFAULT_API_KEY,
    baseUrl: opts?.baseUrl || DEFAULT_API_BASE_URL,
    model: opts?.model || DEFAULT_MODEL,
  }
}

/** 检测是否为本地模型（Ollama 等），本地模型无需 API Key */
function isLocalProvider(baseUrl: string): boolean {
  return baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('host.docker.internal')
}

/**
 * 检查 AI 是否可用
 * - 云端 API：需要有效的 API Key
 * - 本地模型（Ollama）：无需 API Key，只要 baseUrl 指向 localhost 即可
 */
export function isAIConfigured(opts?: AIClientOptions): boolean {
  const { apiKey, baseUrl } = resolveOptions(opts)
  return !!apiKey || isLocalProvider(baseUrl)
}

/**
 * 调用 AI Chat API
 */
export async function chat(
  messages: ChatMessage[],
  options?: AIClientOptions & { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): Promise<string | null> {
  const { apiKey, baseUrl, model } = resolveOptions(options)
  const isLocal = isLocalProvider(baseUrl)
  if (!apiKey && !isLocal) {
    const msg = '未配置 AI（无 API Key 且非本地模型）'
    console.log(`[AI] ${msg}，跳过调用`)
    lastAIError = msg
    return null
  }

  try {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    }

    if (options?.jsonMode) {
      body.response_format = { type: 'json_object' }
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!isLocal) {
      headers.Authorization = `Bearer ${apiKey}`
    }

    console.log(`[AI] 调用 ${model} (${baseUrl})...`)
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      // 尝试解析 API 返回的错误信息
      let errMsg = `${res.status} ${res.statusText}`
      try {
        const errJson = JSON.parse(errText)
        if (errJson.message) errMsg = errJson.message
        else if (errJson.error?.message) errMsg = errJson.error.message
      } catch { /* 使用原始错误 */ }
      console.error(`[AI] API 调用失败: ${errMsg}`, errText.slice(0, 200))
      lastAIError = errMsg
      return null
    }

    const data = (await res.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content || null
    if (!content) {
      console.error('[AI] API 返回空内容，完整响应:', JSON.stringify(data).slice(0, 500))
      lastAIError = 'AI 模型返回空内容，请稍后重试'
      return null
    }
    console.log(`[AI] 调用成功，响应长度: ${content?.length || 0}`)
    lastAIError = ''
    return content
  } catch (err: any) {
    const rawMsg = err.message || String(err)
    // 为常见错误提供更友好的提示
    let msg = rawMsg
    if (rawMsg.includes('fetch failed') || rawMsg.includes('ECONNREFUSED')) {
      msg = isLocal ? `无法连接本地 Ollama（${baseUrl}），请确保 Ollama 已安装并运行（ollama serve）` : `无法连接 AI 服务（${baseUrl}），请检查网络和 API 配置`
    } else if (rawMsg.includes('timeout') || rawMsg.includes('abort')) {
      msg = `AI 服务响应超时（${baseUrl}），请检查网络或稍后重试`
    }
    console.error('[AI] API 调用异常:', msg)
    lastAIError = msg
    return null
  }
}

/**
 * 调用 AI 并解析 JSON 返回
 */
export async function chatJSON<T>(
  messages: ChatMessage[],
  options?: AIClientOptions & { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): Promise<T | null> {
  // 先尝试 jsonMode（默认关闭，因为 DeepSeek 等模型在 jsonMode 下可能返回格式问题）
  const text = await chat(messages, { ...options, jsonMode: options?.jsonMode === true })
  if (!text) return null

  const trimmed = text.trim()

  // 1. 直接解析（最简单的情况）
  try {
    return JSON.parse(trimmed) as T
  } catch { /* 继续尝试 */ }

  // 2. 提取 markdown 代码块中的 JSON（支持多个代码块，取最后一个）
  const codeBlockMatch = trimmed.match(/```(?:\w+)?\s*\n?([\s\S]*?)```/g)
  if (codeBlockMatch) {
    // 从最后一个代码块开始尝试（通常最后一个才是 JSON 结果）
    for (let i = codeBlockMatch.length - 1; i >= 0; i--) {
      const inner = codeBlockMatch[i].replace(/```(?:\w+)?\s*\n?|\s*```/g, '').trim()
      try { return JSON.parse(inner) as T } catch { /* 继续下一个 */ }
    }
  }

  // 3. 提取第一个 { 到最后一个 } 之间的内容
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T
    } catch { /* 继续 */ }
  }

  // 4. 提取第一个 [ 到最后一个 ] 之间的内容
  const firstBracket = trimmed.indexOf('[')
  const lastBracket = trimmed.lastIndexOf(']')
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    try {
      return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1)) as T
    } catch { /* 继续 */ }
  }

  // 5. 尝试修复常见 JSON 问题后重新解析
  // 5a. 修复未转义的控制字符
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    let jsonStr = trimmed.slice(firstBrace, lastBrace + 1)
    jsonStr = jsonStr.replace(/[\x00-\x1f\x7f]/g, (c) => {
      if (c === '\n') return '\\n'
      if (c === '\r') return '\\r'
      if (c === '\t') return '\\t'
      return ''
    })
    try { return JSON.parse(jsonStr) as T } catch { /* 继续 */ }
  }

  // 5b. 尝试修复尾部多余逗号（常见 AI 输出问题）
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    let jsonStr = trimmed.slice(firstBrace, lastBrace + 1)
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')
    try { return JSON.parse(jsonStr) as T } catch { /* 继续 */ }
  }

  // 5c. 尝试修复未加引号的 key
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    let jsonStr = trimmed.slice(firstBrace, lastBrace + 1)
    jsonStr = jsonStr.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    try { return JSON.parse(jsonStr) as T } catch { /* 继续 */ }
  }

  console.error('[AI] JSON 解析失败，原始响应前300字符:', trimmed.slice(0, 300))
  console.error('[AI] JSON 解析失败，原始响应后300字符:', trimmed.slice(-300))
  lastAIError = `AI 返回了非 JSON 格式的内容（长度 ${trimmed.length}），请重试`
  return null
}