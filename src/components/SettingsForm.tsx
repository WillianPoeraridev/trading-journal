import { useEffect, useState } from "react";
import type { Settings } from "../core/types";
import { stringifyPretty } from "../core/format";

type SettingsFormProps = {
  settings: Settings;
  onChange: (settings: Settings) => void;
};

export default function SettingsForm({ settings, onChange }: SettingsFormProps) {
  const [startingBalanceInput, setStartingBalanceInput] = useState<string>(
    String(settings.startingBalance),
  );
  const [defaultRiskValueInput, setDefaultRiskValueInput] = useState<string>(
    String(settings.defaultRiskValue),
  );
  const [dailyStopRInput, setDailyStopRInput] = useState<string>(
    String(settings.dailyStopR),
  );
  const [dailyTakeRInput, setDailyTakeRInput] = useState<string>(
    String(settings.dailyTakeR),
  );

  useEffect(() => {
    setStartingBalanceInput(String(settings.startingBalance));
  }, [settings.startingBalance]);

  useEffect(() => {
    setDefaultRiskValueInput(String(settings.defaultRiskValue));
  }, [settings.defaultRiskValue]);

  useEffect(() => {
    setDailyStopRInput(String(settings.dailyStopR));
  }, [settings.dailyStopR]);

  useEffect(() => {
    setDailyTakeRInput(String(settings.dailyTakeR));
  }, [settings.dailyTakeR]);

  const normalizeDecimal = (value: string): string => value.replace(/,/g, ".");

  const parseDecimal = (value: string, fallback: number): number => {
    const trimmed = value.trim();
    if (
      trimmed === "" ||
      trimmed === "-" ||
      trimmed === "." ||
      trimmed === "-." ||
      trimmed === "," ||
      trimmed === "-,"
    ) {
      return fallback;
    }
    const parsed = Number(normalizeDecimal(trimmed));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const update = (partial: Partial<Settings>) => {
    onChange({ ...settings, ...partial });
  };

  const handleStartingBalance = (raw: string, commit: boolean) => {
    setStartingBalanceInput(raw);
    const parsed = parseDecimal(raw, settings.startingBalance);
    const next = Math.max(0, parsed);
    update({ startingBalance: next });
    if (commit) setStartingBalanceInput(String(next));
  };

  const handleDefaultRiskValue = (raw: string, commit: boolean) => {
    setDefaultRiskValueInput(raw);
    const parsed = parseDecimal(raw, settings.defaultRiskValue);
    const next = Math.max(0, parsed);
    update({ defaultRiskValue: next });
    if (commit) setDefaultRiskValueInput(String(next));
  };

  const handleDailyStopR = (raw: string, commit: boolean) => {
    setDailyStopRInput(raw);
    const parsed = parseDecimal(raw, settings.dailyStopR);
    const next = -Math.abs(parsed);
    update({ dailyStopR: next });
    if (commit) setDailyStopRInput(String(next));
  };

  const handleDailyTakeR = (raw: string, commit: boolean) => {
    setDailyTakeRInput(raw);
    const parsed = parseDecimal(raw, settings.dailyTakeR);
    const next = Math.abs(parsed);
    update({ dailyTakeR: next });
    if (commit) setDailyTakeRInput(String(next));
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
            value={startingBalanceInput}
            onChange={(e) => handleStartingBalance(e.target.value, false)}
            onBlur={(e) => handleStartingBalance(e.target.value, true)}
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
            value={defaultRiskValueInput}
            onChange={(e) => handleDefaultRiskValue(e.target.value, false)}
            onBlur={(e) => handleDefaultRiskValue(e.target.value, true)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Stop diário (R)
          <input
            type="text"
            inputMode="decimal"
            value={dailyStopRInput}
            onChange={(e) => handleDailyStopR(e.target.value, false)}
            onBlur={(e) => handleDailyStopR(e.target.value, true)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Take diário (R)
          <input
            type="text"
            inputMode="decimal"
            value={dailyTakeRInput}
            onChange={(e) => handleDailyTakeR(e.target.value, false)}
            onBlur={(e) => handleDailyTakeR(e.target.value, true)}
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
      </form>

      <details style={{ marginTop: 12 }}>
        <summary>Debug</summary>
        <pre>{stringifyPretty(settings, 2)}</pre>
      </details>
    </section>
  );
}
