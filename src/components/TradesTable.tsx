import type { CSSProperties } from "react";
import type { LedgerRow } from "../core/types";
import {
  formatDateWithWeekday,
  formatMoney,
  formatPct,
  formatR,
} from "../core/format";

type TradesTableProps = {
  ledger: LedgerRow[];
  currency: string;
  onDeleteTrade?: (tradeId: string) => void;
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const headerCellStyle: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "8px 10px",
  fontWeight: 600,
};

const cellLeft: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #eee",
  padding: "8px 10px",
};

const cellRight: CSSProperties = {
  textAlign: "right",
  borderBottom: "1px solid #eee",
  padding: "8px 10px",
  fontVariantNumeric: "tabular-nums",
};

export default function TradesTable({
  ledger,
  currency,
  onDeleteTrade,
}: TradesTableProps) {
  if (ledger.length === 0) {
    return <p>Nenhum trade lançado ainda.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerCellStyle}>#</th>
            <th style={headerCellStyle}>Data</th>
            <th style={headerCellStyle}>Ativo</th>
            <th style={headerCellStyle}>Conta</th>
            <th style={{ ...headerCellStyle, textAlign: "right" }}>PnL</th>
            <th style={{ ...headerCellStyle, textAlign: "right" }}>R</th>
            <th style={{ ...headerCellStyle, textAlign: "right" }}>Risco</th>
            <th style={{ ...headerCellStyle, textAlign: "right" }}>Saldo Antes</th>
            <th style={{ ...headerCellStyle, textAlign: "right" }}>Saldo Depois</th>
            <th style={{ ...headerCellStyle, textAlign: "right" }}>Retorno %</th>
            <th style={{ ...headerCellStyle, textAlign: "right" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((row) => (
            <tr key={row.tradeId}>
              <td style={cellLeft}>{row.index}</td>
              <td style={cellLeft}>{formatDateWithWeekday(row.date, "short")}</td>
              <td style={cellLeft}>{row.symbol ?? "-"}</td>
              <td style={cellLeft}>{row.account}</td>
              <td style={cellRight}>{formatMoney(row.pnl, currency)}</td>
              <td style={cellRight}>{formatR(row.rMultiple, 3)}</td>
              <td style={cellRight}>{formatMoney(row.riskAmount, currency)}</td>
              <td style={cellRight}>{formatMoney(row.balanceBefore, currency)}</td>
              <td style={cellRight}>{formatMoney(row.balanceAfter, currency)}</td>
              <td style={cellRight}>{formatPct(row.returnPct)}</td>
              <td style={cellRight}>
                {onDeleteTrade ? (
                  <button type="button" onClick={() => onDeleteTrade(row.tradeId)}>
                    Excluir
                  </button>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
