import type { ReactNode } from "react";
import type { Metrics, ProjectionResult } from "../core/types";
import { formatMoney, formatPct, formatR, roundTo } from "../core/format";

type MetricsPanelProps = {
  metrics: Metrics;
  projection: ProjectionResult;
  currency: string;
};

const gridStyle = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-sm">
      {children}
    </div>
  );
}

export default function MetricsPanel({
  metrics,
  projection,
  currency,
}: MetricsPanelProps) {
  const balance = projection.summary.startBalance;
  const profitFactorText =
    metrics.profitFactor === null ? "-" : roundTo(metrics.profitFactor, 2).toFixed(2);

  return (
    <section>
      <h2>Resumo</h2>
      <div style={gridStyle}>
        <Card>
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            Saldo atual
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">
            {formatMoney(balance, currency)}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            PnL líquido
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">
            {formatMoney(metrics.netPnl, currency)}
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            {formatPct(metrics.netReturnPct)}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            Winrate
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">
            {formatPct(metrics.winRatePct)}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            Expectancy
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">
            {formatR(metrics.expectancyR, 2)}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            Profit Factor
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">
            {profitFactorText}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            Max Drawdown
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">
            {formatPct(metrics.maxDrawdownPct)}
          </div>
        </Card>
      </div>

      <section style={{ marginTop: 20 }}>
        <h3>Projeção (20 dias)</h3>
        <div style={gridStyle}>
          <Card>
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              Saldo inicial
            </div>
            <div className="mt-1 text-2xl font-semibold text-zinc-100">
              {formatMoney(projection.summary.startBalance, currency)}
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              Saldo final (P50)
            </div>
            <div className="mt-1 text-2xl font-semibold text-zinc-100">
              {formatMoney(projection.summary.endBalanceP50, currency)}
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              Faixa P10–P90
            </div>
            <div className="mt-1 text-2xl font-semibold text-zinc-100">
              {formatMoney(projection.summary.endBalanceP10, currency)} –{" "}
              {formatMoney(projection.summary.endBalanceP90, currency)}
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              Método
            </div>
            <div className="mt-1 text-lg font-semibold text-zinc-100 break-words">
              {projection.method}
            </div>
          </Card>
        </div>
      </section>
    </section>
  );
}
