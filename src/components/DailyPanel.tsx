import type { DailySummary } from "../core/daily";
import type { Settings } from "../core/types";
import { formatDateWithWeekday, formatMoney, formatR } from "../core/format";

type DailyPanelProps = {
  summaries: DailySummary[];
  currency: string;
  settings: Settings;
};

const cardClass =
  "rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-sm";
const labelClass = "text-xs uppercase tracking-wider text-zinc-400";
const valueClass = "mt-1 text-2xl font-semibold text-zinc-100";
const subClass = "mt-1 text-sm text-zinc-400";

const statusLabel: Record<DailySummary["status"], string> = {
  OK: "OK",
  LIMIT_EXCEEDED: "Excedeu limite",
  STOP_HIT: "Stop atingido",
  TAKE_HIT: "Take atingido",
};

const todayISO = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function DailyPanel({
  summaries,
  currency,
  settings,
}: DailyPanelProps) {
  const maxDate =
    summaries.length === 0
      ? todayISO()
      : summaries.reduce(
          (max, item) => (item.date > max ? item.date : max),
          summaries[0].date,
        );

  const todaySummary =
    summaries.find((item) => item.date === maxDate) ?? {
      date: maxDate,
      trades: 0,
      dayPnl: 0,
      dayR: 0,
      status: "OK" as const,
    };

  return (
    <section>
      <h2>Regras do dia</h2>
      <div className={cardClass}>
        <div className={labelClass}>Hoje</div>
        <div className={valueClass}>
          {formatDateWithWeekday(todaySummary.date, "long")}
        </div>
        <div className={subClass}>
          Trades: {todaySummary.trades}/{settings.maxTradesPerDay}
        </div>
        <div className={subClass}>
          PnL do dia: {formatMoney(todaySummary.dayPnl, currency)}
        </div>
        <div className={subClass}>R do dia: {formatR(todaySummary.dayR, 2)}</div>
        <div className={subClass}>Status: {statusLabel[todaySummary.status]}</div>
      </div>
      {summaries.length === 0 && (
        <p className={subClass} style={{ marginTop: 8 }}>
          Sem trades no diário ainda.
        </p>
      )}
    </section>
  );
}
