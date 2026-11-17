import { ThemeChoice, setThemeChoice, useTheme } from '../ui/theme'

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function ThemeToggle() {
  const { choice } = useTheme()
  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex items-center text-[11.5px]">
      {THEMES.map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={choice === t.value}
          onClick={() => setThemeChoice(t.value)}
          className={`h-7 px-1.5 ${choice === t.value ? 'text-ink underline decoration-1 underline-offset-4' : 'text-faint hover:text-ink'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
