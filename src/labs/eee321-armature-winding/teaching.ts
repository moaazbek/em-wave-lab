import { si, sig } from '../../ui/format'
import { Model, windingName } from './derive'
import type { ChangeKind } from './state'

/** Plain sentences, maths between dollar signs. Short sentences, no idioms. */

const V = (x: number) => si(x, 'V', 4)
const ohm = (x: number) => si(x, 'Ω', 4)

export function situation(m: Model): string[] {
  const { f, state: s, build } = m
  const out: string[] = []
  const pathRule = s.type === 'lap' ? `$a = mP$ = ${f.a}` : s.type === 'wave' ? `$a = 2m$ = ${f.a}, whatever the number of poles` : `$a = 2Pm_{lap}$ = ${f.a}`
  out.push(`This is a ${windingName(s)} winding with ${s.C} coils and ${s.P} poles: ${pathRule}. Each path has $C/a$ = ${sig(f.coilsPerPath, 4)} coils, or $Z/a$ = ${sig(f.condPerPath, 4)} conductors, in series.`)
  out.push(`At $n$ = ${sig(s.n, 4)} r/min, $E_A = K\\phi\\omega$ = ${V(f.EA)} and $R_A$ = ${ohm(f.RA)}.${s.load ? ` With $R_L$ = ${ohm(s.RL)}, $I_A$ = ${si(f.IA, 'A', 4)}, ${si(f.Ipath, 'A', 4)} in each path, and $V_T$ = ${V(f.VT)}.` : ''}`)
  if (!build.ok) out.push(`The diagram is not drawn: ${build.reason}`)
  else if (s.beta < 1) out.push(`The pole-arc fraction is ${s.beta}: some conductors are between the poles, so the brush voltage ripples and its average is below $K\\phi\\omega$ (Chapman p. 448).`)
  return out
}

export function reaction(a: Model, b: Model, change: ChangeKind): string | null {
  const s0 = a.state, s1 = b.state
  const ratio = (x: number, y: number) => {
    const r = y / x
    if (Math.abs(r - 1) < 1e-12) return 'stays the same'
    const nice = (q: number) => (Math.abs(q - Math.round(q)) < 1e-9 ? String(Math.round(q)) : sig(q, 3))
    return r > 1 ? `is multiplied by ${nice(r)}` : `falls to 1/${nice(1 / r)}`
  }
  switch (change) {
    case 'm':
      if (s0.m === s1.m) return null
      return `${windingName(s1)} instead of ${windingName(s0)}: $a$ = ${b.f.a} instead of ${a.f.a}, so each path has ${b.f.a > a.f.a ? 'fewer' : 'more'} conductors. $E_A$ ${ratio(a.f.EA, b.f.EA)} and $R_A$ ${ratio(a.f.RA, b.f.RA)}.`
    case 'type':
      if (s0.type === s1.type) return null
      if (s1.type === 'wave') return `Wave winding: only ${b.f.a} paths, whatever the number of poles. $E_A$ ${ratio(a.f.EA, b.f.EA)} and $R_A$ ${ratio(a.f.RA, b.f.RA)}.`
      if (s1.type === 'frog') return `Frog-leg winding: a lap and a wave winding together, $a = 2Pm_{lap}$ = ${b.f.a}. $E_A$ ${ratio(a.f.EA, b.f.EA)}.`
      return `Lap winding: $a = mP$ = ${b.f.a} paths. $E_A$ ${ratio(a.f.EA, b.f.EA)} and $R_A$ ${ratio(a.f.RA, b.f.RA)}.`
    case 'dir':
      return s1.progressive
        ? `Progressive: each coil ends ahead of its start, $y_c$ = ${b.f.yc === null ? '—' : sig(b.f.yc, 4)}. The brush polarity reverses for the same rotation.`
        : `Retrogressive: each coil ends behind its start, $y_c$ = ${b.f.yc === null ? '—' : sig(b.f.yc, 4)}. The brush polarity reverses for the same rotation.`
    case 'P':
      if (s0.P === s1.P) return null
      return `${s1.P} poles: $a$ = ${b.f.a}${s1.type === 'wave' ? ' (a wave winding keeps 2 paths)' : ''}, $K = ZP/2\\pi a$ = ${sig(b.f.K, 5)}, so $E_A$ ${ratio(a.f.EA, b.f.EA)}.`
    case 'C': case 'NC':
      return `$Z = 2CN_C$ = ${b.f.Z} conductors (it was ${a.f.Z}). $E_A$ ${ratio(a.f.EA, b.f.EA)} and $R_A$ ${ratio(a.f.RA, b.f.RA)}.${b.build.ok ? '' : ' ' + b.build.reason}`
    case 'chord':
      return `Coil span $y_s$ = ${b.f.ys} slots: pitch factor $p$ = ${sig(b.f.p, 4)} %. The book's $E_A$ formula does not change; the drawn coil voltages do when sides share a pole.`
    case 'phi': case 'n':
      return `$E_A = K\\phi\\omega$ ${ratio(a.f.EA, b.f.EA)}: it is proportional to both $\\phi$ and $\\omega$. Now $E_A$ = ${V(b.f.EA)}.`
    case 'R': case 'Rper':
      return `$R_A$ = ${ohm(b.f.RA)}: ${sig(b.f.elementsPerPath, 5)} elements in series per path, then $a$ = ${b.f.a} paths in parallel.`
    case 'load': case 'RL': case 'ignoreRA':
      return s1.load ? `With the load, $I_A = E_A/(R_A + R_L)$ = ${si(b.f.IA, 'A', 4)} and $V_T$ = ${V(b.f.VT)}. The countertorque is $K\\phi I_A$ = ${si(b.f.tau, 'N·m', 4)}.` : 'Open circuit: no current, $V_T = E_A$.'
    case 'beta':
      return s1.beta < 1 ? `Pole-arc fraction ${s1.beta}: conductors in the dead zone give no voltage, so the brush voltage ripples below $K\\phi\\omega$.` : 'Pole-arc fraction 1: every conductor is under a pole, as the book assumes.'
    case 'preset':
      return 'You loaded a preset. Compare the numbers with the book.'
    case 'experiment':
      return 'A guided experiment is loaded. Read its question and predict the answer before you look at the numbers.'
    case 'reveal':
      return 'The lab now shows the answer. Compare it with your prediction.'
    case 'init':
      return null
  }
}
