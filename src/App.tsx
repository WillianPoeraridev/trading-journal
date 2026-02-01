import './App.css'
import MetricsPanel from './components/MetricsPanel'
import SettingsForm from './components/SettingsForm'
import TradeForm from './components/TradeForm'
import TradesTable from './components/TradesTable'
import DailyPanel from './components/DailyPanel'
import { useEffect, useMemo, useState } from 'react'
import type { ProjectionSettings, Settings, Trade } from './core/types'
import {
  calculateMetrics,
  buildLedger,
  filterTradesByPeriod,
  getMaxTradeDate,
} from './core/calc'
import { formatDateBR } from './core/format'
import { project, projectDailySim } from './core/projection'
import {
  loadSettings,
  loadTrades,
  saveSettings,
  saveTrades,
  updateTrade,
  clearAllTrades,
  clearTradesByAccount,
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
    periodFilter: { preset: 'ALL' },
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

  const periodFilter = settings.periodFilter ?? { preset: 'ALL' }
  const filteredTrades = useMemo(
    () => filterTradesByPeriod(visibleTrades, periodFilter),
    [visibleTrades, periodFilter],
  )

  const effectiveSettings = useMemo(
    () => ({
      ...settings,
      startingBalance:
        viewAccount === 'BT' ? settings.btStartingBalance : settings.startingBalance,
    }),
    [settings, viewAccount],
  )

  const ledger = useMemo(
    () => buildLedger(filteredTrades, effectiveSettings),
    [filteredTrades, effectiveSettings],
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
    () => calculateMetrics(filteredTrades, ledger, effectiveSettings),
    [filteredTrades, ledger, effectiveSettings],
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
    return project(filteredTrades, effectiveSettings, projectionSettings)
  }, [
    filteredTrades,
    effectiveSettings,
    projectionSettings.horizonDays,
    metrics,
    currentBalance,
  ])

  const periodLabel = useMemo(() => {
    const preset = periodFilter.preset
    if (preset === 'ALL') return 'Mostrando: tudo'
    if (preset === 'LAST_7_DAYS' || preset === 'LAST_30_DAYS') {
      const base = getMaxTradeDate(visibleTrades)
      if (!base) return 'Mostrando: 0 trades'
      const days = preset === 'LAST_7_DAYS' ? 7 : 30
      const baseParts = base.split('-').map((part) => Number(part))
      const baseDate = new Date(baseParts[0], baseParts[1] - 1, baseParts[2])
      const start = new Date(baseDate)
      start.setDate(start.getDate() - (days - 1))
      const startISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(start.getDate()).padStart(2, '0')}`
      return `Mostrando: ${days} dias (${formatDateBR(startISO)} até ${formatDateBR(
        base,
      )})`
    }
    const start = periodFilter.start
    const end = periodFilter.end
    if (start && end) {
      return `Mostrando: ${start} até ${end}`
    }
    if (start) return `Mostrando: a partir de ${start}`
    if (end) return `Mostrando: até ${end}`
    return 'Mostrando: intervalo'
  }, [periodFilter, visibleTrades])

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

  const handleClearAccountTrades = () => {
    if (viewAccount === 'ALL') {
      window.alert('Selecione Real ou Backtest para limpar apenas uma conta.')
      return
    }
    const confirmed = window.confirm(
      'Tem certeza? Isso vai apagar os trades desta conta. Essa ação não pode ser desfeita.',
    )
    if (!confirmed) return
    setTrades((prev) => clearTradesByAccount(prev, viewAccount))
  }

  const handleClearAllTrades = () => {
    const confirmed = window.confirm(
      'Tem certeza? Isso vai apagar TODOS os trades. Essa ação não pode ser desfeita.',
    )
    if (!confirmed) return
    setTrades(() => clearAllTrades())
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
        <SettingsForm
          settings={settings}
          onChange={handleSettingsChange}
          viewAccount={viewAccount}
          onClearAccountTrades={handleClearAccountTrades}
          onClearAllTrades={handleClearAllTrades}
          periodLabel={periodLabel}
        />
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
