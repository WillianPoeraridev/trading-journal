import type { Metrics, ProjectionResult } from '../core/types'

type MetricsPanelProps = {
  metrics: Metrics
  projection: ProjectionResult
}

function MetricsPanel({ metrics, projection }: MetricsPanelProps) {
  return (
    <div>
      <h2>Metricas</h2>
      <pre>{JSON.stringify(metrics, null, 2)}</pre>
      <pre>{JSON.stringify(projection, null, 2)}</pre>
    </div>
  )
}

export default MetricsPanel
