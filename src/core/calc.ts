import type { LedgerRow, Metrics, Settings, Trade } from "./types";

export function clampNumber(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function safeMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export function riskAmount(
  balanceBefore: number,
  trade: Pick<Trade, "riskType" | "riskValue">,
  _settings: Settings
): number {
  const bal = Number.isFinite(balanceBefore) ? balanceBefore : 0;

  let amt = 0;
  if (trade.riskType === "PERCENT") {
    amt = bal * (trade.riskValue / 100);
  } else {
    amt = trade.riskValue;
  }

  if (!Number.isFinite(amt)) amt = 0;
  amt = Math.max(0, amt);
  return round2(amt);
}

function sortTrades(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return a.id.localeCompare(b.id);
  });
}

export function buildLedger(trades: Trade[], settings: Settings): LedgerRow[] {
  const ordered = sortTrades(trades);
  const rows: LedgerRow[] = [];

  let balance = settings.startingBalance;

  ordered.forEach((t, i) => {
    const balanceBefore = balance;
    const risk = riskAmount(balanceBefore, t, settings);

    // Se o usuário lançou em dinheiro:
    // pnl é o próprio resultValue.
    // rMultiple = pnl / risk
    //
    // Se lançou em R:
    // rMultiple é o resultValue.
    // pnl = risk * rMultiple
    let pnl = 0;
    let rMultiple = 0;

    if (t.resultType === "MONEY") {
      pnl = t.resultValue;
      rMultiple = risk > 0 ? pnl / risk : 0;
    } else {
      rMultiple = t.resultValue;
      pnl = risk * rMultiple;
    }

    if (!Number.isFinite(pnl)) pnl = 0;
    if (!Number.isFinite(rMultiple)) rMultiple = 0;

    pnl = round2(pnl);
    rMultiple = round2(rMultiple);

    const balanceAfter = round2(balanceBefore + pnl);

    let returnPct = 0;
    if (settings.returnMode === "ON_STARTING_BALANCE") {
      returnPct =
        settings.startingBalance !== 0
          ? (pnl / settings.startingBalance) * 100
          : 0;
    } else {
      returnPct = balanceBefore !== 0 ? (pnl / balanceBefore) * 100 : 0;
    }
    returnPct = round2(returnPct);

    rows.push({
      index: i + 1,
      tradeId: t.id,
      date: t.date,
      balanceBefore: round2(balanceBefore),
      riskAmount: risk,
      pnl,
      rMultiple,
      balanceAfter,
      returnPct,
      symbol: t.symbol,
    });

    balance = balanceAfter;
  });

  return rows;
}

export function calculateMetrics(
  trades: Trade[],
  ledger: LedgerRow[],
  settings: Settings
): Metrics {
  const rAll = ledger.map((r) => r.rMultiple);

  const wins = rAll.filter((r) => r > 0);
  const losses = rAll.filter((r) => r < 0);
  const bes = rAll.filter((r) => r === 0);

  const totalWins = wins.length;
  const totalLosses = losses.length;
  const totalBE = bes.length;

  // winrate considerando apenas wins+losses (BE fora do denominador)
  const denom = totalWins + totalLosses;
  const winRatePct = denom > 0 ? round2((totalWins / denom) * 100) : 0;

  const avgWinR = round2(safeMean(wins));
  const avgLossR = round2(safeMean(losses)); // negativo

  const pWin = denom > 0 ? totalWins / denom : 0;
  const pLoss = denom > 0 ? totalLosses / denom : 0;

  const expectancyR = round2(pWin * avgWinR + pLoss * avgLossR);

  const lastBalance =
    ledger.length > 0 ? ledger[ledger.length - 1].balanceAfter : settings.startingBalance;

  const netPnl = round2(lastBalance - settings.startingBalance);
  const netReturnPct =
    settings.startingBalance !== 0
      ? round2((netPnl / settings.startingBalance) * 100)
      : 0;

  const pnlPos = ledger.filter((r) => r.pnl > 0).reduce((acc, r) => acc + r.pnl, 0);
  const pnlNeg = ledger.filter((r) => r.pnl < 0).reduce((acc, r) => acc + r.pnl, 0);

  let profitFactor: number | null = null;
  if (pnlNeg !== 0) {
    profitFactor = round2(pnlPos / Math.abs(pnlNeg));
  } else if (pnlPos > 0 && pnlNeg === 0) {
    // só ganhos, sem perdas
    profitFactor = null; // ou Infinity; prefiro null para não quebrar UI
  }

  // Max drawdown (%) usando curva de saldo
  // Retorna POSITIVO (ex: 12.5 significa -12.5% de DD)
  let peak = settings.startingBalance;
  let maxDd = 0;

  ledger.forEach((row) => {
    const bal = row.balanceAfter;
    if (bal > peak) peak = bal;
    if (peak > 0) {
      const dd = ((peak - bal) / peak) * 100; // positivo
      if (dd > maxDd) maxDd = dd;
    }
  });

  const maxDrawdownPct = round2(maxDd);

  return {
    trades: trades.length,
    totalWins,
    totalLosses,
    totalBE,
    winRatePct,
    avgWinR,
    avgLossR,
    expectancyR,
    netPnl,
    netReturnPct,
    profitFactor,
    maxDrawdownPct,
  };
}

export function groupTradesByDay(trades: Trade[]): Map<string, Trade[]> {
  const map = new Map<string, Trade[]>();
  trades.forEach((t) => {
    const key = t.date;
    const arr = map.get(key) ?? [];
    arr.push(t);
    map.set(key, arr);
  });
  return map;
}

export function validateDayRules(
  trades: Trade[],
  settings: Settings
): { ok: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const byDay = groupTradesByDay(trades);

  byDay.forEach((arr, date) => {
    if (arr.length > settings.maxTradesPerDay) {
      warnings.push(
        `Dia ${date}: ${arr.length} trades (limite configurado: ${settings.maxTradesPerDay}).`
      );
    }
  });

  return { ok: warnings.length === 0, warnings };
}
