import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@step-nc/express-parser': resolve(
        __dirname,
        '../express-parser/dist/index.js',
      ),
      '@step-nc/express-dictionary': resolve(
        __dirname,
        '../express-dictionary/dist/index.js',
      ),
    },
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
