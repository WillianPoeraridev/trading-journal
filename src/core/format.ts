export function roundTo(value: number, decimals = 2): number {
  const safeValue = Number.isFinite(value) ? value : 0
  const safeDecimals = Number.isFinite(decimals) ? Math.max(0, Math.floor(decimals)) : 0
  const factor = 10 ** safeDecimals
  return Math.round(safeValue * factor) / factor
}

const getLocale = (locale?: string): string => {
  try {
    if (locale) return locale
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language
    }
  } catch {
    // ignore
  }
  return 'pt-BR'
}

const formatNumberOrThrow = (
  value: number,
  options: Intl.NumberFormatOptions,
  locale?: string,
): string => {
  const safeValue = Number.isFinite(value) ? value : 0
  const resolvedLocale = getLocale(locale)
  return new Intl.NumberFormat(resolvedLocale, options).format(safeValue)
}

const formatNumber = (
  value: number,
  options: Intl.NumberFormatOptions,
  locale?: string,
): string => {
  const safeValue = Number.isFinite(value) ? value : 0
  try {
    return formatNumberOrThrow(safeValue, options, locale)
  } catch {
    return String(roundTo(safeValue, options.maximumFractionDigits ?? 2))
  }
}

export function formatMoney(
  value: number,
  currency: string,
  locale?: string,
): string {
  try {
    return formatNumberOrThrow(
      value,
      {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      locale,
    )
  } catch {
    return formatNumber(
      value,
      { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 },
      locale,
    )
  }
}

export function formatPct(value: number, decimals = 2, locale?: string): string {
  const formatted = formatNumber(
    value,
    { style: 'decimal', minimumFractionDigits: decimals, maximumFractionDigits: decimals },
    locale,
  )
  return `${formatted}%`
}

export function formatR(value: number, decimals = 2, locale?: string): string {
  const formatted = formatNumber(
    value,
    { style: 'decimal', minimumFractionDigits: decimals, maximumFractionDigits: decimals },
    locale,
  )
  return `${formatted}R`
}

export function stringifyPretty(obj: any, decimals = 2): string {
  try {
    return (
      JSON.stringify(
        obj,
        (_key, value) =>
          typeof value === 'number' ? roundTo(value, decimals) : value,
        2,
      ) ?? ''
    )
  } catch {
    try {
      return String(obj)
    } catch {
      return ''
    }
  }
}

const parseISODate = (dateISO: string): Date | null => {
  if (!dateISO) return null
  const parts = dateISO.split('-').map((part) => Number(part))
  if (parts.length !== 3) return null
  const [year, month, day] = parts
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateBR(dateISO: string): string {
  const date = parseISODate(dateISO)
  if (!date) return dateISO
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = String(date.getFullYear())
  return `${dd}/${mm}/${yyyy}`
}

export function weekdayShort(dateISO: string): string {
  const date = parseISODate(dateISO)
  if (!date) return ''
  try {
    const label = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(
      date,
    )
    const cleaned = label.replace('.', '')
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  } catch {
    return ''
  }
}

export function weekdayLong(dateISO: string): string {
  const date = parseISODate(dateISO)
  if (!date) return ''
  try {
    const label = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(
      date,
    )
    return label.charAt(0).toUpperCase() + label.slice(1)
  } catch {
    return ''
  }
}

export function formatDateWithWeekday(
  dateISO: string,
  mode: 'short' | 'long' = 'short',
): string {
  const dateText = formatDateBR(dateISO)
  const weekday = mode === 'long' ? weekdayLong(dateISO) : weekdayShort(dateISO)
  if (!weekday) return dateText
  return `${dateText} (${weekday})`
}
