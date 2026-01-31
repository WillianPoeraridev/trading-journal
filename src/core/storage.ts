import type { Settings, Trade } from './types'

const SETTINGS_KEY = 'tj_settings_v1'
const TRADES_KEY = 'tj_trades_v1'

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
    return safeParse<Settings>(raw)
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

export function loadTrades(): Trade[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(TRADES_KEY)
    if (!raw) return []
    const parsed = safeParse<Trade[]>(raw)
    return Array.isArray(parsed) ? parsed : []
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

export function resetAll(): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.removeItem(SETTINGS_KEY)
    window.localStorage.removeItem(TRADES_KEY)
  } catch {
    return
  }
}
