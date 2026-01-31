import './App.css'
import MetricsPanel from './components/MetricsPanel'
import SettingsForm from './components/SettingsForm'
import TradeForm from './components/TradeForm'
import TradesTable from './components/TradesTable'
import { useEffect, useMemo, useState } from 'react'
import type { ProjectionSettings, Settings, Trade } from './core/types'
import { calculateMetrics, buildLedger } from './core/calc'
import { project } from './core/projection'
import { loadSettings, loadTrades, saveSettings, saveTrades } from './core/storage'

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
  }

  const [settings, setSettings] = useState<Settings>(
    () => loadSettings() ?? defaultSettings,
  )
  const [trades, setTrades] = useState<Trade[]>(() => loadTrades())

  const ledger = useMemo(() => buildLedger(trades, settings), [trades, settings])
  const metrics = useMemo(
    () => calculateMetrics(trades, ledger, settings),
    [trades, ledger, settings],
  )

  const projectionSettings: ProjectionSettings = {
    horizonDays: 20,
    simulations: 1000,
    method: 'DETERMINISTIC',
  }
  const projection = useMemo(
    () => project(trades, settings, projectionSettings),
    [trades, settings],
  )

  const handleSettingsChange = (next: Settings) => {
    setSettings(next)
    saveSettings(next)
  }

  const handleAddTrade = (trade: Trade) => {
    setTrades((prev) => [...prev, trade])
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
          <MetricsPanel metrics={metrics} projection={projection} />
        </section>

        <section className="app__panel">
          <TradeForm settings={settings} onAddTrade={handleAddTrade} />
        </section>

        <section className="app__panel">
          <TradesTable ledger={ledger} />
        </section>
      </main>
    </div>
  )
}

export default App
