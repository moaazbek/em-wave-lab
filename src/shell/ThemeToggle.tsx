import { Segmented } from '../ui/controls'
import { ThemeChoice, setThemeChoice, useTheme } from '../ui/theme'

/** Colour theme: Auto (follow the system), Light, Dark — a small `Segmented` control. */
export function ThemeToggle() {
  const { choice } = useTheme()
  return (
    <Segmented<ThemeChoice> label="Colour theme" value={choice} onChange={setThemeChoice}
      options={[{ value: 'system', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
  )
}
