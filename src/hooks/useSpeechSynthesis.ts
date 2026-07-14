import { useState, useRef, useCallback } from 'react'

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void
  stop: () => void
  isSpeaking: boolean
  isSupported: boolean
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return

      // 停止当前朗读
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 0.9 // 稍慢，面试场景更清晰
      utterance.pitch = 1.0

      // 选择合适的语音
      const voices = window.speechSynthesis.getVoices()
      const zhVoice = voices.find(
        (v) => v.lang.startsWith('zh-CN') || v.lang.startsWith('zh-TW')
      )
      if (zhVoice) {
        utterance.voice = zhVoice
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isSupported],
  )

  return { speak, stop, isSpeaking, isSupported }
}