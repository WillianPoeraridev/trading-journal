export type RiskType = 'PERCENT' | 'FIXED'
export type ReturnMode = 'ON_STARTING_BALANCE' | 'ON_PREV_BALANCE'
export type ProjectionMethod = 'DETERMINISTIC' | 'MONTE_CARLO'

export interface Settings {
  startingBalance: number
  currency: string
  defaultRiskType: RiskType
  defaultRiskValue: number
  dailyStopR: number
  dailyTakeR: number
  maxTradesPerDay: number
  returnMode: ReturnMode
}

export interface Trade {
  id: string
  date: string
  symbol?: string
  notes?: string
  riskType: RiskType
  riskValue: number
  rMultiple: number
}

export interface LedgerRow {
  index: number
  tradeId: string
  date: string
  balanceBefore: number
  riskAmount: number
  pnl: number
  balanceAfter: number
  returnPct: number
  rMultiple: number
}

export interface Metrics {
  trades: number
  totalWins: number
  totalLosses: number
  totalBE: number
  winRatePct: number
  avgWinR: number
  avgLossR: number
  expectancyR: number
  netPnl: number
  netReturnPct: number
  profitFactor: number
  maxDrawdownPct: number
}

export interface ProjectionSettings {
  horizonDays: number
  simulations: number
  method: ProjectionMethod
}

export interface MonteCarloBands {
  p10: number[]
  p50: number[]
  p90: number[]
}

export interface ProjectionResultSummary {
  startBalance: number
  endBalanceP50: number
  endBalanceP10: number
  endBalanceP90: number
}

export interface ProjectionResult {
  method: ProjectionMethod
  horizonDays: number
  deterministicPath?: number[]
  monteCarlo?: MonteCarloBands
  summary: ProjectionResultSummary
}
