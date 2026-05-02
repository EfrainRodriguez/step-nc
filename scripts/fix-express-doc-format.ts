/**
 * Fixes format artifacts in docs/express/ISO10303-11(EXPRESS).md (PDF extraction).
 * Order: copyright blocks → garbage line → ISO title repeats → c/roman lines → ## N only
 *        → Not for ResaleNo → glued words → ## <url> to link.
 * Run with --dry-run to print stats and sample diff without writing.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const DEFAULT_INPUT = path.join(
  process.cwd(),
  'docs/express/ISO10303-11(EXPRESS).md',
);

const COPYRIGHT_LINE_1 =
  'Copyright International Organization for Standardization';
const COPYRIGHT_LINE_2 = 'Reproduced by IHS under license with ISO';
const GARBAGE_LINE = '## --`,,,,``-`-`,,`,,`,`,,`---';
const ISO_TITLE = '## ISO 10303-11:2004(E)';
const ROMAN_PAGE = /^(iv|v|vi|vii|viii|ix|x|xi|xii)$/;
const PAGE_HEADING = /^## [0-9]+$/;

const GLUED_REPLACEMENTS: [string, string][] = [
  ['theEXPRESSlanguage', 'the EXPRESS language'],
  ['theEXPRESS', 'the EXPRESS'],
  ['Not for ResaleNo reproduction', 'Not for Resale. No reproduction'],
  ['abinary', 'a binary'],
  ['alist', 'a list'],
  ['astring', 'a string'],
  ['anarray', 'an array'],
  ['listorstring', 'list or string'],
  ['aninteger', 'an integer'],
  ['binaryorstring', 'binary or string'],
];

const URL_HEADING = /^## (<https?:\/\/[^>]+>)$/;

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const inputPath = args.find((a) => !a.startsWith('--')) ?? DEFAULT_INPUT;
  const onlyPhasesArg = args.find((a) => a.startsWith('--only-phases='));
  const runPhases = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8]);
  if (onlyPhasesArg) {
    const list = onlyPhasesArg
      .replace('--only-phases=', '')
      .split(',')
      .map((s) => parseInt(s.trim(), 10));
    runPhases.clear();
    list.forEach((p) => runPhases.add(p));
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const stats = {
    copyrightBlocks: 0,
    garbageLines: 0,
    isoTitleRepeats: 0,
    cOrRomanLines: 0,
    pageOnlyLines: 0,
    notForResale: 0,
    glued: 0,
    urlToLink: 0,
  };

  // Phase 1: Remove copyright blocks: Copyright... / Reproduced... / blank(s) / optionally "Not for Resale..." or next heading
  const out1: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const l0 = lines[i];
    const l1 = lines[i + 1];
    if (l0 === COPYRIGHT_LINE_1 && l1 === COPYRIGHT_LINE_2) {
      let j = i + 2;
      while (j < lines.length && (lines[j] === '' || lines[j].trim() === ''))
        j++;
      // Skip optional "Not for Resale..." line
      if (j < lines.length && lines[j].startsWith('Not for Resale')) j++;
      stats.copyrightBlocks++;
      i = j;
      continue;
    }
    out1.push(l0);
    i++;
  }
  let result = out1.join('\n');

  // Phase 2: Remove exact garbage line
  result = result
    .split('\n')
    .filter((line) => {
      if (line === GARBAGE_LINE) {
        stats.garbageLines++;
        return false;
      }
      return true;
    })
    .join('\n');

  // Phase 3: Keep first ISO title, remove subsequent exact repeats
  const isoLines = result.split('\n');
  let firstIsoSeen = false;
  result = isoLines
    .filter((line) => {
      if (line !== ISO_TITLE) return true;
      if (!firstIsoSeen) {
        firstIsoSeen = true;
        return true;
      }
      stats.isoTitleRepeats++;
      return false;
    })
    .join('\n');

  // Phase 4: Remove lines that are only "c" or only roman (iv, v, ... xii)
  result = result
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (t === 'c') {
        stats.cOrRomanLines++;
        return false;
      }
      if (ROMAN_PAGE.test(t)) {
        stats.cOrRomanLines++;
        return false;
      }
      return true;
    })
    .join('\n');

  // Phase 5: Remove lines that are exactly "## N" (integer only)
  result = result
    .split('\n')
    .filter((line) => {
      if (PAGE_HEADING.test(line.trim())) {
        stats.pageOnlyLines++;
        return false;
      }
      return true;
    })
    .join('\n');

  // Phase 6 & 7: Not for ResaleNo + glued words (only if phases 6–8 enabled)
  if (runPhases.has(6) || runPhases.has(7)) {
    for (const [from, to] of GLUED_REPLACEMENTS) {
      const parts = result.split(from);
      const count = parts.length - 1;
      if (count > 0) {
        if (from.includes('Resale')) stats.notForResale += count;
        else stats.glued += count;
        result = parts.join(to);
      }
    }
  }

  // Phase 8: ## <url> → markdown link (only if phase 8 enabled)
  if (runPhases.has(8)) {
    result = result
      .split('\n')
      .map((line) => {
        const m = line.match(URL_HEADING);
        if (m) {
          stats.urlToLink++;
          const url = m[1].slice(1, -1);
          return `[SC4 titles](${url})`;
        }
        return line;
      })
      .join('\n');
  }

  const finalStats = {
    copyrightBlocks: stats.copyrightBlocks,
    garbageLines: stats.garbageLines,
    isoTitleRepeats: stats.isoTitleRepeats,
    cOrRomanLines: stats.cOrRomanLines,
    pageOnlyLines: stats.pageOnlyLines,
    notForResale: stats.notForResale,
    glued: stats.glued,
    urlToLink: stats.urlToLink,
  };

  console.log('Stats:', JSON.stringify(finalStats, null, 2));

  if (dryRun) {
    console.log('--dry-run: no file written.');
    const orig = fs.readFileSync(inputPath, 'utf-8');
    if (orig !== result) {
      console.log('Sample: first 500 chars of result');
      console.log(result.slice(0, 500));
    }
    return;
  }

  fs.writeFileSync(inputPath, result, 'utf-8');
  console.log(`Written: ${inputPath}`);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
