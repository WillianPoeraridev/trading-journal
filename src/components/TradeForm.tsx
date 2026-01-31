import type { Settings, Trade } from '../core/types'

type TradeFormProps = {
  settings: Settings
  onAddTrade: (trade: Trade) => void
}

function TradeForm({ settings, onAddTrade }: TradeFormProps) {
  void onAddTrade
  return (
    <div>
      <h2>Nova operacao</h2>
      <pre>{JSON.stringify(settings, null, 2)}</pre>
    </div>
  )
}

export default TradeForm
