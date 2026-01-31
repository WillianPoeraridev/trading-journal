import type { Settings } from '../core/types'

type SettingsFormProps = {
  settings: Settings
  onChange: (settings: Settings) => void
}

function SettingsForm({ settings, onChange }: SettingsFormProps) {
  void onChange
  return (
    <div>
      <h2>Configuracoes</h2>
      <pre>{JSON.stringify(settings, null, 2)}</pre>
    </div>
  )
}

export default SettingsForm
