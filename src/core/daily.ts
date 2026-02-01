import type { LedgerRow, Settings } from "./types";

export type DayStatus = "OK" | "STOP_HIT" | "TAKE_HIT" | "LIMIT_EXCEEDED";

export type DailySummary = {
  date: string;
  trades: number;
  dayPnl: number;
  dayR: number;
  status: DayStatus;
};

export function summarizeByDay(
  ledger: LedgerRow[],
  settings: Settings,
): DailySummary[] {
  const map = new Map<string, DailySummary>();

  ledger.forEach((row) => {
    const existing = map.get(row.date);
    if (!existing) {
      map.set(row.date, {
        date: row.date,
        trades: 1,
        dayPnl: row.pnl,
        dayR: row.rMultiple,
        status: "OK",
      });
      return;
    }

    existing.trades += 1;
    existing.dayPnl += row.pnl;
    existing.dayR += row.rMultiple;
  });

  const summaries = Array.from(map.values()).map((summary) => {
    let status: DayStatus = "OK";
    if (summary.trades > settings.maxTradesPerDay) {
      status = "LIMIT_EXCEEDED";
    } else if (summary.dayR <= settings.dailyStopR) {
      status = "STOP_HIT";
    } else if (summary.dayR >= settings.dailyTakeR) {
      status = "TAKE_HIT";
    }

    return { ...summary, status };
  });

  summaries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return summaries;
}
