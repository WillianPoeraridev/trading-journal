import './App.css'
import MetricsPanel from './components/MetricsPanel'
import SettingsForm from './components/SettingsForm'
import TradeForm from './components/TradeForm'
import TradesTable from './components/TradesTable'

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Trading Journal</h1>
          <p>Registre operações, acompanhe métricas e gere seu extrato.</p>
        </div>
        <SettingsForm />
      </header>

      <main className="app__main">
        <section className="app__panel">
          <MetricsPanel />
        </section>

        <section className="app__panel">
          <TradeForm />
        </section>

        <section className="app__panel">
          <TradesTable />
        </section>
      </main>
    </div>
  )
}

export default App
