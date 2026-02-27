export function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '\f';
}

export function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

export function isUpper(ch: string): boolean {
  return ch >= 'A' && ch <= 'Z';
}

export function isLower(ch: string): boolean {
  return ch >= 'a' && ch <= 'z';
}

export function isLetter(ch: string): boolean {
  return isUpper(ch) || isLower(ch);
}

export function isHex(ch: string): boolean {
  return isDigit(ch) || (ch >= 'A' && ch <= 'F') || (ch >= 'a' && ch <= 'f');
}

export function isSpecial(ch: string): boolean {
  return ch === '_' || ch === '-';
}

export function isKeywordChar(ch: string): boolean {
  return isUpper(ch) || isDigit(ch) || ch === '_';
}

export function isTagNameChar(ch: string): boolean {
  return isLetter(ch) || isDigit(ch) || ch === '_';
}
