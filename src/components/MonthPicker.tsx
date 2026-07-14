import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthPickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowPresent?: boolean
}

const MONTHS = [
  '01', '02', '03', '04', '05', '06',
  '07', '08', '09', '10', '11', '12',
]

const MONTH_LABELS: Record<string, string> = {
  '01': '1月', '02': '2月', '03': '3月', '04': '4月',
  '05': '5月', '06': '6月', '07': '7月', '08': '8月',
  '09': '9月', '10': '10月', '11': '11月', '12': '12月',
}

const currentYear = new Date().getFullYear()

export default function MonthPicker({ value, onChange, placeholder, allowPresent }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (value && value !== '至今') {
      const y = parseInt(value.split('-')[0], 10)
      return y >= currentYear - 12 && y <= currentYear + 4 ? value.split('-')[0] : String(currentYear)
    }
    return String(currentYear)
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const displayText = value === '至今'
    ? '至今'
    : value
      ? `${value.split('-')[0]}年${MONTH_LABELS[value.split('-')[1]] || value.split('-')[1] + '月'}`
      : placeholder || '请选择'

  const handleSelect = (year: string, month: string) => {
    onChange(`${year}-${month}`)
    setOpen(false)
  }

  const handlePresent = () => {
    onChange('至今')
    setOpen(false)
  }

  const prevYear = () => {
    const y = parseInt(viewYear, 10)
    if (y > currentYear - 12) setViewYear(String(y - 1))
  }

  const nextYear = () => {
    const y = parseInt(viewYear, 10)
    if (y < currentYear + 4) setViewYear(String(y + 1))
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200
          ${value
            ? 'bg-surface-hover text-white border border-surface-border/50'
            : 'bg-surface-hover text-slate-400 border border-surface-border/30'
          }
          hover:border-primary-500/40 focus:outline-none focus:ring-1 focus:ring-primary-500/30`}
      >
        <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="flex-1 truncate">{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-surface-card border border-surface-border/40 rounded-xl shadow-2xl shadow-black/30 p-3">
          {/* 年份导航 */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevYear}
              className="p-1 rounded-lg hover:bg-surface-hover text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white font-semibold text-sm">{viewYear}年</span>
            <button
              type="button"
              onClick={nextYear}
              className="p-1 rounded-lg hover:bg-surface-hover text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 月份网格 */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS.map((month) => {
              const isSelected = value === `${viewYear}-${month}`
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleSelect(viewYear, month)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-surface-hover hover:text-white'
                  }`}
                >
                  {MONTH_LABELS[month]}
                </button>
              )
            })}
          </div>

          {/* 至今按钮 */}
          {allowPresent && (
            <div className="mt-3 pt-3 border-t border-surface-border/20">
              <button
                type="button"
                onClick={handlePresent}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  value === '至今'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-surface-hover hover:text-white'
                }`}
              >
                至今
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}