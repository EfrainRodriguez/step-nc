# Roadmap - @step-nc/p21-writer

## Current status

- Main writer APIs are implemented (`writeP21`, `writeP21ToString`).
- Header/data serialization and diagnostics are implemented.
- Complex entity serialization support is implemented.

## Next priorities

- Add stream-oriented writing for very large models.
- Increase conformance coverage for optional P21 sections.
- Improve benchmark coverage (throughput + memory).

## Future ideas

- Hook-based customization for entity-level serialization.
- Optional comment insertion and output post-processing.
