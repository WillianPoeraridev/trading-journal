import type { Settings, Trade } from './types'

const SETTINGS_KEY = 'tj_settings_v1'
const TRADES_KEY = 'tj_trades_v1'
const UI_LAST_SYMBOL_PREFIX = 'tj_ui_last_symbol_'

const safeParse = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const safeStringify = (value: unknown): string | null => {
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

const canUseStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

export function loadSettings(): Settings | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return null
    const parsed = safeParse<Settings>(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const normalized = parsed as Settings & {
      btStartingBalance?: number
      periodFilter?: Settings['periodFilter']
    }
    if (normalized.btStartingBalance == null) {
      normalized.btStartingBalance = normalized.startingBalance
    }
    if (!normalized.periodFilter || !normalized.periodFilter.preset) {
      normalized.periodFilter = { preset: 'ALL' }
    }
    return normalized
  } catch {
    return null
  }
}

export function saveSettings(settings: Settings): void {
  if (!canUseStorage()) return
  try {
    const payload = safeStringify(settings)
    if (!payload) return
    window.localStorage.setItem(SETTINGS_KEY, payload)
  } catch {
    return
  }
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const todayISO = (): string => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const normalizeTrade = (value: unknown): Trade | null => {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>

  const rawId = item.id ?? item.tradeId
  const id =
    typeof rawId === 'string'
      ? rawId
      : typeof rawId === 'number'
        ? String(rawId)
        : ''
  const date = typeof item.date === 'string' ? item.date : todayISO()

  const riskType = item.riskType === 'FIXED' ? 'FIXED' : 'PERCENT'
  const riskValue = toNumber(item.riskValue ?? item.risk ?? 0, 0)

  const resultTypeRaw = item.resultType ?? item.resultMode ?? item.pnlUnit
  const resultType = resultTypeRaw === 'R' ? 'R' : 'MONEY'
  const resultValue = toNumber(item.resultValue ?? item.pnl ?? item.result ?? 0, 0)

  const createdAt = toNumber(item.createdAt ?? item.timestamp ?? Date.now(), Date.now())

  const accountRaw = item.account ?? item.tradeAccount ?? item.book
  const account = accountRaw === 'BT' ? 'BT' : 'REAL'

  const symbol =
    typeof item.symbol === 'string' && item.symbol.trim() !== ''
      ? item.symbol
      : undefined
  const notes =
    typeof item.notes === 'string' && item.notes.trim() !== ''
      ? item.notes
      : undefined

  if (!id) {
    return null
  }

  return {
    id,
    date,
    symbol,
    notes,
    riskType,
    riskValue,
    account,
    resultType,
    resultValue,
    createdAt,
  }
}

export function loadTrades(): Trade[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(TRADES_KEY)
    if (!raw) return []
    const parsed = safeParse<unknown>(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeTrade).filter((trade): trade is Trade => !!trade)
  } catch {
    return []
  }
}

export function saveTrades(trades: Trade[]): void {
  if (!canUseStorage()) return
  try {
    const payload = safeStringify(trades)
    if (!payload) return
    window.localStorage.setItem(TRADES_KEY, payload)
  } catch {
    return
  }
}

export function updateTrade(
  trades: Trade[],
  tradeId: string,
  patch: Partial<Trade>,
): Trade[] {
  const next = trades.map((trade) =>
    trade.id === tradeId ? { ...trade, ...patch, id: trade.id } : trade,
  )
  saveTrades(next)
  return next
}

export function clearTradesByAccount(
  trades: Trade[],
  account: Trade['account'],
): Trade[] {
  const next = trades.filter((trade) => trade.account !== account)
  saveTrades(next)
  return next
}

export function clearAllTrades(): Trade[] {
  saveTrades([])
  return []
}

export function resetAll(): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.removeItem(SETTINGS_KEY)
    window.localStorage.removeItem(TRADES_KEY)
  } catch {
    return
  }
}

export function loadLastSymbol(account: Trade['account']): string | undefined {
  if (!canUseStorage()) return undefined
  try {
    const value = window.localStorage.getItem(`${UI_LAST_SYMBOL_PREFIX}${account}`)
    return value === null ? undefined : value
  } catch {
    return undefined
  }
}

export function saveLastSymbol(account: Trade['account'], symbol: string): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(`${UI_LAST_SYMBOL_PREFIX}${account}`, symbol)
  } catch {
    return
  }
}
