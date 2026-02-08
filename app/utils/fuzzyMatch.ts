/**
 * Normalize a string: lowercase, remove accents/diacritics, collapse whitespace.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate bigrams (pairs of consecutive characters) from a string.
 */
function bigrams(str: string): Set<string> {
  const set = new Set<string>()
  for (let i = 0; i < str.length - 1; i++) {
    set.add(str.slice(i, i + 2))
  }
  return set
}

/**
 * Dice coefficient: measures similarity between two strings using bigrams.
 * Returns 0..1 (1 = identical).
 */
function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const bigramsA = bigrams(a)
  const bigramsB = bigrams(b)
  let intersection = 0
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++
  }
  return (2 * intersection) / (bigramsA.size + bigramsB.size)
}

/**
 * Check if `query` fuzzy-matches `text`.
 * Returns true if:
 *  - text contains the query as a substring (accent-insensitive), OR
 *  - any word in text has a Dice similarity ≥ threshold with any query word
 */
export function fuzzyMatch(text: string, query: string, threshold = 0.45): boolean {
  const normText = normalize(text)
  const normQuery = normalize(query)

  // Exact substring match (handles partial typing like "ren" → "renault")
  if (normText.includes(normQuery)) return true

  // Split into words and check each query word against text words
  const queryWords = normQuery.split(' ').filter(w => w.length > 1)
  const textWords = normText.split(' ').filter(w => w.length > 1)

  for (const qw of queryWords) {
    let wordMatched = false
    // Substring match per word
    for (const tw of textWords) {
      if (tw.includes(qw) || qw.includes(tw)) {
        wordMatched = true
        break
      }
    }
    if (!wordMatched) {
      // Fuzzy match per word (typo tolerance)
      for (const tw of textWords) {
        if (diceCoefficient(qw, tw) >= threshold) {
          wordMatched = true
          break
        }
      }
    }
    if (!wordMatched) return false
  }

  return queryWords.length > 0
}
