# Roadmap - @step-nc/p21-reader

## Current status

- Core read flow is implemented (`readP21`).
- Two-phase loading strategy is implemented.
- Reader diagnostics are implemented.

## Next priorities

- Expand edge-case conversion coverage for complex value shapes.
- Improve diagnostics around ambiguous/missing schema mappings.
- Add additional large-file and mixed-schema integration fixtures.

## Future ideas

- Streaming-oriented reading APIs.
- Additional hooks for custom instance/value mapping.
