import { parseP21 } from '@step-nc/p21-parser';

// ── P21 with several entities (to trigger maxEntities limit) ───

const sourceWithEntities = [
  'ISO-10303-21;',
  'HEADER;',
  "FILE_DESCRIPTION((''),'2;1');",
  "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
  "FILE_SCHEMA(('AUTO'));",
  'ENDSEC;',
  'DATA;',
  '#1=CPT(0.0,0.0,0.0);',
  '#2=CPT(1.0,0.0,0.0);',
  '#3=CPT(0.0,1.0,0.0);',
  '#4=VX(#1);',
  '#5=VX(#2);',
  '#6=VX(#3);',
  'ENDSEC;',
  'END-ISO-10303-21;',
].join('\n');

// ── Parse with default options ───────────────────────────────

console.log('\nParse with default options\n');

const defaultResult = parseP21(sourceWithEntities);
console.log('Default:');
console.log(`  Data sections: ${defaultResult.ast.data.length}`);
console.log(
  `  Entities in first section: ${defaultResult.ast.data[0]!.entities.length}`,
);
console.log(`  Diagnostics: ${defaultResult.diagnostics.length}`);

// ── Parse with low maxEntities ──────────────────────────────

console.log('\nParse with maxEntities: 3\n');

const lowResult = parseP21(sourceWithEntities, { maxEntities: 3 });

console.log('With maxEntities: 3:');
console.log(`  Data sections: ${lowResult.ast.data.length}`);
console.log(
  `  Entities in first section: ${lowResult.ast.data[0]!.entities.length}`,
);
console.log(`  Diagnostics: ${lowResult.diagnostics.length}`);
for (const d of lowResult.diagnostics) {
  const pos = d.span.start;
  console.log(
    `    [${d.severity}] ${d.code} (${pos.line}:${pos.column}): ${d.message}`,
  );
}

console.log(
  '\nDefault maxEntities when not set: 1000000 (safety limit in parser)\n',
);
