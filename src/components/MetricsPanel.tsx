import type { Metrics, ProjectionResult } from '../core/types'
import { stringifyPretty } from '../core/format'

type MetricsPanelProps = {
  metrics: Metrics
  projection: ProjectionResult
}

function MetricsPanel({ metrics, projection }: MetricsPanelProps) {
  return (
    <div>
      <h2>Metricas</h2>
      <pre>{stringifyPretty(metrics, 2)}</pre>
      <pre>{stringifyPretty(projection, 2)}</pre>
    </div>
  )
}

export default MetricsPanel
