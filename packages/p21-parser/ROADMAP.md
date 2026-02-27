# P21 Parser Roadmap

## Current Status

### Implemented
- Package scaffold and configuration
- Complete AST type definitions (all node types for CC1-CC4)
- Full lexer: all P21 token types, strings with control directives, binary, enumerations, comments, diagnostics
- Full parser: header, data (simple + complex entities), anchor, reference, signature sections
- Full document parser with error recovery at section, entity, and parameter levels
- Visitor pattern (`visit`) and walk traversal (`walk`)
- Integration tests with real .stp files
- Public API finalization

### Planned / Future Work
- `p21-reader` integration (combine P21 AST with EXPRESS schema to populate a StepModel)
- Streaming / incremental parsing for large files
- Performance benchmarks
- Pretty-printer / serializer (AST → P21 text)
- String control directive decoder utility (`\X2\`, `\S\`, `\PA\`, etc.)

## Conformance Classes

| Class | Description | Status |
|-------|-------------|--------|
| CC1 | HEADER + DATA sections | Done |
| CC2 | Multiple DATA sections | Done |
| CC3 | ANCHOR + REFERENCE sections | Done |
| CC4 | SIGNATURE sections | Done |

## Known Limitations
- String control directive decoding (`\X2\`, `\S\`, etc.) deferred to consumer/reader layer
- SIGNATURE content is captured as raw text, not validated as BASE64
- No streaming mode (entire source must be in memory)
- `tokenEnd` position uses text length offset, does not account for multiline tokens precisely
