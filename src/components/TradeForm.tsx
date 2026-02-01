import { useEffect, useState } from "react";
import type { ResultType, RiskType, Settings, Trade } from "../core/types";
import { weekdayLong } from "../core/format";
import { loadLastSymbol, saveLastSymbol } from "../core/storage";

type Props = {
  settings: Settings;
  onAddTrade: (trade: Trade) => void;
};

const SYMBOLS = ["EUR/USD", "USD/JPY", "GBP/USD", "US30", "US100"] as const;

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function uid(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function TradeForm({ settings, onAddTrade }: Props) {
  const [date, setDate] = useState<string>(todayISO());
  const [symbol, setSymbol] = useState<string>(
    () => loadLastSymbol("REAL") ?? "",
  );
  const [notes, setNotes] = useState<string>("");
  const [account, setAccount] = useState<Trade["account"]>("REAL");

  const [resultType, setResultType] = useState<ResultType>("MONEY");
  const [resultValue, setResultValue] = useState<string>("");

  const [useDefaultRisk, setUseDefaultRisk] = useState<boolean>(true);
  const [riskType, setRiskType] = useState<RiskType>(settings.defaultRiskType);
  const [riskValue, setRiskValue] = useState<string>(String(settings.defaultRiskValue));

  // manter risco sincronizado quando settings mudar e estiver usando default
  useEffect(() => {
    if (useDefaultRisk) {
      setRiskType(settings.defaultRiskType);
      setRiskValue(String(settings.defaultRiskValue));
    }
  }, [settings.defaultRiskType, settings.defaultRiskValue, useDefaultRisk]);

  function parseNumber(input: string): number {
    const normalized = input.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const rv = parseNumber(resultValue);
    const riskV = parseNumber(riskValue);

    const trade: Trade = {
      id: uid(),
      date,
      symbol: symbol.trim() || undefined,
      notes: notes.trim() || undefined,

      riskType: useDefaultRisk ? settings.defaultRiskType : riskType,
      riskValue: useDefaultRisk ? settings.defaultRiskValue : riskV,

      account,

      resultType,
      resultValue: rv,

      createdAt: Date.now(),
    };

    onAddTrade(trade);
    saveLastSymbol(account, symbol);

    // reset parcial (mantém date por ser “um trade por dia”)
    setNotes("");
    setResultValue("");
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Nova operação</h2>
      <p>Registre o trade em dinheiro ($) e veja o R calculado no histórico.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Data
          <input value={date} onChange={(e) => setDate(e.target.value)} type="date" />
        </label>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          Dia da semana: {weekdayLong(date) || "-"}
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          Ativo (opcional)
          <select
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value);
              saveLastSymbol(account, e.target.value);
            }}
          >
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
            onChange={(e) => {
              const next = e.target.value as Trade["account"];
              setAccount(next);
              const stored = loadLastSymbol(next);
              if (stored !== undefined) {
                setSymbol(stored);
              }
            }}
          >
            <option value="REAL">Real</option>
            <option value="BT">Backtest</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Resultado em
          <select value={resultType} onChange={(e) => setResultType(e.target.value as ResultType)}>
            <option value="MONEY">Dinheiro ($)</option>
            <option value="R">R (múltiplo do risco)</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Valor do resultado ({resultType === "MONEY" ? settings.currency : "R"})
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
          Usar risco padrão ({settings.defaultRiskType === "PERCENT" ? `${settings.defaultRiskValue}%` : `${settings.currency} ${settings.defaultRiskValue}`})
        </label>

        {!useDefaultRisk && (
          <>
            <label style={{ display: "grid", gap: 6 }}>
              Tipo de risco
              <select value={riskType} onChange={(e) => setRiskType(e.target.value as RiskType)}>
                <option value="PERCENT">Percentual (%)</option>
                <option value="FIXED">Fixo ({settings.currency})</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Valor do risco ({riskType === "PERCENT" ? "%" : settings.currency})
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

        <button type="submit">Adicionar trade</button>
      </form>
    </section>
  );
}
