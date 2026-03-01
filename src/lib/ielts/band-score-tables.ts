// Official IELTS Band Score Conversion Tables
// Source: British Council / IDP IELTS official band descriptors
// Format: [minCorrect, maxCorrect, bandScore]

export const LISTENING_BAND_TABLE: [number, number, number][] = [
  [39, 40, 9.0],
  [37, 38, 8.5],
  [35, 36, 8.0],
  [33, 34, 7.5],
  [30, 32, 7.0],
  [27, 29, 6.5],
  [23, 26, 6.0],
  [20, 22, 5.5],
  [16, 19, 5.0],
  [13, 15, 4.5],
  [10, 12, 4.0],
  [6, 9, 3.5],
  [4, 5, 3.0],
  [3, 3, 2.5],
  [2, 2, 2.0],
  [1, 1, 1.0],
  [0, 0, 0.0],
]

// Academic Reading conversion (harder than General)
export const READING_ACADEMIC_BAND_TABLE: [number, number, number][] = [
  [39, 40, 9.0],
  [37, 38, 8.5],
  [35, 36, 8.0],
  [33, 34, 7.5],
  [30, 32, 7.0],
  [27, 29, 6.5],
  [23, 26, 6.0],
  [19, 22, 5.5],
  [15, 18, 5.0],
  [13, 14, 4.5],
  [10, 12, 4.0],
  [6, 9, 3.5],
  [4, 5, 3.0],
  [3, 3, 2.5],
  [2, 2, 2.0],
  [1, 1, 1.0],
  [0, 0, 0.0],
]

// General Training Reading conversion (more correct answers needed for same band)
export const READING_GENERAL_BAND_TABLE: [number, number, number][] = [
  [40, 40, 9.0],
  [39, 39, 8.5],
  [37, 38, 8.0],
  [36, 36, 7.5],
  [34, 35, 7.0],
  [32, 33, 6.5],
  [30, 31, 6.0],
  [27, 29, 5.5],
  [23, 26, 5.0],
  [19, 22, 4.5],
  [15, 18, 4.0],
  [12, 14, 3.5],
  [9, 11, 3.0],
  [6, 8, 2.5],
  [4, 5, 2.0],
  [2, 3, 1.0],
  [0, 1, 0.0],
]

// Valid band score options (used in selects for Writing/Speaking)
export const BAND_SCORE_OPTIONS: number[] = [
  0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5,
  4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5,
  8.0, 8.5, 9.0,
]
