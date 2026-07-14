import { create } from 'zustand'
import { loadSetFromStorage, saveSetToStorage, loadFromStorage, saveToStorage } from '@/utils/persist'
import { quizApi } from '@/api'

const STORAGE_KEYS = {
  wrongBook: 'quiz_wrongBook',
  favorites: 'quiz_favorites',
  answerHistory: 'quiz_answerHistory',
}

interface QuizStats {
  totalAnswered: number
  correctCount: number
  wrongQuestionIds: string[]
  favoriteQuestionIds: string[]
}

interface QuizState {
  wrongBook: Set<string>
  favorites: Set<string>
  answerHistory: Record<string, number[]>
  stats: QuizStats | null
  statsLoading: boolean

  toggleWrong: (questionId: string) => void
  toggleFavorite: (questionId: string) => void
  isWrong: (questionId: string) => boolean
  isFavorite: (questionId: string) => boolean
  recordAnswer: (questionId: string, answers: number[], isCorrect: boolean) => Promise<string | null>
  getAnswer: (questionId: string) => number[] | undefined
  loadStats: () => Promise<void>
  syncFromServer: () => Promise<void>
}

export const useQuizStore = create<QuizState>((set, get) => ({
  wrongBook: loadSetFromStorage(STORAGE_KEYS.wrongBook),
  favorites: loadSetFromStorage(STORAGE_KEYS.favorites),
  answerHistory: loadFromStorage<Record<string, number[]>>(STORAGE_KEYS.answerHistory, {}),
  stats: null,
  statsLoading: false,

  toggleWrong: (questionId) =>
    set((state) => {
      const next = new Set(state.wrongBook)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      saveSetToStorage(STORAGE_KEYS.wrongBook, next)
      return { wrongBook: next }
    }),

  toggleFavorite: (questionId) =>
    set((state) => {
      const next = new Set(state.favorites)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      saveSetToStorage(STORAGE_KEYS.favorites, next)
      return { favorites: next }
    }),

  isWrong: (questionId) => get().wrongBook.has(questionId),
  isFavorite: (questionId) => get().favorites.has(questionId),

  recordAnswer: async (questionId, answers, isCorrect) => {
    // 本地存储
    set((state) => {
      const next = { ...state.answerHistory, [questionId]: answers }
      saveToStorage(STORAGE_KEYS.answerHistory, next)
      return { answerHistory: next }
    })

    // 同步到后端
    try {
      const result = await quizApi.submitAnswer({
        questionId,
        userAnswer: answers,
        isCorrect,
      })
      return result.analysis || null
    } catch {
      return null
    }
  },

  getAnswer: (questionId) => get().answerHistory[questionId],

  loadStats: async () => {
    set({ statsLoading: true })
    try {
      const stats = await quizApi.getStats()
      set({ stats, statsLoading: false })
    } catch {
      set({ statsLoading: false })
    }
  },

  syncFromServer: async () => {
    try {
      const stats = await quizApi.getStats()
      if (stats) {
        // 同步错题本
        const wrongSet = new Set(stats.wrongQuestionIds)
        saveSetToStorage(STORAGE_KEYS.wrongBook, wrongSet)

        // 同步收藏
        const favSet = new Set(stats.favoriteQuestionIds)
        saveSetToStorage(STORAGE_KEYS.favorites, favSet)

        set({ wrongBook: wrongSet, favorites: favSet, stats })
      }
    } catch {
      // 后端不可用，使用本地数据
    }
  },
}))