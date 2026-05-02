/**
 * - Plain config arrays: lint-staged appends staged paths to every command (breaks workspace typecheck).
 * - Function config: returned strings are not shell-expanded; `&&` would be passed as argv to eslint.
 *   Return two strings so lint-staged runs them in order (see lint-staged README).
 */
export default {
  '*.ts': (filenames) => {
    const quoted = filenames.map((f) => JSON.stringify(f)).join(' ');
    return [`eslint --fix ${quoted}`, 'pnpm typecheck --noEmit'];
  },
};
