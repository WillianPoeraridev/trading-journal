import type { LedgerRow } from '../core/types'

type TradesTableProps = {
  ledger: LedgerRow[]
}

function TradesTable({ ledger }: TradesTableProps) {
  return (
    <div>
      <h2>Historico</h2>
      <pre>{JSON.stringify(ledger, null, 2)}</pre>
    </div>
  )
}

export default TradesTable
