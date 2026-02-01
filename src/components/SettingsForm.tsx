import type { Settings } from "../core/types";
import { stringifyPretty } from "../core/format";

type SettingsFormProps = {
  settings: Settings;
  onChange: (settings: Settings) => void;
};

function parseNumber(input: string): number {
  const normalized = input.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export default function SettingsForm({ settings, onChange }: SettingsFormProps) {
  const update = (partial: Partial<Settings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Configurações</h2>
      <form style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Banca inicial
          <input
            value={String(settings.startingBalance)}
            onChange={(e) =>
              update({ startingBalance: Math.max(0, parseNumber(e.target.value)) })
            }
            inputMode="decimal"
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
            value={String(settings.defaultRiskValue)}
            onChange={(e) =>
              update({ defaultRiskValue: Math.max(0, parseNumber(e.target.value)) })
            }
            inputMode="decimal"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Stop diário (R)
          <input
            value={String(settings.dailyStopR)}
            onChange={(e) =>
              update({ dailyStopR: -Math.abs(parseNumber(e.target.value)) })
            }
            inputMode="decimal"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Take diário (R)
          <input
            value={String(settings.dailyTakeR)}
            onChange={(e) =>
              update({ dailyTakeR: Math.abs(parseNumber(e.target.value)) })
            }
            inputMode="decimal"
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
