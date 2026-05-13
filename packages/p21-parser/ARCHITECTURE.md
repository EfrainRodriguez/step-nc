# Architecture - @step-nc/p21-parser

## Overview

`@step-nc/p21-parser` parses ISO 10303-21 exchange files into a typed AST with diagnostics and precise source spans.

## Pipeline

1. Lexer scans the source and emits P21 tokens.
2. Parser consumes tokens and builds document/section/entity nodes.
3. Diagnostics layer reports syntax and tokenization issues.
4. Traversal APIs expose AST analysis hooks for downstream packages.

## Core areas

- Token model + lexer.
- Parser context abstraction and grammar functions.
- AST definitions for header/data/anchor/reference/signature structures.
- Span and source-location helpers.
- Visitor/walker utilities.

## Design goals

- Dependency-free core parser.
- Stable typed AST contracts for consumers.
- Good diagnostics for invalid or partial files.
- Compatibility with the full P21 conformance class surface.
