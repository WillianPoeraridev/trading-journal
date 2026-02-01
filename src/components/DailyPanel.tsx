import type { DailySummary } from "../core/daily";
import type { Settings } from "../core/types";
import { formatMoney, formatR } from "../core/format";

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

export default function DailyPanel({
  summaries,
  currency,
  settings,
}: DailyPanelProps) {
  if (summaries.length === 0) {
    return <p>Sem trades no diário ainda.</p>;
  }

  const last = summaries[summaries.length - 1];

  return (
    <section>
      <h2>Regras do dia</h2>
      <div className={cardClass}>
        <div className={labelClass}>Hoje</div>
        <div className={valueClass}>{last.date}</div>
        <div className={subClass}>
          Trades: {last.trades}/{settings.maxTradesPerDay}
        </div>
        <div className={subClass}>
          PnL do dia: {formatMoney(last.dayPnl, currency)}
        </div>
        <div className={subClass}>R do dia: {formatR(last.dayR, 2)}</div>
        <div className={subClass}>Status: {statusLabel[last.status]}</div>
      </div>
    </section>
  );
}
