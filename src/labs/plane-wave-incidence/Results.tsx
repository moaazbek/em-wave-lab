import { ReactNode } from 'react'
import {
  C, DEG, MediumClass, MediumParams, abs, arg, goodConductorApprox, incidentPowerDensity, lowLossApprox, pctError,
} from '../../physics'
import { Heading } from '../../ui/controls'
import { deg, fixed, pct, si, sig } from '../../ui/format'
import { Prose, Tex } from '../../ui/Tex'
import { CLASS_LABEL, Model } from './derive'

const rect = (z: C, n = 4) => {
  const tiny = 1e-9 * abs(z)
  if (Math.abs(z.im) <= tiny) return sig(z.re, n)
  return `${sig(z.re, n)} ${z.im < 0 ? '−' : '+'} j${sig(Math.abs(z.im), n)}`
}
const polar = (z: C, n = 4) => {
  // Near |z| = 1 (good conductors) four figures would hide the small departure from total reflection.
  const close = Math.abs(1 - abs(z)) < 1e-3 && Math.abs(1 - abs(z)) > 1e-12
  return `${close ? abs(z).toFixed(7) : sig(abs(z), n)} ∠ ${fixed(arg(z) / DEG + 0, close ? 4 : 2)}°`
}
/** A real value is shown with its sign, as in the textbook (Γ = −0.3820); a complex one in polar form. */
const isReal = (z: C) => Math.abs(z.im) <= 1e-9 * abs(z)
const value = (z: C, n = 4) => (isReal(z) ? sig(z.re, n) : polar(z, n))
/** The other form, for the advanced view. */
const otherForm = (z: C): [string, string] => (isReal(z) ? ['polar', polar(z)] : ['rectangular', rect(z)])

function Row({ sym, children, color, sub }: { sym: string; children: ReactNode; color?: string; sub?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
      <dt className="flex shrink-0 items-baseline gap-1.5">
        {color && <span className="inline-block h-2 w-2 translate-y-[-1px] rounded-full" style={{ background: color }} />}
        <Tex>{sym}</Tex>
        {sub && <span className="text-[11.5px] text-mute">{sub}</span>}
      </dt>
      <dd className="num min-w-0 text-right text-[13px]">{children}</dd>
    </div>
  )
}

function Badge({ cls }: { cls: MediumClass }) {
  const strong = cls === 'good-conductor' || cls === 'pec'
  return (
    <span className={`rounded-[3px] border px-1.5 py-px text-[11.5px] ${strong ? 'border-ink bg-ink text-bg' : 'border-faint text-ink'}`}>
      {CLASS_LABEL[cls]}
    </span>
  )
}

function Approx({ p }: { p: MediumParams }) {
  const m = p.medium, f = p.f
  const ll = lowLossApprox(m, f), gc = goodConductorApprox(m, f)
  const err = (a: number, e: number) => {
    const v = Math.abs(pctError(a, e))
    return v < 0.005 ? '<0.01 %' : v > 999 ? '>999 %' : `${sig(v, 2)} %`
  }
  const cell = (a: number, e: number, unit: string, valid: boolean) => (
    <td className={`py-[3px] pl-2 text-right align-top ${valid ? 'text-ink' : 'text-faint'}`}>
      <div>{si(a, unit, 4)}</div>
      <div className="text-[10.5px]">error {err(a, e)}</div>
    </td>
  )
  const rows: [string, number, number, number, string][] = [
    ['\\alpha', p.alpha, ll.alpha, gc.alpha, 'Np/m'],
    ['\\beta', p.beta, ll.beta, gc.beta, 'rad/m'],
    ['\\mathrm{Re}\\,\\eta', p.eta.re, ll.eta.re, gc.eta.re, 'Ω'],
    ['\\mathrm{Im}\\,\\eta', p.eta.im, ll.eta.im, gc.eta.im, 'Ω'],
  ]
  return (
    <div className="mt-2">
      <table className="num w-full text-[12px]">
        <thead>
          <tr className="text-[10.5px] text-mute">
            <th className="text-left font-normal" />
            <th className="pl-2 text-right font-normal">low-loss formula</th>
            <th className="pl-2 text-right font-normal">good-conductor formula</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([sym, e, a, b, u]) => (
            <tr key={sym} className="border-t border-rule">
              <td className="py-[3px] align-top"><Tex>{sym}</Tex></td>
              {cell(a, e, u, p.kind === 'low-loss')}
              {cell(b, e, u, p.kind === 'good-conductor')}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 text-[11.5px] leading-snug text-mute">
        Approximate formulas of § 8-3.1 and § 8-3.2 against the exact values above. An approximation is useful only
        where its error is small.
      </p>
    </div>
  )
}

function MediumBlock({ n, p, cls, name, advanced }: { n: 1 | 2; p: MediumParams; cls: MediumClass; name: string; advanced: boolean }) {
  const lossy = p.medium.sigma > 0
  return (
    <section>
      <Heading section={n === 1 ? '8-2' : lossy ? '8-3' : '8-2'}>Medium {n}</Heading>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[12.5px] text-mute">{name}</span>
        <Badge cls={cls} />
      </div>
      {cls === 'pec' ? (
        <p className="mt-2 text-[12.5px] leading-snug text-mute">
          <Prose>{'$\\sigma \\to \\infty$: no field inside, $\\eta_2 = 0$, $\\delta = 0$. The boundary carries a surface current.'}</Prose>
        </p>
      ) : (
        <dl className="mt-1.5">
          {lossy && <Row sym={`\\sigma_${n}/\\omega\\epsilon_${n}`} sub="loss tangent">{sig(p.lossTangent, 4)}</Row>}
          {(lossy || advanced) && <Row sym={`\\alpha_${n}`}>{si(p.alpha, 'Np/m')}</Row>}
          <Row sym={`\\beta_${n}`}>{si(p.beta, 'rad/m')}</Row>
          <Row sym={`\\eta_${n}`}>{rect(p.eta)} Ω</Row>
          {(advanced || lossy) && p.eta.im !== 0 && <Row sym={`\\eta_${n}`} sub="polar">{polar(p.eta)} Ω</Row>}
          {advanced && <Row sym={`\\gamma_${n}`}>{rect(p.gamma)} m⁻¹</Row>}
          <Row sym={`u_{p${n}}`}>{si(p.up, 'm/s')}</Row>
          <Row sym={`\\lambda_${n}`}>{si(p.lambda, 'm')}</Row>
          {lossy && <Row sym={`\\delta_${n}`} sub="skin depth">{si(p.delta, 'm')}</Row>}
        </dl>
      )}
      {advanced && lossy && cls !== 'pec' && <Approx p={p} />}
    </section>
  )
}

export function Results({ model }: { model: Model }) {
  const { sol, state } = model
  const adv = state.advanced
  const sub = state.pol === 'perp' ? '\\perp' : '\\parallel'
  const polSection = sol.regime === 'pec' ? (model.normal ? '8-6' : state.pol === 'perp' ? '8-7.1' : '8-7.2')
    : model.normal ? '8-8' : sol.regime === 'total-reflection' ? '8-10.1' : state.pol === 'perp' ? '8-10.2' : '8-10.3'
  const lossy = sol.regime === 'lossy'
  const tir = sol.regime === 'total-reflection'
  const tb = model.thetaB[state.pol]
  return (
    <div className="flex flex-col gap-6">
      <section>
        <Heading section={polSection}>Interface</Heading>
        <p className="mt-2 text-[12.5px] text-mute">
          {state.pol === 'perp' ? 'Perpendicular polarization (TE)' : 'Parallel polarization (TM)'}
          {lossy && !model.normal && <span className="ml-2 rounded-[3px] border border-warn px-1 text-[11px] text-warn">beyond the textbook</span>}
        </p>
        <dl className="mt-1.5">
          <Row sym={model.normal ? '\\Gamma' : `\\Gamma_${sub}`} color="var(--ref)">{value(sol.Gamma)}</Row>
          {adv && <Row sym={model.normal ? '\\Gamma' : `\\Gamma_${sub}`} sub={otherForm(sol.Gamma)[0]}>{otherForm(sol.Gamma)[1]}</Row>}
          <Row sym={model.normal ? '\\tau' : `\\tau_${sub}`} color="var(--trn)">{value(sol.tau)}</Row>
          {adv && <Row sym={model.normal ? '\\tau' : `\\tau_${sub}`} sub={otherForm(sol.tau)[0]}>{otherForm(sol.tau)[1]}</Row>}
          <Row sym="\theta_t" color="var(--trn)">
            {sol.regime === 'pec' ? 'no transmitted wave'
              : tir ? 'none (total reflection)'
              : sol.thetaT !== null ? deg(sol.thetaT, 3)
              : model.normal ? deg(0, 3) : 'complex, no single real angle'}
          </Row>
          {adv && lossy && !model.normal && <Row sym="\cos\theta_t">{rect(sol.cosThetaT)}</Row>}
          {tir && <Row sym="\alpha_{2z}" sub="evanescent decay">{si(-sol.k2z.im, 'Np/m')}</Row>}
          <Row sym="\theta_c" sub="§ 8-10.1">{model.thetaC !== null ? deg(model.thetaC, 3) : 'none'}</Row>
          <Row sym={`\\theta_{B${sub}}`} sub="Brewster">{tb !== null ? deg(tb, 3) : 'none'}</Row>
          {adv && <Row sym={`\\theta_{B${state.pol === 'perp' ? '\\parallel' : '\\perp'}}`} sub="other polarization">
            {model.thetaB[state.pol === 'perp' ? 'par' : 'perp'] !== null ? deg(model.thetaB[state.pol === 'perp' ? 'par' : 'perp']!, 3) : 'none'}
          </Row>}
          {sol.regime === 'pec' && (
            <Row sym="|\mathbf{J}_s|" sub={<>along <Tex>{`\\mathbf{a}_${state.pol === 'perp' ? 'y' : 'x'}`}</Tex></>}>
              {si(abs(model.js.x) + abs(model.js.y), 'A/m')}
            </Row>
          )}
        </dl>
      </section>

      <section>
        <Heading section="8-5">Average power across the boundary</Heading>
        <div className="mt-3 flex h-2.5 w-full gap-[2px]" role="img" aria-label={`Reflected ${pct(sol.R)}, entering Medium 2 ${pct(sol.T)}`}>
          {sol.R > 0.0005 && <div className="h-full rounded-[1px] bg-ref" style={{ width: `${sol.R * 100}%` }} />}
          {sol.T > 0.0005 && <div className="h-full rounded-[1px] bg-trn" style={{ width: `${sol.T * 100}%` }} />}
        </div>
        <dl className="mt-2">
          <Row sym="|\Gamma|^2" color="var(--ref)" sub="reflected">{pct(sol.R, 2)}</Row>
          <Row sym="1-|\Gamma|^2" color="var(--trn)" sub={lossy ? 'enters and is absorbed' : tir ? 'transmitted' : sol.regime === 'pec' ? 'transmitted' : 'transmitted'}>
            {pct(sol.T, sol.T > 0 && sol.T < 0.001 ? 4 : 2)}
          </Row>
          {adv && <Row sym="|\tau|^2" sub="not a power fraction">{sig(abs(sol.tau) ** 2, 4)}</Row>}
          <Row sym="\mathscr{P}_{av,i}" color="var(--inc)" sub="incident">{si(incidentPowerDensity(sol), 'W/m²')}</Row>
        </dl>
        <p className="mt-1.5 text-[11.5px] leading-snug text-mute">
          <Prose>{lossy
            ? `$\\Gamma$ and $\\tau$ are field ratios. The power that enters Medium 2 is absorbed there as $e^{-2\\alpha_2 z}$; $|\\tau|^2$ is not a power fraction.`
            : `$\\Gamma$ and $\\tau$ are field ratios. The fractions are for power flow along $z$; $|\\tau|^2$ is not the transmitted power fraction.`}</Prose>
        </p>
      </section>

      <section>
        <Heading section={sol.regime === 'pec' ? '8-6' : '8-8'}>Standing wave in Medium 1</Heading>
        {model.normal ? (
          <dl className="mt-1.5">
            <Row sym="S" sub="standing-wave ratio">{sig(model.sw.S, 4)}</Row>
            {sol.R > 1e-12 && (
              <>
                <Row sym="|E|_{\max}" sub="nearest to boundary">z = {model.sw.zMax[0] === 0 ? '0' : si(model.sw.zMax[0], 'm')}</Row>
                <Row sym="|E|_{\min}" sub="nearest to boundary">z = {model.sw.zMin[0] === 0 ? '0' : si(model.sw.zMin[0], 'm')}</Row>
              </>
            )}
            <p className="mt-1.5 text-[11.5px] leading-snug text-mute">
              <Prose>{model.sw.atInterface === 'max' ? '$\\Gamma > 0$: $|E|$ is maximum at the interface.'
                : model.sw.atInterface === 'min' ? '$\\Gamma < 0$: $|E|$ is minimum at the interface.'
                : sol.R <= 1e-12 ? 'No reflection, so there is no standing wave.'
                : `$\\Gamma$ is complex (angle ${fixed(arg(sol.Gamma) / DEG, 2)}°), so the interface is not exactly an extremum of $|E|$; it is close to a ${Math.abs(arg(sol.Gamma)) > Math.PI / 2 ? 'minimum' : 'maximum'}.`}</Prose>
            </p>
          </dl>
        ) : (
          <p className="mt-2 text-[12.5px] leading-snug text-mute">
            <Prose>{'$S$ is defined for normal incidence. Set $\\theta_i = 0$ to read it.'}</Prose>
          </p>
        )}
      </section>

      <MediumBlock n={1} p={model.p1} cls={model.cls1} name={model.name1} advanced={adv} />
      <MediumBlock n={2} p={model.p2} cls={model.cls2} name={model.name2} advanced={adv} />
    </div>
  )
}
