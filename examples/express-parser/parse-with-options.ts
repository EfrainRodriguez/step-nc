import {
  DEFAULT_MAX_ENTITY_SECTION_ITEMS,
  DEFAULT_MAX_EXPLICIT_ATTRIBUTES,
  parseExpress,
} from '@step-nc/express-parser';

// ── EXPRESS with many attributes (to trigger PAR090) ─────────

const sourceWithManyAttrs = `
SCHEMA s;
  ENTITY e;
    a1 : INTEGER;
    a2 : REAL;
    a3 : STRING;
    a4 : BOOLEAN;
  END_ENTITY;
END_SCHEMA;
`;

// ── EXPRESS with many DERIVE items (to trigger PAR091) ───────

const sourceWithManyDerive = `
SCHEMA s;
  ENTITY e;
    DERIVE
      d1 : REAL := 1.0;
      d2 : REAL := 2.0;
      d3 : REAL := 3.0;
    END_ENTITY;
END_SCHEMA;
`;

// ── Parse with default options ───────────────────────────────

console.log('\nParse with default options\n');

const defaultResult = parseExpress(sourceWithManyAttrs);
console.log('Default (geometry-like):');
console.log(`  Diagnostics: ${defaultResult.diagnostics.length}`);

// ── Parse with low limits ───────────────────────────────────

console.log('\nParse with maxExplicitAttributes: 2\n');

const lowAttrResult = parseExpress(sourceWithManyAttrs, {
  maxExplicitAttributes: 2,
});

console.log('With maxExplicitAttributes: 2:');
console.log(`  Diagnostics: ${lowAttrResult.diagnostics.length}`);
for (const d of lowAttrResult.diagnostics) {
  const pos = d.span.start;
  console.log(
    `    [${d.severity}] ${d.code} (${pos.line}:${pos.column}): ${d.message}`,
  );
}

// ── Parse with low DERIVE limit ──────────────────────────────

console.log('\nParse with maxEntitySectionItems: 1\n');

const lowDeriveResult = parseExpress(sourceWithManyDerive, {
  maxEntitySectionItems: 1,
});

console.log('With maxEntitySectionItems: 1:');
console.log(`  Diagnostics: ${lowDeriveResult.diagnostics.length}`);
for (const d of lowDeriveResult.diagnostics) {
  const pos = d.span.start;
  console.log(
    `    [${d.severity}] ${d.code} (${pos.line}:${pos.column}): ${d.message}`,
  );
}

// ── Default constants ───────────────────────────────────────

console.log('\nDefault limits:');
console.log(
  `  DEFAULT_MAX_EXPLICIT_ATTRIBUTES: ${DEFAULT_MAX_EXPLICIT_ATTRIBUTES}`,
);
console.log(
  `  DEFAULT_MAX_ENTITY_SECTION_ITEMS: ${DEFAULT_MAX_ENTITY_SECTION_ITEMS}`,
);
console.log('');
