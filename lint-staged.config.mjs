/**
 * lint-staged appends staged file paths to each command in an array.
 * `pnpm -r typecheck` must run with no extra paths (they break every package's tsc).
 */
export default {
  '*.ts': (filenames) => {
    const quoted = filenames.map((f) => JSON.stringify(f)).join(' ');
    return `eslint --fix ${quoted} && pnpm typecheck --noEmit`;
  },
};
