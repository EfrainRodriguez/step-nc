import { parseExpress } from '@step-nc/express-parser';

// ── Invalid EXPRESS inline (intentional errors) ───────────────

const invalidSource = `
SCHEMA broken;
  ENTITY foo;
    x : REAL
    y : INTEGER;
  END_ENTITY;
  TYPE bad_type = REEAL;
  END_TYPE;
END_SCHEMA;
`;

// ── Parse ───────────────────────────────────────────────────

console.log('\nParsing invalid EXPRESS (intentional errors)\n');

const result = parseExpress(invalidSource);

// ── Print diagnostics ───────────────────────────────────────

const SEP = '─'.repeat(60);
console.log(SEP);
console.log('Diagnostics');
console.log(SEP);

if (result.diagnostics.length === 0) {
  console.log('  (none)');
} else {
  for (const d of result.diagnostics) {
    const pos = d.span.start;
    console.log(
      `  [${d.severity.toUpperCase()}] ${d.code} (${pos.line}:${pos.column}): ${d.message}`,
    );
  }
}

console.log(SEP);

// ── Show partial AST ────────────────────────────────────────

console.log('\nPartial AST (parser may recover):');
console.log(`  Schema: ${result.ast.name}`);
console.log(`  Declarations: ${result.ast.declarations.length}`);
console.log('');
