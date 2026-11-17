import { WindingSpec, buildWinding, formula } from './engine'

export interface ExamAnswer {
  type: 'lap' | 'wave' | ''
  plex: '1' | '2' | ''
  dir: 'p' | 'r' | ''
  coils: string
  conductors: string
  segments: string
  paths: string
  yc: string
}

export const EMPTY_ANSWER: ExamAnswer = { type: '', plex: '', dir: '', coils: '', conductors: '', segments: '', paths: '', yc: '' }

export interface Graded {
  field: keyof ExamAnswer
  label: string
  ok: boolean
  /** The right answer, as the student would write it. */
  expected: string
  /** One-line reason in the course's words. */
  reason: string
}

const num = (s: string): number | null => {
  const t = s.trim().replace(/−/g, '-').replace(/^\+/, '')
  if (t === '') return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}

/** Grade an "Identify the winding" answer against the engine's own winding. */
export function grade(spec: WindingSpec, ans: ExamAnswer): Graded[] {
  const b = buildWinding(spec)
  if (!b.ok) throw new Error(b.reason)
  const w = b.winding
  const f = formula(spec, { phi: 1, n: 1, R: 0, Rper: 'turn', load: false, RL: 1, ignoreRA: false })
  const { C, P, NC, m } = spec
  const lap = spec.type === 'lap'
  const yc = w.yc
  const ycText = yc > 0 ? `+${yc}` : String(yc)
  const out: Graded[] = []
  out.push({
    field: 'type', label: 'Type', ok: ans.type === spec.type, expected: lap ? 'lap' : 'wave',
    reason: lap
      ? `Each coil ends on a segment ${Math.abs(yc) === 1 ? 'next to' : `${Math.abs(yc)} segments from`} its start → lap.`
      : `Each coil ends about two pole pitches away, y_c = ${yc} segments → wave.`,
  })
  out.push({
    field: 'plex', label: 'Plex', ok: ans.plex === String(m), expected: m === 1 ? 'simplex' : 'duplex',
    reason: lap
      ? `|y_c| = ${Math.abs(yc)} → ${m === 1 ? 'simplex' : 'duplex'}: ${w.cycles.length} separate closed winding${w.cycles.length > 1 ? 's' : ''}.`
      : 'Following the coils passes every segment once in one closed loop → simplex.',
  })
  out.push({
    field: 'dir', label: 'Progressive / retrogressive', ok: ans.dir === (spec.progressive ? 'p' : 'r'),
    expected: spec.progressive ? 'progressive' : 'retrogressive',
    reason: lap
      ? `y_c = ${ycText}: each coil ends ${yc > 0 ? 'ahead of' : 'behind'} its start → ${spec.progressive ? 'progressive' : 'retrogressive'}.`
      : `y_c = 2(C ${spec.progressive ? '+' : '−'} 1)/P = 2(${C} ${spec.progressive ? '+' : '−'} 1)/${P} = ${yc}: after P/2 coils the winding lands one segment ${spec.progressive ? 'ahead' : 'behind'} → ${spec.progressive ? 'progressive' : 'retrogressive'}.`,
  })
  out.push({ field: 'coils', label: 'Coils', ok: num(ans.coils) === C, expected: String(C), reason: `Count the coil loops: C = ${C}.` })
  out.push({ field: 'conductors', label: 'Conductors', ok: num(ans.conductors) === f.Z, expected: String(f.Z), reason: `Z = 2CN_C = 2(${C})(${NC}) = ${f.Z}.` })
  out.push({ field: 'segments', label: 'Commutator segments', ok: num(ans.segments) === C, expected: String(C), reason: `One segment per coil: ${C} segments.` })
  out.push({
    field: 'paths', label: 'Parallel paths', ok: num(ans.paths) === f.a, expected: String(f.a),
    reason: lap ? `Lap: a = mP = (${m})(${P}) = ${f.a}.` : 'Simplex wave: a = 2, whatever the number of poles.',
  })
  out.push({
    field: 'yc', label: 'Commutator pitch y_c', ok: num(ans.yc) === yc, expected: ycText,
    reason: lap ? `(7-25) y_c = ±m = ${ycText}.` : `(7-27) y_c = 2(C ± 1)/P = ${yc}.`,
  })
  return out
}
