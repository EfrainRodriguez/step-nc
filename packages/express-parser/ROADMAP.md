# Roadmap - @step-nc/express-parser

## Current status

- Typed EXPRESS AST generation is implemented.
- Lexer and parser diagnostics are implemented.
- Traversal helpers (`visit`, `walk`) are implemented.
- Unit test coverage exists for core grammar and diagnostics paths.

## Next priorities

- Improve diagnostic precision and recovery behavior.
- Expand grammar edge-case support and conformance tests.
- Add more fixture-based integration tests with real-world schemas.
- Continue performance profiling for large EXPRESS sources.

## Nice-to-have items

- Additional parser options for strictness levels.
- Better tooling around AST inspection/debugging.
- Optional benchmark suite for parser throughput and memory.
