import { CourseCode, getCourse } from './courses'

/** Per-course footer line, shown at the bottom of every page of that course. */
export function Disclaimer({ course = 'EEE 361', className = '' }: { course?: CourseCode; className?: string }) {
  const { book } = getCourse(course)
  return (
    <p className={`text-[12px] leading-relaxed text-faint ${className}`}>
      {/* Built as whole strings: the same text nodes (and so the same kerning) as the original EEE 361 footer. */}
      {`Student project for ${course}. Not an official course resource. Check results against the textbook (${book.author},`}{' '}
      <i>{book.title}</i>{`, ${book.edition}).`}
    </p>
  )
}
