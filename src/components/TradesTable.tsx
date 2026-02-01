import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { LedgerRow, Settings, Trade } from "../core/types";
import {
  formatDateWithWeekday,
  formatMoney,
  formatPct,
  formatR,
} from "../core/format";

type TradesTableProps = {
  ledger: LedgerRow[];
  trades: Trade[];
  settings: Settings;
  currency: string;
  onDeleteTrade?: (tradeId: string) => void;
  onUpdateTrade?: (tradeId: string, patch: Partial<Trade>) => void;
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
  trades,
  settings,
  currency,
  onDeleteTrade,
  onUpdateTrade,
}: TradesTableProps) {
  const tradesById = useMemo(() => {
    const map = new Map<string, Trade>();
    trades.forEach((trade) => map.set(trade.id, trade));
    return map;
  }, [trades]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [account, setAccount] = useState<Trade["account"]>("REAL");
  const [resultType, setResultType] = useState<Trade["resultType"]>("MONEY");
  const [resultValue, setResultValue] = useState<string>("");
  const [useDefaultRisk, setUseDefaultRisk] = useState<boolean>(true);
  const [riskType, setRiskType] = useState<Trade["riskType"]>("PERCENT");
  const [riskValue, setRiskValue] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const SYMBOLS = ["EUR/USD", "USD/JPY", "GBP/USD", "US30", "US100"] as const;

  const normalizeDecimal = (value: string): string => value.replace(",", ".");
  const parseDecimal = (value: string, fallback: number): number => {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === ".") return fallback;
    const parsed = Number(normalizeDecimal(trimmed));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const openEditor = (tradeId: string) => {
    const trade = tradesById.get(tradeId);
    if (!trade) return;

    setEditingId(tradeId);
    setDate(trade.date);
    setSymbol(trade.symbol ?? "");
    setAccount(trade.account ?? "REAL");
    setResultType(trade.resultType);
    setResultValue(String(trade.resultValue));
    setNotes(trade.notes ?? "");

    const isDefaultRisk =
      trade.riskType === settings.defaultRiskType &&
      trade.riskValue === settings.defaultRiskValue;
    setUseDefaultRisk(isDefaultRisk);
    setRiskType(trade.riskType);
    setRiskValue(String(trade.riskValue));
  };

  const closeEditor = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editingId || !onUpdateTrade) return;
    const trade = tradesById.get(editingId);
    if (!trade) return;

    const rv = parseDecimal(resultValue, trade.resultValue);
    const riskV = parseDecimal(riskValue, trade.riskValue);

    const next: Partial<Trade> = {
      date,
      symbol: symbol.trim() || undefined,
      notes: notes.trim() || undefined,
      account,
      resultType,
      resultValue: rv,
      riskType: useDefaultRisk ? settings.defaultRiskType : riskType,
      riskValue: useDefaultRisk ? settings.defaultRiskValue : riskV,
    };

    onUpdateTrade(editingId, next);
    setEditingId(null);
  };
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
                {onUpdateTrade ? (
                  <button type="button" onClick={() => openEditor(row.tradeId)}>
                    Editar
                  </button>
                ) : null}
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

      {editingId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#0f172a",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: 12,
              padding: 20,
              width: "100%",
              maxWidth: 520,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Editar trade</h3>
            <form style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Data
                <input value={date} onChange={(e) => setDate(e.target.value)} type="date" />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                Ativo (opcional)
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                  <option value="">(sem ativo)</option>
                  {SYMBOLS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                Conta
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value as Trade["account"])}
                >
                  <option value="REAL">Real</option>
                  <option value="BT">Backtest</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                Resultado em
                <select
                  value={resultType}
                  onChange={(e) => setResultType(e.target.value as Trade["resultType"])}
                >
                  <option value="MONEY">Dinheiro ($)</option>
                  <option value="R">R (múltiplo do risco)</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                Valor do resultado ({resultType === "MONEY" ? currency : "R"})
                <input
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  inputMode="decimal"
                  placeholder={resultType === "MONEY" ? "ex: -5 ou 12.25" : "ex: -1 ou 2.5"}
                />
              </label>

              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={useDefaultRisk}
                  onChange={(e) => setUseDefaultRisk(e.target.checked)}
                />
                Usar risco padrão (
                {settings.defaultRiskType === "PERCENT"
                  ? `${settings.defaultRiskValue}%`
                  : `${currency} ${settings.defaultRiskValue}`}
                )
              </label>

              {!useDefaultRisk && (
                <>
                  <label style={{ display: "grid", gap: 6 }}>
                    Tipo de risco
                    <select
                      value={riskType}
                      onChange={(e) =>
                        setRiskType(e.target.value as Trade["riskType"])
                      }
                    >
                      <option value="PERCENT">Percentual (%)</option>
                      <option value="FIXED">Fixo ({currency})</option>
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    Valor do risco ({riskType === "PERCENT" ? "%" : currency})
                    <input
                      value={riskValue}
                      onChange={(e) => setRiskValue(e.target.value)}
                      inputMode="decimal"
                      placeholder={riskType === "PERCENT" ? "ex: 0.5" : "ex: 5"}
                    />
                  </label>
                </>
              )}

              <label style={{ display: "grid", gap: 6 }}>
                Notas (opcional)
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </label>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={closeEditor}>
                  Cancelar
                </button>
                <button type="button" onClick={saveEdit}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
