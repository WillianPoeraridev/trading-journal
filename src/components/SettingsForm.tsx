import { useEffect, useState } from "react";
import type { Settings } from "../core/types";
import { stringifyPretty } from "../core/format";

type SettingsFormProps = {
  settings: Settings;
  onChange: (settings: Settings) => void;
};

export default function SettingsForm({ settings, onChange }: SettingsFormProps) {
  const [sbText, setSbText] = useState<string>(String(settings.startingBalance));
  const [btText, setBtText] = useState<string>(String(settings.btStartingBalance));
  const [riskText, setRiskText] = useState<string>(
    String(settings.defaultRiskValue),
  );
  const [stopText, setStopText] = useState<string>(String(settings.dailyStopR));
  const [takeText, setTakeText] = useState<string>(String(settings.dailyTakeR));

  useEffect(() => {
    setSbText(String(settings.startingBalance));
  }, [settings.startingBalance]);

  useEffect(() => {
    setBtText(String(settings.btStartingBalance));
  }, [settings.btStartingBalance]);

  useEffect(() => {
    setRiskText(String(settings.defaultRiskValue));
  }, [settings.defaultRiskValue]);

  useEffect(() => {
    setStopText(String(settings.dailyStopR));
  }, [settings.dailyStopR]);

  useEffect(() => {
    setTakeText(String(settings.dailyTakeR));
  }, [settings.dailyTakeR]);

  const normalizeDecimal = (value: string): string =>
    value.trim().replace(",", ".");

  const parseDecimal = (value: string, fallback: number): number => {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === ".") {
      return fallback;
    }
    const parsed = Number(normalizeDecimal(trimmed));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const update = (partial: Partial<Settings>) => {
    onChange({ ...settings, ...partial });
  };

  const handleStartingBalanceBlur = () => {
    const parsed = parseDecimal(sbText, settings.startingBalance);
    const next = Math.max(0, parsed);
    update({ startingBalance: next });
    setSbText(String(next));
  };

  const handleBtBalanceBlur = () => {
    const parsed = parseDecimal(btText, settings.btStartingBalance);
    const next = Math.max(0, parsed);
    update({ btStartingBalance: next });
    setBtText(String(next));
  };

  const handleDefaultRiskBlur = () => {
    const parsed = parseDecimal(riskText, settings.defaultRiskValue);
    const next = Math.max(0, parsed);
    update({ defaultRiskValue: next });
    setRiskText(String(next));
  };

  const handleDailyStopBlur = () => {
    const parsed = parseDecimal(stopText, settings.dailyStopR);
    const next = -Math.abs(parsed);
    update({ dailyStopR: next });
    setStopText(String(next));
  };

  const handleDailyTakeBlur = () => {
    const parsed = parseDecimal(takeText, settings.dailyTakeR);
    const next = Math.abs(parsed);
    update({ dailyTakeR: next });
    setTakeText(String(next));
  };

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Configurações</h2>
      <form style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Banca inicial
          <input
            type="text"
            inputMode="decimal"
            value={sbText}
            onChange={(e) => setSbText(e.target.value)}
            onBlur={handleStartingBalanceBlur}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Banca inicial (Backtest)
          <input
            type="text"
            inputMode="decimal"
            value={btText}
            onChange={(e) => setBtText(e.target.value)}
            onBlur={handleBtBalanceBlur}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Moeda
          <input
            value={settings.currency}
            onChange={(e) => update({ currency: e.target.value })}
            placeholder="ex: USD"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Tipo de risco padrão
          <select
            value={settings.defaultRiskType}
            onChange={(e) =>
              update({ defaultRiskType: e.target.value as Settings["defaultRiskType"] })
            }
          >
            <option value="PERCENT">Percentual (%)</option>
            <option value="FIXED">Fixo</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Valor do risco padrão
          <input
            type="text"
            inputMode="decimal"
            value={riskText}
            onChange={(e) => setRiskText(e.target.value)}
            onBlur={handleDefaultRiskBlur}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Stop diário (R)
          <input
            type="text"
            inputMode="decimal"
            value={stopText}
            onChange={(e) => setStopText(e.target.value)}
            onBlur={handleDailyStopBlur}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Take diário (R)
          <input
            type="text"
            inputMode="decimal"
            value={takeText}
            onChange={(e) => setTakeText(e.target.value)}
            onBlur={handleDailyTakeBlur}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Trades por dia
          <select
            value={String(settings.maxTradesPerDay)}
            onChange={(e) =>
              update({ maxTradesPerDay: Number(e.target.value) as 1 | 2 })
            }
          >
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Base de retorno
          <select
            value={settings.returnMode}
            onChange={(e) =>
              update({ returnMode: e.target.value as Settings["returnMode"] })
            }
          >
            <option value="ON_STARTING_BALANCE">Saldo inicial</option>
            <option value="ON_PREV_BALANCE">Saldo anterior</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Método de projeção
          <select
            value={settings.projectionMethod}
            onChange={(e) =>
              update({
                projectionMethod: e.target.value as Settings["projectionMethod"],
              })
            }
          >
            <option value="DETERMINISTIC">Determinística</option>
            <option value="DAILY_SIM">Diário</option>
          </select>
        </label>
      </form>

      <details style={{ marginTop: 12 }}>
        <summary>Debug</summary>
        <pre>{stringifyPretty(settings, 2)}</pre>
      </details>
    </section>
  );
}
