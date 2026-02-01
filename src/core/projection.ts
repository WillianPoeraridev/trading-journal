import type {
  ProjectionResult,
  ProjectionSettings,
  Settings,
  Trade,
} from './types'
import { buildLedger, riskAmount } from './calc'
import { roundTo } from './format'

type DerivedStats = {
  winRate: number
  avgWinR: number
  avgLossR: number
  expectancyR: number
  distribution: number[]
}

const DEFAULT_STATS: Omit<DerivedStats, 'distribution'> = {
  winRate: 0.5,
  avgWinR: 2,
  avgLossR: -1,
  expectancyR: 0.5 * 2 + 0.5 * -1,
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const mean = (values: number[]): number => {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, value) => acc + value, 0)
  return sum / values.length
}

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = clamp((sorted.length - 1) * p, 0, sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  const weight = idx - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

const sample = (values: number[]): number => {
  if (values.length === 0) return 0
  const index = Math.floor(Math.random() * values.length)
  return values[index]
}

const getStartBalance = (trades: Trade[], settings: Settings): number => {
  const ledger = buildLedger(trades, settings)
  if (ledger.length === 0) return roundTo(settings.startingBalance, 2)
  return roundTo(ledger[ledger.length - 1].balanceAfter, 2)
}

export function deriveStatsFromTrades(
  trades: Trade[],
  settings: Settings,
): DerivedStats {
  const ledger = buildLedger(trades, settings)
  const rAll = ledger.map((row) => row.rMultiple)

  if (rAll.length < 3) {
    return {
      ...DEFAULT_STATS,
      distribution: rAll,
    }
  }

  const wins = rAll.filter((r) => r > 0)
  const losses = rAll.filter((r) => r < 0)
  const decisive = wins.length + losses.length

  const winRate = decisive === 0 ? DEFAULT_STATS.winRate : wins.length / decisive
  const avgWinR = wins.length === 0 ? DEFAULT_STATS.avgWinR : mean(wins)
  const avgLossR = losses.length === 0 ? DEFAULT_STATS.avgLossR : mean(losses)

  const pWin = decisive === 0 ? 0 : wins.length / decisive
  const pLoss = decisive === 0 ? 0 : losses.length / decisive
  const expectancyR =
    decisive === 0
      ? DEFAULT_STATS.expectancyR
      : pWin * avgWinR + pLoss * avgLossR

  return {
    winRate,
    avgWinR,
    avgLossR,
    expectancyR,
    distribution: rAll,
  }
}

export function projectDeterministic(
  trades: Trade[],
  settings: Settings,
  projectionSettings: ProjectionSettings,
): number[] {
  const stats = deriveStatsFromTrades(trades, settings)
  const horizonDays = Math.max(0, projectionSettings.horizonDays)
  const path: number[] = []

  let balance = getStartBalance(trades, settings)
  path.push(roundTo(balance, 2))

  for (let day = 1; day <= horizonDays; day += 1) {
    const risk = riskAmount(
      balance,
      {
        riskType: settings.defaultRiskType,
        riskValue: settings.defaultRiskValue,
      },
      settings,
    )
    const pnl = risk * stats.expectancyR
    balance = roundTo(balance + pnl, 2)
    path.push(balance)
  }

  return path
}

export function projectMonteCarlo(
  trades: Trade[],
  settings: Settings,
  projectionSettings: ProjectionSettings,
): { p10: number[]; p50: number[]; p90: number[] } {
  const stats = deriveStatsFromTrades(trades, settings)
  const distribution =
    stats.distribution.length > 0
      ? stats.distribution
      : [stats.avgWinR, stats.avgLossR]

  const horizonDays = Math.max(0, projectionSettings.horizonDays)
  const simulations = Math.max(1, projectionSettings.simulations)
  const paths: number[][] = []

  for (let sim = 0; sim < simulations; sim += 1) {
    let balance = getStartBalance(trades, settings)
    const path: number[] = [roundTo(balance, 2)]

    for (let day = 1; day <= horizonDays; day += 1) {
      let dayR = 0
      const maxTrades = Math.max(1, settings.maxTradesPerDay)

      for (let t = 0; t < maxTrades; t += 1) {
        const rMultiple = sample(distribution)
        const risk = riskAmount(
          balance,
          {
            riskType: settings.defaultRiskType,
            riskValue: settings.defaultRiskValue,
          },
          settings,
        )
        const pnl = risk * rMultiple
        balance = roundTo(balance + pnl, 2)
        dayR += rMultiple

        if (dayR >= settings.dailyTakeR || dayR <= settings.dailyStopR) {
          break
        }
      }

      path.push(roundTo(balance, 2))
    }

    paths.push(path)
  }

  const p10: number[] = []
  const p50: number[] = []
  const p90: number[] = []

  for (let day = 0; day <= horizonDays; day += 1) {
    const dayBalances = paths.map((path) => path[day] ?? path[path.length - 1])
    p10.push(roundTo(percentile(dayBalances, 0.1), 2))
    p50.push(roundTo(percentile(dayBalances, 0.5), 2))
    p90.push(roundTo(percentile(dayBalances, 0.9), 2))
  }

  return { p10, p50, p90 }
}

export function project(
  trades: Trade[],
  settings: Settings,
  projectionSettings: ProjectionSettings,
): ProjectionResult {
  const startBalance = roundTo(getStartBalance(trades, settings), 2)
  const horizonDays = Math.max(0, projectionSettings.horizonDays)

  if (projectionSettings.method === 'DETERMINISTIC') {
    const deterministicPath = projectDeterministic(
      trades,
      settings,
      projectionSettings,
    )
    const endBalance =
      deterministicPath[deterministicPath.length - 1] ?? startBalance

    return {
      method: projectionSettings.method,
      horizonDays,
      deterministicPath,
      summary: {
        startBalance: roundTo(startBalance, 2),
        endBalanceP50: roundTo(endBalance, 2),
        endBalanceP10: roundTo(endBalance, 2),
        endBalanceP90: roundTo(endBalance, 2),
      },
    }
  }

  const monteCarlo = projectMonteCarlo(trades, settings, projectionSettings)
  const endBalanceP10 =
    monteCarlo.p10[monteCarlo.p10.length - 1] ?? startBalance
  const endBalanceP50 =
    monteCarlo.p50[monteCarlo.p50.length - 1] ?? startBalance
  const endBalanceP90 =
    monteCarlo.p90[monteCarlo.p90.length - 1] ?? startBalance

  return {
    method: projectionSettings.method,
    horizonDays,
    monteCarlo,
    summary: {
      startBalance: roundTo(startBalance, 2),
      endBalanceP50: roundTo(endBalanceP50, 2),
      endBalanceP10: roundTo(endBalanceP10, 2),
      endBalanceP90: roundTo(endBalanceP90, 2),
    },
  }
}
