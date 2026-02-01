import type { Settings } from '../core/types'
import { stringifyPretty } from '../core/format'

type SettingsFormProps = {
  settings: Settings
  onChange: (settings: Settings) => void
}

function SettingsForm({ settings, onChange }: SettingsFormProps) {
  void onChange
  return (
    <div>
      <h2>Configuracoes</h2>
      <pre>{stringifyPretty(settings, 2)}</pre>
    </div>
  )
}

export default SettingsForm
