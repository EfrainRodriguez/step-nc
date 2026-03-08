import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lexExpress, parseExpress } from '../src/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
}

interface BenchmarkResult {
  file: string;
  mode: 'eager' | 'streaming';
  fileSize: number;
  tokenCount: number | null;
  declarationCount: number | null;
  phases: {
    baseline: MemorySnapshot;
    afterParse: MemorySnapshot;
  };
  timings: {
    totalMs: number;
  };
  error: string | null;
}

function forceGC(): void {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc();
  } else {
    console.warn('GC not exposed. Run with --expose-gc for accurate results.');
  }
}

function takeSnapshot(): MemorySnapshot {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers,
    rss: mem.rss,
  };
}

function formatMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2);
}

const TEST_FILES: { label: string; path: string }[] = [
  {
    label: 'geometry.exp',
    path: resolve(__dirname, '../../../examples/data/geometry.exp'),
  },
  {
    label: 'ap238e2_aim_lf.exp',
    path: resolve(__dirname, '../../../docs/express/APs/ap238e2_aim_lf.exp'),
  },
  {
    label: 'ap242_ed4_2025.exp',
    path: resolve(__dirname, '../../../docs/express/APs/ap242_ed4_2025.exp'),
  },
];

async function runBenchmark(
  label: string,
  filePath: string,
  mode: 'eager' | 'streaming',
): Promise<BenchmarkResult | null> {
  let source: string;
  try {
    source = readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  const fileSize = Buffer.byteLength(source, 'utf-8');

  forceGC();
  const baseline = takeSnapshot();

  const start = performance.now();
  let tokenCount: number | null = null;
  let declarationCount: number | null = null;
  let error: string | null = null;

  try {
    if (mode === 'eager') {
      const lexResult = lexExpress(source);
      tokenCount = lexResult.tokens.length;
    }

    const result = parseExpress(source, { streaming: mode === 'streaming' });
    if (result.ast.type === 'SchemaDeclaration') {
      declarationCount = result.ast.declarations.length;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const totalMs = performance.now() - start;

  forceGC();
  const afterParse = takeSnapshot();

  return {
    file: label,
    mode,
    fileSize,
    tokenCount,
    declarationCount,
    phases: { baseline, afterParse },
    timings: { totalMs },
    error,
  };
}

async function main(): Promise<void> {
  console.log(
    '═══════════════════════════════════════════════════════════════════════════',
  );
  console.log('  EXPRESS Parser Memory Benchmark — Eager vs Streaming');
  console.log(
    '═══════════════════════════════════════════════════════════════════════════',
  );

  const results: BenchmarkResult[] = [];

  for (const { label, path } of TEST_FILES) {
    for (const mode of ['eager', 'streaming'] as const) {
      console.log(`\n  ▶ ${label} [${mode}]`);
      const result = await runBenchmark(label, path, mode);
      if (result) {
        results.push(result);
        if (result.error) {
          console.log(`    ✗ Error: ${result.error}`);
        } else {
          const heapDelta =
            result.phases.afterParse.heapUsed - result.phases.baseline.heapUsed;
          console.log(`    Heap delta: ${formatMB(heapDelta)} MB`);
          console.log(
            `    Total time: ${result.timings.totalMs.toFixed(1)} ms`,
          );
          if (result.declarationCount !== null) {
            console.log(`    Declarations: ${result.declarationCount}`);
          }
        }
      } else {
        console.log(`    ⏭  Skipped (file not found)`);
      }
    }
  }

  console.log(
    '\n\n═══════════════════════════════════════════════════════════════════════════',
  );
  console.log('  Summary Table');
  console.log(
    '═══════════════════════════════════════════════════════════════════════════\n',
  );

  const header = [
    'File'.padEnd(25),
    'Mode'.padEnd(10),
    'Size(MB)'.padStart(10),
    'Heap(MB)'.padStart(10),
    'Delta(MB)'.padStart(10),
    'Time(ms)'.padStart(10),
    'Decls'.padStart(8),
    'Status'.padStart(8),
  ].join(' │ ');

  const separator = header.replace(/[^│]/g, '─').replace(/│/g, '┼');

  console.log(separator);
  console.log(header);
  console.log(separator);

  for (const r of results) {
    const heapDelta = r.phases.afterParse.heapUsed - r.phases.baseline.heapUsed;
    const row = [
      r.file.padEnd(25),
      r.mode.padEnd(10),
      formatMB(r.fileSize).padStart(10),
      formatMB(r.phases.afterParse.heapUsed).padStart(10),
      formatMB(heapDelta).padStart(10),
      r.timings.totalMs.toFixed(1).padStart(10),
      (r.declarationCount !== null
        ? String(r.declarationCount)
        : 'N/A'
      ).padStart(8),
      (r.error ? 'FAIL' : 'OK').padStart(8),
    ].join(' │ ');
    console.log(row);
  }

  console.log(separator);
  console.log('\nDone.');
}

main().catch(console.error);
