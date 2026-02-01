import type { CSSProperties } from "react";
import type { Metrics, ProjectionResult } from "../core/types";
import { formatMoney, formatPct, formatR, roundTo } from "../core/format";

type MetricsPanelProps = {
  metrics: Metrics;
  projection: ProjectionResult;
  currency: string;
};

const gridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const cardStyle: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 12,
  background: "#fff",
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  opacity: 0.7,
  marginBottom: 6,
};

const valueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
};

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
        <div style={cardStyle}>
          <div style={labelStyle}>Saldo atual</div>
          <div style={valueStyle}>{formatMoney(balance, currency)}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>PnL líquido</div>
          <div style={valueStyle}>{formatMoney(metrics.netPnl, currency)}</div>
          <div>{formatPct(metrics.netReturnPct)}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Winrate</div>
          <div style={valueStyle}>{formatPct(metrics.winRatePct)}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Expectancy</div>
          <div style={valueStyle}>{formatR(metrics.expectancyR, 2)}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Profit Factor</div>
          <div style={valueStyle}>{profitFactorText}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Max Drawdown</div>
          <div style={valueStyle}>{formatPct(metrics.maxDrawdownPct)}</div>
        </div>
      </div>

      <section style={{ marginTop: 20 }}>
        <h3>Projeção (20 dias)</h3>
        <div style={gridStyle}>
          <div style={cardStyle}>
            <div style={labelStyle}>Saldo inicial</div>
            <div style={valueStyle}>{formatMoney(projection.summary.startBalance, currency)}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Saldo final (P50)</div>
            <div style={valueStyle}>{formatMoney(projection.summary.endBalanceP50, currency)}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Faixa P10–P90</div>
            <div style={valueStyle}>
              {formatMoney(projection.summary.endBalanceP10, currency)} –{" "}
              {formatMoney(projection.summary.endBalanceP90, currency)}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Método</div>
            <div style={valueStyle}>{projection.method}</div>
          </div>
        </div>
      </section>
    </section>
  );
}
