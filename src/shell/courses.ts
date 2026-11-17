/** Courses served by the site. Each lab belongs to one; the footer and the textbook come from here. */
export type CourseCode = 'EEE 361' | 'EEE 321'

export interface Course {
  code: CourseCode
  name: string
  /** Course textbook, cited in the footer and on the home page. */
  book: { author: string; title: string; edition: string }
}

export const COURSES: readonly Course[] = [
  {
    code: 'EEE 361',
    name: 'Electromagnetic Waves',
    book: { author: 'Cheng', title: 'Field and Wave Electromagnetics', edition: '2nd ed.' },
  },
  {
    code: 'EEE 321',
    name: 'Electromechanical Energy Conversion – I',
    book: { author: 'Chapman', title: 'Electric Machinery Fundamentals', edition: '5th ed.' },
  },
]

export const getCourse = (code: CourseCode): Course => COURSES.find((c) => c.code === code)!
