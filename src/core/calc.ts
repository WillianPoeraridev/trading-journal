import type {
  LedgerRow,
  Metrics,
  Settings,
  Trade,
} from './types'

export function clampNumber(n: number, min: number, max: number): number {
  if (min > max) {
    return clampNumber(n, max, min)
  }
  if (n < min) return min
  if (n > max) return max
  return n
}

const roundTo2 = (value: number): number => Math.round(value * 100) / 100

const safeDivide = (numerator: number, denominator: number): number => {
  if (denominator === 0) return 0
  return numerator / denominator
}

const mean = (values: number[]): number => {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, value) => acc + value, 0)
  return sum / values.length
}

export function riskAmount(
  balanceBefore: number,
  trade: Trade,
  settings: Settings,
): number {
  let amount = 0
  if (trade.riskType === 'PERCENT') {
    amount = balanceBefore * (trade.riskValue / 100)
  } else {
    amount = trade.riskValue
  }

  const nonNegative = Math.max(0, amount)
  return roundTo2(nonNegative)
}

export function buildLedger(trades: Trade[], settings: Settings): LedgerRow[] {
  const ordered = trades
    .map((trade, index) => ({ trade, index }))
    .sort((a, b) => {
      if (a.trade.date === b.trade.date) return a.index - b.index
      return a.trade.date < b.trade.date ? -1 : 1
    })

  const ledger: LedgerRow[] = []
  let balance = settings.startingBalance

  for (let i = 0; i < ordered.length; i += 1) {
    const { trade } = ordered[i]
    const balanceBefore = balance
    const risk = riskAmount(balanceBefore, trade, settings)
    const pnl = risk * trade.rMultiple
    const balanceAfter = balanceBefore + pnl
    const returnBase =
      settings.returnMode === 'ON_STARTING_BALANCE'
        ? settings.startingBalance
        : balanceBefore
    const returnPct = safeDivide(pnl, returnBase) * 100

    ledger.push({
      index: i + 1,
      tradeId: trade.id,
      date: trade.date,
      balanceBefore,
      riskAmount: risk,
      pnl,
      balanceAfter,
      returnPct,
      rMultiple: trade.rMultiple,
    })

    balance = balanceAfter
  }

  return ledger
}

export function calculateMetrics(
  trades: Trade[],
  ledger: LedgerRow[],
  settings: Settings,
): Metrics {
  const wins = trades.filter((trade) => trade.rMultiple > 0)
  const losses = trades.filter((trade) => trade.rMultiple < 0)
  const bes = trades.filter((trade) => trade.rMultiple === 0)

  const winCount = wins.length
  const lossCount = losses.length
  const beCount = bes.length
  const decisive = winCount + lossCount

  const winRatePct = decisive === 0 ? 0 : (winCount / decisive) * 100
  const avgWinR = mean(wins.map((trade) => trade.rMultiple))
  const avgLossR = mean(losses.map((trade) => trade.rMultiple))

  const pWin = decisive === 0 ? 0 : winCount / decisive
  const pLoss = decisive === 0 ? 0 : lossCount / decisive
  const expectancyR = pWin * avgWinR + pLoss * avgLossR

  const lastBalance =
    ledger.length === 0
      ? settings.startingBalance
      : ledger[ledger.length - 1].balanceAfter
  const netPnl = lastBalance - settings.startingBalance
  const netReturnPct = safeDivide(netPnl, settings.startingBalance) * 100

  const grossProfit = ledger
    .filter((row) => row.pnl > 0)
    .reduce((acc, row) => acc + row.pnl, 0)
  const grossLossAbs = Math.abs(
    ledger
      .filter((row) => row.pnl < 0)
      .reduce((acc, row) => acc + row.pnl, 0),
  )
  const profitFactor =
    grossLossAbs === 0 ? Number.POSITIVE_INFINITY : grossProfit / grossLossAbs

  let peak = settings.startingBalance
  let maxDrawdownPct = 0
  for (const row of ledger) {
    if (row.balanceAfter > peak) {
      peak = row.balanceAfter
    }
    if (peak > 0) {
      const drawdownPct = ((row.balanceAfter - peak) / peak) * 100
      if (drawdownPct < maxDrawdownPct) {
        maxDrawdownPct = drawdownPct
      }
    }
  }

  return {
    trades: trades.length,
    totalWins: winCount,
    totalLosses: lossCount,
    totalBE: beCount,
    winRatePct,
    avgWinR,
    avgLossR,
    expectancyR,
    netPnl,
    netReturnPct,
    profitFactor,
    maxDrawdownPct: Math.abs(maxDrawdownPct),
  }
}

export function groupTradesByDay(trades: Trade[]): Map<string, Trade[]> {
  const grouped = new Map<string, Trade[]>()
  for (const trade of trades) {
    const date = trade.date
    const bucket = grouped.get(date)
    if (bucket) {
      bucket.push(trade)
    } else {
      grouped.set(date, [trade])
    }
  }
  return grouped
}

export function validateDayRules(
  trades: Trade[],
  settings: Settings,
): { ok: boolean; warnings: string[] } {
  const warnings: string[] = []
  const grouped = groupTradesByDay(trades)

  for (const [date, dayTrades] of grouped.entries()) {
    if (dayTrades.length > settings.maxTradesPerDay) {
      warnings.push(
        `Dia ${date} excede o maximo de ${settings.maxTradesPerDay} trades (${dayTrades.length}).`,
      )
    }
  }

  return { ok: warnings.length === 0, warnings }
}
