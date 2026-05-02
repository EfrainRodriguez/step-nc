/**
 * Converts an EXPRESS LIKE pattern (ISO 10303-11 §12.6.7) to a JavaScript RegExp.
 * EXPRESS LIKE is always case-sensitive and must match the full string.
 */
export function expressLikeToRegex(pattern: string): RegExp {
  let regex = '^';
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i]!;

    if (ch === '\\') {
      i++;
      if (i < pattern.length) {
        regex += escapeRegexChar(pattern[i]!);
      }
    } else if (ch === '@') {
      regex += '[A-Za-z]';
    } else if (ch === '^') {
      regex += '[A-Z]';
    } else if (ch === '?') {
      regex += '.';
    } else if (ch === '$') {
      regex += '[0-9]';
    } else if (ch === '*') {
      regex += '.*';
    } else {
      regex += escapeRegexChar(ch);
    }

    i++;
  }

  regex += '$';
  return new RegExp(regex);
}

function escapeRegexChar(ch: string): string {
  return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
