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
