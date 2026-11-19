import { Button, RefreshIcon } from '../../ui/buttons'
import { useMemo, useState } from 'react'
import { Segmented } from '../../ui/controls'
import { Tex } from '../../ui/Tex'
import { WindingSpec, analyze, buildWinding, cleanAngle, randomExamWinding } from './engine'
import { DevelopedDiagram } from './DevelopedDiagram'
import { EMPTY_ANSWER, ExamAnswer, Graded, grade } from './exam'

const FIELD = 'num h-8 w-full rounded-[3px] border border-rule bg-transparent px-2 text-[13px] text-ink outline-none focus:border-ink'

/** "Identify the winding": a random drawable winding without type labels; the student answers; Check grades it. */
export function ExamMode() {
  const [spec, setSpec] = useState<WindingSpec>(() => randomExamWinding(Math.random))
  const [ans, setAns] = useState<ExamAnswer>(EMPTY_ANSWER)
  const [graded, setGraded] = useState<Graded[] | null>(null)
  const w = useMemo(() => { const b = buildWinding(spec); return b.ok ? b.winding : null }, [spec])
  // drawn at an angle where every brush touches exactly m segments, so no coil is being commutated
  const snap = useMemo(() => (w ? analyze(w, cleanAngle(w), 1, 1) : null), [w])
  const next = () => { setSpec(randomExamWinding(Math.random)); setAns(EMPTY_ANSWER); setGraded(null) }
  const set = (k: keyof ExamAnswer, v: string) => { setAns((a) => ({ ...a, [k]: v })); setGraded(null) }
  const mark = (k: keyof ExamAnswer) => graded?.find((g) => g.field === k)
  const num = (k: keyof ExamAnswer, label: React.ReactNode) => (
    <label className="flex flex-col gap-1 text-[12px] text-mute">
      <span>{label}</span>
      <input className={`${FIELD} ${mark(k) ? (mark(k)!.ok ? '!border-trn' : '!border-warn') : ''}`} inputMode="numeric" value={ans[k]}
        onChange={(e) => set(k, e.target.value)} aria-invalid={mark(k) ? !mark(k)!.ok : undefined} />
    </label>
  )
  if (!w || !snap) return null
  const score = graded ? graded.filter((g) => g.ok).length : 0
  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-1.5">
        <h3 className="tag !text-ink">Exam mode · Identify the winding</h3>
        <Button variant="primary" onClick={next} icon={<RefreshIcon />}>New winding</Button>
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-mute">
        Read the diagram as in the exam. The type is not shown. <Tex>{`N_C = ${spec.NC}`}</Tex> {spec.NC === 1 ? 'turn' : 'turns'} per coil; the poles are on the strip above the slots.
      </p>
      <DevelopedDiagram w={w} snap={snap} alphaStatic={snap.alpha} labels={false} className="mt-2.5" />
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 text-[12px] text-mute">
          <span>Type</span>
          <Segmented<'lap' | 'wave'> label="Type" value={(ans.type || 'none') as 'lap' | 'wave'} onChange={(v) => set('type', v)}
            options={[{ value: 'lap', label: 'lap' }, { value: 'wave', label: 'wave' }]} />
        </div>
        <div className="flex flex-col gap-1 text-[12px] text-mute">
          <span>Plex</span>
          <Segmented<'1' | '2'> label="Plex" value={(ans.plex || 'none') as '1' | '2'} onChange={(v) => set('plex', v)}
            options={[{ value: '1', label: 'simplex' }, { value: '2', label: 'duplex' }]} />
        </div>
        <div className="flex flex-col gap-1 text-[12px] text-mute">
          <span>Direction</span>
          <Segmented<'p' | 'r'> label="Direction" value={(ans.dir || 'none') as 'p' | 'r'} onChange={(v) => set('dir', v)}
            options={[{ value: 'p', label: 'progressive' }, { value: 'r', label: 'retrogressive' }]} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {num('coils', 'coils')}
        {num('conductors', 'conductors')}
        {num('segments', 'segments')}
        {num('paths', 'parallel paths')}
        {num('yc', <>commutator pitch <Tex>{'y_c'}</Tex></>)}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="primary" onClick={() => setGraded(grade(spec, ans))}>Check</Button>
        {graded && <span className="num text-[12.5px] text-ink">{score} / {graded.length} right</span>}
      </div>
      {graded && (
        <ul className="mt-3 flex flex-col gap-1.5 text-[12.5px] leading-snug">
          {graded.map((g) => (
            <li key={g.field} className="flex gap-2">
              <span className={`num w-14 shrink-0 font-medium ${g.ok ? 'text-trn' : 'text-warn'}`}>{g.ok ? '✓ right' : '✗ wrong'}</span>
              <span><span className="text-ink">{g.label}: {g.expected}.</span> <span className="text-mute">{g.reason}</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
