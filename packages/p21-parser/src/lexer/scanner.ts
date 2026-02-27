import { LexerContext } from './context';
import {
  isDigit,
  isHex,
  isKeywordChar,
  isLower,
  isUpper,
  isWhitespace,
} from './helpers';
import { SECTION_KEYWORD_MAP, SYMBOL_MAP } from './tables';

export function scanWhitespace(ctx: LexerContext): boolean {
  if (!isWhitespace(ctx.peek())) return false;
  while (!ctx.eof() && isWhitespace(ctx.peek())) {
    ctx.advance();
  }
  return true;
}

export function scanComment(ctx: LexerContext): boolean {
  if (!ctx.startsWith('/*')) return false;
  ctx.advance(2);
  while (!ctx.eof()) {
    if (ctx.startsWith('*/')) {
      ctx.advance(2);
      return true;
    }
    ctx.advance();
  }
  ctx.error('P21L001', 'Unterminated comment. Expected closing `*/`.');
  return true;
}

export function scanString(ctx: LexerContext): boolean {
  if (ctx.peek() !== "'") return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  ctx.advance(); // opening quote

  while (!ctx.eof()) {
    const ch = ctx.peek();
    if (ch === "'") {
      ctx.advance();
      if (ctx.peek() === "'") {
        // Doubled apostrophe escape — continue scanning
        ctx.advance();
        continue;
      }
      // End of string
      const text = ctx.slice(start, ctx.index);
      ctx.emit('STRING', text, start, line, col);
      return true;
    }
    ctx.advance();
  }

  const text = ctx.slice(start, ctx.index);
  ctx.error('P21L002', 'Unterminated string literal. Expected closing quote.');
  ctx.emit('STRING', text, start, line, col);
  return true;
}

export function scanBinary(ctx: LexerContext): boolean {
  if (ctx.peek() !== '"') return false;

  const next = ctx.peek(1);
  if (next !== '0' && next !== '1' && next !== '2' && next !== '3')
    return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  ctx.advance(); // opening "
  ctx.advance(); // initial digit (0-3)

  while (!ctx.eof() && isHex(ctx.peek())) {
    ctx.advance();
  }

  if (ctx.peek() === '"') {
    ctx.advance();
  } else {
    ctx.error('P21L003', 'Unterminated binary literal. Expected closing `"`.');
  }

  const text = ctx.slice(start, ctx.index);
  ctx.emit('BINARY', text, start, line, col);
  return true;
}

export function scanEnumeration(ctx: LexerContext): boolean {
  if (ctx.peek() !== '.') return false;
  if (!isUpper(ctx.peek(1))) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  ctx.advance(); // opening .

  while (!ctx.eof() && isKeywordChar(ctx.peek())) {
    ctx.advance();
  }

  if (ctx.peek() === '.') {
    ctx.advance(); // closing .
  } else {
    ctx.error('P21L004', 'Unterminated enumeration. Expected closing `.`.');
  }

  const text = ctx.slice(start, ctx.index);
  ctx.emit('ENUMERATION', text, start, line, col);
  return true;
}

export function scanEntityOrConstantRef(ctx: LexerContext): boolean {
  if (ctx.peek() !== '#') return false;

  const next = ctx.peek(1);
  if (!isDigit(next) && !isUpper(next)) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  ctx.advance(); // #

  if (isDigit(ctx.peek())) {
    while (!ctx.eof() && isDigit(ctx.peek())) {
      ctx.advance();
    }
    const text = ctx.slice(start, ctx.index);
    ctx.emit('ENTITY_INSTANCE_NAME', text, start, line, col);
  } else {
    while (!ctx.eof() && isKeywordChar(ctx.peek())) {
      ctx.advance();
    }
    const text = ctx.slice(start, ctx.index);
    ctx.emit('CONSTANT_ENTITY_NAME', text, start, line, col);
  }

  return true;
}

export function scanValueOrConstantRef(ctx: LexerContext): boolean {
  if (ctx.peek() !== '@') return false;

  const next = ctx.peek(1);
  if (!isDigit(next) && !isUpper(next)) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  ctx.advance(); // @

  if (isDigit(ctx.peek())) {
    while (!ctx.eof() && isDigit(ctx.peek())) {
      ctx.advance();
    }
    const text = ctx.slice(start, ctx.index);
    ctx.emit('VALUE_INSTANCE_NAME', text, start, line, col);
  } else {
    while (!ctx.eof() && isKeywordChar(ctx.peek())) {
      ctx.advance();
    }
    const text = ctx.slice(start, ctx.index);
    ctx.emit('CONSTANT_VALUE_NAME', text, start, line, col);
  }

  return true;
}

export function scanAngleDelimited(ctx: LexerContext): boolean {
  if (ctx.peek() !== '<') return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  ctx.advance(); // <

  while (!ctx.eof() && ctx.peek() !== '>') {
    ctx.advance();
  }

  if (ctx.peek() === '>') {
    ctx.advance();
  } else {
    ctx.error('P21L005', 'Unterminated angle-delimited name. Expected `>`.');
  }

  const text = ctx.slice(start, ctx.index);
  const inner = text.slice(1, -1);

  // Distinguish ANCHOR_NAME from RESOURCE by presence of "://" in content
  if (inner.includes('://') || inner.includes('/')) {
    ctx.emit('RESOURCE', text, start, line, col);
  } else {
    ctx.emit('ANCHOR_NAME', text, start, line, col);
  }

  return true;
}

export function scanNumber(ctx: LexerContext): boolean {
  if (!isDigit(ctx.peek())) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  while (!ctx.eof() && isDigit(ctx.peek())) {
    ctx.advance();
  }

  let kind: 'INTEGER' | 'REAL' = 'INTEGER';

  if (ctx.peek() === '.') {
    // Look ahead: make sure this is not an enumeration like .T.
    // A real number decimal point is followed by a digit or end of token
    const afterDot = ctx.peek(1);
    if (
      isDigit(afterDot) ||
      afterDot === 'E' ||
      afterDot === 'e' ||
      afterDot === ';' ||
      afterDot === ',' ||
      afterDot === ')' ||
      afterDot === ' ' ||
      afterDot === '\n' ||
      afterDot === '\r' ||
      afterDot === '\t' ||
      afterDot === '' ||
      afterDot === '/'
    ) {
      ctx.advance(); // consume .
      while (!ctx.eof() && isDigit(ctx.peek())) {
        ctx.advance();
      }
      kind = 'REAL';
    }
  }

  // Exponent part
  if (kind === 'REAL' || ctx.peek() === 'E' || ctx.peek() === 'e') {
    if (ctx.peek() === 'E' || ctx.peek() === 'e') {
      ctx.advance(); // E
      if (ctx.peek() === '+' || ctx.peek() === '-') {
        ctx.advance();
      }
      while (!ctx.eof() && isDigit(ctx.peek())) {
        ctx.advance();
      }
      kind = 'REAL';
    }
  }

  const text = ctx.slice(start, ctx.index);
  ctx.emit(kind, text, start, line, col);
  return true;
}

export function scanUserDefinedKeyword(ctx: LexerContext): boolean {
  if (ctx.peek() !== '!') return false;
  if (!isUpper(ctx.peek(1))) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  ctx.advance(); // !

  while (!ctx.eof() && isKeywordChar(ctx.peek())) {
    ctx.advance();
  }

  const text = ctx.slice(start, ctx.index);
  ctx.emit('USER_DEFINED_KEYWORD', text, start, line, col);
  return true;
}

export function scanKeyword(ctx: LexerContext): boolean {
  if (!isUpper(ctx.peek())) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  while (!ctx.eof() && isKeywordChar(ctx.peek())) {
    ctx.advance();
  }

  const text = ctx.slice(start, ctx.index);
  const upper = text.toUpperCase();

  const sectionKw = SECTION_KEYWORD_MAP[upper];
  if (sectionKw) {
    ctx.emit(sectionKw, text, start, line, col);
  } else {
    ctx.emit('STANDARD_KEYWORD', text, start, line, col);
  }

  return true;
}

export function scanIsoDelimiter(ctx: LexerContext): boolean {
  if (ctx.startsWith('ISO-10303-21')) {
    const start = ctx.index;
    const line = ctx.line;
    const col = ctx.column;
    ctx.advance(12);
    ctx.emit('KW_ISO_10303_21', 'ISO-10303-21', start, line, col);
    return true;
  }
  if (ctx.startsWith('END-ISO-10303-21')) {
    const start = ctx.index;
    const line = ctx.line;
    const col = ctx.column;
    ctx.advance(16);
    ctx.emit('KW_END_ISO_10303_21', 'END-ISO-10303-21', start, line, col);
    return true;
  }
  return false;
}

export function scanTagName(ctx: LexerContext): boolean {
  if (!isLower(ctx.peek())) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  while (
    !ctx.eof() &&
    (isLower(ctx.peek()) ||
      isUpper(ctx.peek()) ||
      isDigit(ctx.peek()) ||
      ctx.peek() === '_')
  ) {
    ctx.advance();
  }

  const text = ctx.slice(start, ctx.index);
  ctx.emit('TAG_NAME', text, start, line, col);
  return true;
}

export function scanSymbol(ctx: LexerContext): boolean {
  const ch = ctx.peek();
  const kind = SYMBOL_MAP[ch];
  if (!kind) return false;

  const start = ctx.index;
  const line = ctx.line;
  const col = ctx.column;

  ctx.advance();
  ctx.emit(kind, ch, start, line, col);
  return true;
}
