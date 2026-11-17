import { si } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { Prose, Tex } from '../../ui/Tex'
import type { Model } from './derive'

/**
 * P_B, P_R and P_conv on one shared, fixed scale: the full half-bar is V_B^2 / 4R, the largest power a
 * motor can convert (at e_ind = V_B / 2). Negative power points left. Longer bars are cut and marked;
 * the numbers are always the true values.
 */
export function PowerBars({ model }: { model: Model }) {
  const { op } = model
  const full = (op.VB * op.VB) / (4 * op.R)
  const rows = [
    { tex: 'P_B = V_B\\,i', value: op.PB, color: MC.voltage, note: op.PB < 0 ? 'into the battery (charging)' : 'out of the battery' },
    { tex: 'P_R = i^2R', value: op.PR, color: 'var(--faint)', note: 'lost as heat in R' },
    { tex: 'P_{conv} = e_{ind}\\,i', value: op.Pconv, color: MC.mechanical, note: op.Pconv < 0 ? 'mechanical to electric' : op.Pconv > 0 ? 'electric to mechanical' : 'no conversion' },
  ]
  return (
    <div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const frac = Math.min(1, Math.abs(r.value) / full)
          const cut = Math.abs(r.value) > full
          return (
            <div key={r.tex} className="grid grid-cols-[7.5rem_minmax(0,1fr)_6.5rem] items-center gap-x-3">
              <span className="text-[12.5px]"><Tex>{r.tex}</Tex></span>
              <div className="relative h-3" role="img" aria-label={`${r.note}: ${si(r.value, 'W', 4)}`}>
                <div className="absolute inset-y-0 left-1/2 w-px bg-mute" />
                <div className="absolute inset-y-0 left-0 right-0 border-y border-rule opacity-60" />
                {r.value !== 0 && (
                  <div
                    className="absolute inset-y-[2px] rounded-[1px]"
                    style={{
                      background: r.color,
                      width: `calc(${frac * 50}% - ${cut ? 6 : 0}px)`,
                      ...(r.value > 0 ? { left: 'calc(50% + 1px)' } : { right: 'calc(50% + 1px)' }),
                    }}
                  />
                )}
                {cut && (
                  <span className="num absolute -top-[3px] text-[12px] leading-none text-ink" style={r.value > 0 ? { right: -1 } : { left: -1 }}>
                    {r.value > 0 ? '»' : '«'}
                  </span>
                )}
              </div>
              <span className="num text-right text-[13px]">{si(r.value, 'W', 4)}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-1 grid grid-cols-[7.5rem_minmax(0,1fr)_6.5rem] gap-x-3 text-[10.5px] text-faint">
        <span />
        <span className="num flex justify-between"><span>−{si(full, 'W', 3)}</span><span>0</span><span>+{si(full, 'W', 3)}</span></span>
        <span />
      </div>
      <p className="mt-2 text-[11.5px] leading-snug text-mute">
        <Prose>{`Shared scale: half a bar is $V_B^2/4R$ = ${si(full, 'W', 3)}, the largest power the loop can convert as a motor. « » marks a bar cut at the edge. Left of 0: negative power.`}</Prose>
      </p>
      <div className="mt-3 flex flex-col gap-1 border-t border-rule pt-2.5 text-[13px] leading-relaxed">
        <p>
          <span style={{ color: MC.mechanical }}><Tex>{'P_{shaft} = \\tau_{ind}\\,\\omega'}</Tex></span>{' '}
          <span className="num">= {si(op.Pshaft, 'W', 4)}</span>
          <span className="text-mute">{op.Pshaft > 0 ? ' (delivered to the load)' : op.Pshaft < 0 ? ' (taken from the shaft)' : ''}</span>
        </p>
        <p className="text-mute">
          <Prose>{`Why the difference? $P_B - P_{conv} = i^2R$: ${si(op.PB, 'W', 4)} − (${si(op.Pconv, 'W', 4)}) = ${si(op.PR, 'W', 4)}, lost in the resistance.`}</Prose>
        </p>
      </div>
    </div>
  )
}
