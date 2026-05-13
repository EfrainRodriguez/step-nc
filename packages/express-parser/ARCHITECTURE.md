# Architecture - @step-nc/express-parser

## Overview

`@step-nc/express-parser` implements a lexer + parser pipeline for EXPRESS, producing a typed AST and diagnostics with source spans.

## High-level pipeline

1. **Lexing**: convert source text into tokens.
2. **Parsing**: consume tokens and build typed AST nodes.
3. **Diagnostics**: collect lexical and syntactic errors/warnings.
4. **Traversal**: expose visitor/walker utilities for downstream analysis.

## Core modules

- Lexer (`lexExpress`) with token kinds and trivia handling.
- Parser context abstraction (token cursor, consume/expect helpers).
- Grammar-driven parser functions by declaration/expression category.
- AST node definitions with discriminated unions and source spans.
- Diagnostics and span helper utilities.

## AST design

- Nodes include `type` + `span` for traceability.
- Publicly exported node types support strong typing in consumers.
- Base node interfaces simplify narrowing and utility functions.

## Traversal APIs

- `visit(ast, visitor)` for targeted pre-order traversal.
- `walk(ast, callback, options?)` for full traversal in pre/post order.

## Key goals

- Keep parsing deterministic and dependency-light.
- Preserve source location for precise error messages.
- Support downstream semantic analysis and runtime model generation.
