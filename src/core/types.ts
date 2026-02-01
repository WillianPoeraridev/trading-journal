export type RiskType = "PERCENT" | "FIXED";
export type ReturnMode = "ON_STARTING_BALANCE" | "ON_PREV_BALANCE";
export type ResultType = "MONEY" | "R";
export type ProjectionMethod = "DETERMINISTIC" | "MONTE_CARLO" | "DAILY_SIM";
export type TradeAccount = "REAL" | "BT";

export type Settings = {
  startingBalance: number;
  currency: string;

  defaultRiskType: RiskType;
  defaultRiskValue: number;

  dailyStopR: number; // ex: -1
  dailyTakeR: number; // ex: +2
  maxTradesPerDay: number; // 1 padrão, 2 exceção
  returnMode: ReturnMode;
  projectionMethod: "DETERMINISTIC" | "DAILY_SIM";
  btStartingBalance: number;
};

export type Trade = {
  id: string;
  date: string; // YYYY-MM-DD
  symbol?: string;
  notes?: string;

  // risco (pode ser override do default)
  riskType: RiskType;
  riskValue: number;

  account: TradeAccount;

  // resultado lançado pelo usuário (em $ ou em R)
  resultType: ResultType;
  resultValue: number; // se MONEY: pnl em $ (pode ser negativo). se R: múltiplo de R

  createdAt: number; // timestamp para desempate na ordenação
};

export type LedgerRow = {
  index: number; // 1..n
  tradeId: string;
  date: string;

  balanceBefore: number;
  riskAmount: number;

  pnl: number; // sempre em $
  rMultiple: number; // sempre em R

  balanceAfter: number;
  returnPct: number;

  account: TradeAccount;
  symbol?: string;
};

export type Metrics = {
  trades: number;
  totalWins: number;
  totalLosses: number;
  totalBE: number;

  winRatePct: number;

  avgWinR: number;
  avgLossR: number; // negativo
  expectancyR: number;

  netPnl: number;
  netReturnPct: number;

  profitFactor: number | null;
  maxDrawdownPct: number;
};

export type ProjectionSettings = {
  horizonDays: number;
  simulations: number;
  method: ProjectionMethod;
};

export type ProjectionResult = {
  method: ProjectionMethod;
  horizonDays: number;

  deterministicPath: number[];

  monteCarlo?: {
    p10: number[];
    p50: number[];
    p90: number[];
  };

  summary: {
    startBalance: number;
    endBalanceP50: number;
    endBalanceP10: number;
    endBalanceP90: number;
  };
};
