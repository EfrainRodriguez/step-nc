import { parseP21 } from '@step-nc/p21-parser';

// ── Invalid P21 inline (intentional errors) ───────────────────

const invalidSource = `
ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('missing closing paren'),'2;1');
FILE_NAME('x','2024-01-01',(''),(''),'','','');
FILE_SCHEMA(('AUTO'));
ENDSEC
DATA;
#1=CPT(0.0,0.0
ENDSEC;
END-ISO-10303-21;
`;

// ── Parse ───────────────────────────────────────────────────

console.log('\nParsing invalid P21 (intentional errors)\n');

const result = parseP21(invalidSource);

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
console.log(`  Header entities: ${result.ast.header.entities.length}`);
console.log(`  Data sections: ${result.ast.data.length}`);
if (result.ast.data.length > 0) {
  console.log(
    `  First data section entities: ${result.ast.data[0]!.entities.length}`,
  );
}
console.log('');
