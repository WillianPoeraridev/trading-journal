import type { LedgerRow } from '../core/types'
import { stringifyPretty } from '../core/format'

type TradesTableProps = {
  ledger: LedgerRow[]
}

function TradesTable({ ledger }: TradesTableProps) {
  return (
    <div>
      <h2>Historico</h2>
      <pre>{stringifyPretty(ledger, 2)}</pre>
    </div>
  )
}

export default TradesTable
