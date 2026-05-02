# fix-express-doc-format

Script to fix format artifacts in `docs/express/ISO10303-11(EXPRESS).md` (PDF extraction).

## Usage

```bash
# Dry run: print stats and sample diff, do not write file
pnpm run fix:express-doc -- --dry-run

# Apply all phases to default file (docs/express/ISO10303-11(EXPRESS).md)
pnpm run fix:express-doc

# Apply only specific phases (e.g. 1–5 for PDF noise)
pnpm run fix:express-doc -- --only-phases=1,2,3,4,5 docs/express/ISO10303-11\(EXPRESS).md

# Apply only phases 6 and 7 (glued words, Not for ResaleNo)
pnpm run fix:express-doc -- --only-phases=6,7 docs/express/ISO10303-11\(EXPRESS).md

# Apply only phase 8 (URL heading → markdown link)
pnpm run fix:express-doc -- --only-phases=8 docs/express/ISO10303-11\(EXPRESS).md
```

## Phases

1. Copyright blocks (4-line blocks)
2. Garbage line `## --\`...`
3. Repeated `## ISO 10303-11:2004(E)` (keep first)
4. Lines that are only `c` or roman numerals (iv–xii)
5. Lines that are exactly `## N` (page numbers)
6. Not for ResaleNo → Not for Resale. No
7. Glued words (theEXPRESS, abinary, etc.)
8. `## <http://...>` → markdown link
