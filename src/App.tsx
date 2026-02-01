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
import { loadSettings, loadTrades, saveSettings, saveTrades } from './core/storage'
import { summarizeByDay } from './core/daily'

function App() {
  const defaultSettings: Settings = {
    startingBalance: 10000,
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

  const ledger = useMemo(() => buildLedger(trades, settings), [trades, settings])
  const daily = useMemo(() => summarizeByDay(ledger, settings), [ledger, settings])
  const currentBalance = useMemo(
    () =>
      ledger.length > 0
        ? ledger[ledger.length - 1].balanceAfter
        : settings.startingBalance,
    [ledger, settings.startingBalance],
  )
  const metrics = useMemo(
    () => calculateMetrics(trades, ledger, settings),
    [trades, ledger, settings],
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
        settings,
        metrics,
      })
    }
    return project(trades, settings, projectionSettings)
  }, [trades, settings, projectionSettings.horizonDays, metrics, currentBalance])

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
          />
        </section>

        <section className="app__panel">
          <TradeForm settings={settings} onAddTrade={handleAddTrade} />
        </section>

        <section className="app__panel">
          <TradesTable
            ledger={ledger}
            currency={settings.currency}
            onDeleteTrade={handleDeleteTrade}
          />
        </section>
      </main>
    </div>
  )
}

export default App
