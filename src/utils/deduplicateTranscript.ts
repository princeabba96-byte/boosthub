/**
 * Deduplicates consecutive repeated words and n-grams (1-gram to 10-gram repetitions)
 * e.g., "life is not all life is not all they say it is" -> "life is not all they say it is"
 * "LIFE IS NOT LIFE IS NOT" -> "LIFE IS NOT"
 */
export function deduplicateNGrams(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return text.trim();

  let changed = true;
  let iterations = 0;

  // Run up to 10 passes to eliminate nested or multi-level repeats
  while (changed && iterations < 10) {
    changed = false;
    iterations++;

    // Check n-gram lengths from larger down to 1
    const maxN = Math.min(12, Math.floor(words.length / 2));
    for (let n = maxN; n >= 1; n--) {
      for (let i = 0; i <= words.length - 2 * n; i++) {
        const first = words
          .slice(i, i + n)
          .map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, ''))
          .join(' ');
        const second = words
          .slice(i + n, i + 2 * n)
          .map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, ''))
          .join(' ');

        if (first && first === second) {
          // Remove the duplicate consecutive block
          words.splice(i + n, n);
          changed = true;
          break; // restart check for next pass
        }
      }
      if (changed) break;
    }
  }

  // Final 1-gram single word repeat check (e.g. "is is" -> "is")
  const dedupedSingles: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const curr = words[i];
    const prev = dedupedSingles[dedupedSingles.length - 1];
    if (
      prev &&
      prev.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
        curr.toLowerCase().replace(/[^a-z0-9]/gi, '')
    ) {
      continue;
    }
    dedupedSingles.push(curr);
  }

  return dedupedSingles.join(' ');
}
