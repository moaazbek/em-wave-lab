/** Labelled select with an optional "customized" tag (shown when the student changed a preset's values). */
export function SelectField<T extends string>({ id, label, value, options, onChange, customized = false }: {
  id: string
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
  customized?: boolean
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[12px] text-mute">{label}</label>
        {customized && <span className="tag !text-warn">customized</span>}
      </div>
      <select
        id={id}
        className="select mt-1 h-9 w-full rounded-[3px] border border-rule pl-2 pr-7 text-[13px] text-ink"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
