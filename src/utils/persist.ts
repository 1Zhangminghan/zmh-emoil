// ============ localStorage 持久化工具 ============

const STORAGE_PREFIX = 'ai_job_'

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage 满了或不可用，静默失败
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    // 静默失败
  }
}

// Set 类型的序列化/反序列化
export function loadSetFromStorage(key: string): Set<string> {
  const arr = loadFromStorage<string[]>(key, [])
  return new Set(arr)
}

export function saveSetToStorage(key: string, set: Set<string>): void {
  saveToStorage(key, Array.from(set))
}