import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/demo/lexer-demo.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'esnext',
});
