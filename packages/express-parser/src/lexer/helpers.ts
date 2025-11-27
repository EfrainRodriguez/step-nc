export function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
}

export function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

export function isIdentifierStart(ch: string): boolean {
  return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_';
}

export function isIdentifierPart(ch: string): boolean {
  return isIdentifierStart(ch) || isDigit(ch);
}
