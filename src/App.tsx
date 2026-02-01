import './App.css'
import MetricsPanel from './components/MetricsPanel'
import SettingsForm from './components/SettingsForm'
import TradeForm from './components/TradeForm'
import TradesTable from './components/TradesTable'
import DailyPanel from './components/DailyPanel'
import { useEffect, useMemo, useState } from 'react'
import type { ProjectionSettings, Settings, Trade } from './core/types'
import { calculateMetrics, buildLedger } from './core/calc'
import { project, projectDailySim } from './core/projection'
import {
  loadSettings,
  loadTrades,
  saveSettings,
  saveTrades,
  updateTrade,
} from './core/storage'
import { summarizeByDay } from './core/daily'

function App() {
  const defaultSettings: Settings = {
    startingBalance: 10000,
    btStartingBalance: 10000,
    currency: 'USD',
    defaultRiskType: 'PERCENT',
    defaultRiskValue: 1,
    dailyStopR: -1,
    dailyTakeR: 2,
    maxTradesPerDay: 1,
    returnMode: 'ON_STARTING_BALANCE',
    projectionMethod: 'DETERMINISTIC',
  }

  const [settings, setSettings] = useState<Settings>(() => ({
    ...defaultSettings,
    ...(loadSettings() ?? {}),
  }))
  const [trades, setTrades] = useState<Trade[]>(() => loadTrades())

  const [viewAccount, setViewAccount] = useState<'REAL' | 'BT' | 'ALL'>('REAL')

  const visibleTrades = useMemo(() => {
    if (viewAccount === 'ALL') return trades
    return trades.filter((trade) => trade.account === viewAccount)
  }, [trades, viewAccount])

  const effectiveSettings = useMemo(
    () => ({
      ...settings,
      startingBalance:
        viewAccount === 'BT' ? settings.btStartingBalance : settings.startingBalance,
    }),
    [settings, viewAccount],
  )

  const ledger = useMemo(
    () => buildLedger(visibleTrades, effectiveSettings),
    [visibleTrades, effectiveSettings],
  )
  const daily = useMemo(
    () => summarizeByDay(ledger, effectiveSettings),
    [ledger, effectiveSettings],
  )
  const currentBalance = useMemo(
    () =>
      ledger.length > 0
        ? ledger[ledger.length - 1].balanceAfter
        : effectiveSettings.startingBalance,
    [ledger, effectiveSettings.startingBalance],
  )
  const metrics = useMemo(
    () => calculateMetrics(visibleTrades, ledger, effectiveSettings),
    [visibleTrades, ledger, effectiveSettings],
  )

  const projectionSettings: ProjectionSettings = {
    horizonDays: 20,
    simulations: 1000,
    method: 'DETERMINISTIC',
  }
  const projection = useMemo(() => {
    const method = settings.projectionMethod ?? 'DETERMINISTIC'
    if (method === 'DAILY_SIM') {
      return projectDailySim({
        startBalance: currentBalance,
        horizonDays: projectionSettings.horizonDays,
        settings: effectiveSettings,
        metrics,
      })
    }
    return project(visibleTrades, effectiveSettings, projectionSettings)
  }, [
    visibleTrades,
    effectiveSettings,
    projectionSettings.horizonDays,
    metrics,
    currentBalance,
  ])

  const handleSettingsChange = (next: Settings) => {
    setSettings(next)
    saveSettings(next)
  }

  const handleAddTrade = (trade: Trade) => {
    setTrades((prev) => [...prev, trade])
  }

  const handleDeleteTrade = (tradeId: string) => {
    setTrades((prev) => prev.filter((trade) => trade.id !== tradeId))
  }

  const handleUpdateTrade = (tradeId: string, patch: Partial<Trade>) => {
    setTrades((prev) => updateTrade(prev, tradeId, patch))
  }

  useEffect(() => {
    saveTrades(trades)
  }, [trades])

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Trading Journal</h1>
          <p>Registre operações, acompanhe métricas e gere seu extrato.</p>
        </div>
        <SettingsForm settings={settings} onChange={handleSettingsChange} />
      </header>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'grid', gap: 6, maxWidth: 240 }}>
          Visualizar
          <select
            value={viewAccount}
            onChange={(e) => setViewAccount(e.target.value as 'REAL' | 'BT' | 'ALL')}
          >
            <option value="REAL">Real</option>
            <option value="BT">Backtest</option>
            <option value="ALL">Todas</option>
          </select>
        </label>
      </div>

      <main className="app__main">
        <section className="app__panel">
          <MetricsPanel
            metrics={metrics}
            projection={projection}
            currency={settings.currency}
          />
        </section>

        <section className="app__panel">
          <DailyPanel
            summaries={daily}
            currency={settings.currency}
            settings={settings}
            viewAccount={viewAccount}
          />
        </section>

        <section className="app__panel">
          <TradeForm settings={settings} onAddTrade={handleAddTrade} />
        </section>

        <section className="app__panel">
          <TradesTable
            ledger={ledger}
            trades={visibleTrades}
            settings={settings}
            currency={settings.currency}
            onDeleteTrade={handleDeleteTrade}
            onUpdateTrade={handleUpdateTrade}
          />
        </section>
      </main>
    </div>
  )
}

export default App
