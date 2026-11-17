/** Number formatting with SI prefixes, and parsing of engineering input. */

const PREFIXES: [number, string][] = [
  [1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'],
]

/** Non-breaking space: a number never wraps away from its unit. */
export const NB = '\u00a0'

/** Fixed number of significant figures, without exponent notation in the usual range. */
export function sig(x: number, n = 4): string {
  if (!Number.isFinite(x)) return Number.isNaN(x) ? '—' : x > 0 ? '∞' : '−∞'
  if (x === 0) return '0'
  const a = Math.abs(x)
  if (a >= 1e6 || a < 1e-4) {
    const e = Math.floor(Math.log10(a))
    const m = (x / 10 ** e).toPrecision(n)
    return `${m.replace('-', '−')}×10${superscript(e)}`
  }
  const digits = Math.max(0, n - 1 - Math.floor(Math.log10(a)))
  // Round to n significant figures also for large values (705358 -> 705400 with n = 4).
  return Number(x.toPrecision(n)).toFixed(Math.min(20, digits)).replace('-', '−')
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const superscript = (e: number) => String(e).split('').map((ch) => SUP[ch]).join('')

/** Value with an SI prefix: si(2.4e9, 'Hz') -> "2.400 GHz". */
export function si(x: number, unit: string, n = 4): string {
  if (!Number.isFinite(x)) return `${sig(x)}${unit ? NB + unit : ''}`
  if (x === 0) return `0${NB}${unit}`
  const a = Math.abs(x)
  for (const [f, p] of PREFIXES) {
    if (a >= f * 0.99999) return `${sig(x / f, n)}${NB}${p}${unit}`
  }
  return `${sig(x, n)}${NB}${unit}`
}

/** Plain decimal with fixed places and a typographic minus. */
export const fixed = (x: number, places: number): string =>
  Number.isFinite(x) ? x.toFixed(places).replace('-', '−') : sig(x)

export const deg = (rad: number, places = 2): string => `${fixed((rad * 180) / Math.PI, places)}°`

/**
 * Phase angle in degrees with enough decimals to show a small departure from 0° or ±180°
 * (179.99986°, not a rounded 180.00°). Formats the exact value; nothing is snapped.
 */
export function phaseDeg(rad: number): string {
  const d = (rad * 180) / Math.PI
  return `${fixed(d + 0, phasePlaces(d))}°`
}

/** Decimals for an angle in degrees: 2 normally, more when it is within 0.01° of 0° or ±180°. */
export function phasePlaces(d: number): number {
  const dev = Math.min(Math.abs(d), Math.abs(180 - Math.abs(d)))
  return dev > 0 && dev < 0.01 ? Math.min(8, Math.ceil(-Math.log10(dev)) + 1) : 2
}
export const pct = (fraction: number, places = 1): string => `${fixed(fraction * 100, places)}${NB}%`

const MULT: Record<string, number> = { T: 1e12, G: 1e9, M: 1e6, k: 1e3, K: 1e3, m: 1e-3, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, n: 1e-9, p: 1e-12 }

/**
 * Parse engineering input: "2.4e9", "2.4 GHz", "5MHz", "10k", "58 MS/m", "1e-4", "30°".
 * Prefixes are case-sensitive (m = milli, M = mega), except that "hz" units accept any case
 * ("5 mhz" is read as megahertz, because millihertz is never meant here).
 * Returns null when the text is not a number.
 */
export function parseEng(text: string): number | null {
  const t = text.trim().replace(/−/g, '-').replace(/,/g, '.').replace(/×10\^?/, 'e')
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*(.*)$/.exec(t)
  if (!m) return null
  const value = Number(m[1])
  if (!Number.isFinite(value)) return null
  const rest = m[2].trim()
  if (rest === '') return value
  const hz = /^([a-zA-Zµμ]?)hz$/i.exec(rest)
  if (hz) {
    const p = hz[1]
    if (p === '') return value
    const mult = p === 'm' || p === 'M' ? 1e6 : p === 'g' ? 1e9 : p === 't' ? 1e12 : MULT[p]
    return mult === undefined ? null : value * mult
  }
  const first = rest[0]
  // A lone unit that happens to start with a prefix letter ("m" = metres, "T" = tesla, not tera).
  if (/^(m|T|S\/m|V\/m|Np\/m|rad\/m|°|deg|Ω)$/.test(rest)) return value
  if (first in MULT && rest.length >= 1) return value * MULT[first]
  return /^[a-zA-Z°Ω/·]+$/.test(rest) ? value : null
}

/** LaTeX for a real number with n significant figures. */
export function texNum(x: number, n = 4): string {
  if (!Number.isFinite(x)) return Number.isNaN(x) ? '\\text{—}' : x > 0 ? '\\infty' : '-\\infty'
  if (x === 0) return '0'
  const a = Math.abs(x)
  if (a >= 1e5 || a < 1e-3) {
    const e = Math.floor(Math.log10(a))
    let m = (x / 10 ** e).toPrecision(n)
    if (m.includes('.')) m = m.replace(/\.?0+$/, '')
    return m === '1' ? `10^{${e}}` : `${m}\\times10^{${e}}`
  }
  const digits = Math.max(0, n - 1 - Math.floor(Math.log10(a)))
  return x.toFixed(Math.min(20, digits))
}

/** LaTeX for a complex number in rectangular form, a + jb. */
export function texRect(z: { re: number; im: number }, n = 4): string {
  const tiny = 1e-9 * Math.hypot(z.re, z.im)
  if (Math.abs(z.im) <= tiny) return texNum(z.re, n)
  if (Math.abs(z.re) <= tiny) return `${z.im < 0 ? '-' : ''}j${texNum(Math.abs(z.im), n)}`
  return `${texNum(z.re, n)} ${z.im < 0 ? '-' : '+'} j${texNum(Math.abs(z.im), n)}`
}

/** LaTeX for a complex number in polar form, |z| ∠ angle. */
export function texPolar(z: { re: number; im: number }, n = 4): string {
  const a = (Math.atan2(z.im, z.re) * 180) / Math.PI + 0
  const m = Math.hypot(z.re, z.im)
  // Near |z| = 1 (good conductors) show enough digits that the departure from 1 and from 180° is visible.
  const mag = Math.abs(1 - m) < 1e-3 && Math.abs(1 - m) > 1e-12 ? m.toFixed(7) : texNum(m, n)
  return `${mag}\\,\\underline{/${a.toFixed(phasePlaces(a))}^\\circ}`
}

/** "Nice" 1-2-5 length not larger than x. */
export function niceBelow(x: number): number {
  const e = Math.floor(Math.log10(x))
  const m = x / 10 ** e
  return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * 10 ** e
}

/** Up to 6 significant figures, trailing zeros dropped, no SI prefix: "0.392699 Wb", "0.25 V·s" (as the textbook writes them). */
export function plain(x: number, unit: string): string {
  if (!Number.isFinite(x)) return sig(x)
  const a = Math.abs(x)
  const body = a !== 0 && (a >= 1e6 || a < 1e-4) ? sig(x, 4) : String(Number(x.toPrecision(6))).replace('-', '−')
  return unit ? `${body}${NB}${unit}` : body
}

/** Short SI value for scale bars and ticks: "20 cm" style is avoided, trailing zeros are dropped ("200 mm", "1.5 µm"). */
export function siShort(x: number, unit: string): string {
  if (x === 0) return `0 ${unit}`
  const a = Math.abs(x)
  for (const [f, p] of PREFIXES) {
    if (a >= f * 0.99999) return `${String(Number((x / f).toPrecision(3))).replace('-', '−')} ${p}${unit}`
  }
  return `${sig(x, 3)} ${unit}`
}
