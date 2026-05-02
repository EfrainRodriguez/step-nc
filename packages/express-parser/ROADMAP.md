# Roadmap del Parser EXPRESS

## Estado Actual

### Lo que está completo: el **Lexer**

La capa de tokenización está bien implementada y es bastante sólida:

| Archivo | Responsabilidad | Estado |
|---|---|---|
| `context.ts` | Estado mutable del lexer (posición, línea, columna) | ✅ Completo |
| `types.ts` | Tipos `Token`, `TokenKind`, `LexDiagnostic`, `TokenCategory` | ✅ Completo |
| `tokens.ts` | Definiciones estáticas de ~100 tokens EXPRESS | ✅ Completo |
| `tables.ts` | `KEYWORD_MAP` (O(1)) y `SYMBOLS_SORTED` (longest-match) | ✅ Completo |
| `helpers.ts` | Clasificadores de caracteres | ✅ Completo |
| `scanner.ts` | Funciones de escaneo (whitespace, comments, numbers, strings, identifiers, symbols) | ⚠️ Casi completo |
| `lexer.ts` | Función pública `lexExpress()` | ✅ Completo |

### Gaps en el Lexer (menores)

1. **`LIT_BINARY` no está implementado** — está declarado en `TokenKind` pero el `scanner.ts` no lo escanea. En EXPRESS los literales binarios tienen la forma `%01101...`.
2. **Los comentarios y whitespace no emiten tokens trivia** — son silenciosamente consumidos. Está bien para un parser de AST, pero impide construir un CST (Concrete Syntax Tree) fiel al texto original.
3. **`SYM_REMARK_LINE` y `SYM_REMARK_BLOCK_START/END` en `SYMBOL_TOKENS`** — estos podrían causar conflictos si el scanner de símbolos se ejecuta *antes* de que el scanner de comentarios falle (actualmente los handlers van en orden correcto, pero es un riesgo latente).
4. **No hay tests** — `vitest` está instalado como devDependency pero no existe ningún archivo `*.test.ts` ni `*.spec.ts`.

### Pipeline Objetivo

```
source (string)
  → lexExpress()     [ya existe]
  → parseExpress()   [no existe]
  → AST (ExpressSchema)
```

## Roadmap

### Fase 1 — Cierre de gaps del Lexer
**Prioridad: Alta | Esfuerzo: Bajo**

- [x] Implementar `scanBinaryLiteral()` en `scanner.ts` (patrón `%[01]+`)
- [x] Agregar tests unitarios del lexer (`lexer.test.ts`) cubriendo todos los token kinds, casos borde y errores

### Fase 2 — Definición del AST (tipos)
**Prioridad: Alta | Esfuerzo: Medio**

- [x] Crear `src/ast/nodes.ts` (o similar) con los nodos del árbol. La gramática EXPRESS (ISO 10303-11) tiene estas construcciones principales:

**Nodos de alto nivel:**
```
SchemaNode
  ├─ EntityDeclarationNode
  ├─ TypeDeclarationNode
  ├─ FunctionDeclarationNode
  ├─ ProcedureDeclarationNode
  ├─ RuleDeclarationNode
  ├─ SubtypeConstraintNode
  └─ ConstantDeclarationNode
```

**Nodos de entidad:**
```
EntityDeclarationNode
  ├─ SupertypeClauseNode       (SUPERTYPE OF / SUBTYPE OF)
  ├─ ExplicitAttributeNode     (name : [OPTIONAL] type)
  ├─ DerivedAttributeNode      (DERIVE name := expr)
  ├─ InverseAttributeNode      (INVERSE name : [SET/BAG OF] entity FOR attr)
  ├─ UniqueClauseNode          (UNIQUE label : attr, attr, ...)
  └─ WhereClauseNode           (WHERE label : expr)
```

**Nodos de tipo:**
```
TypeDeclarationNode
  ├─ SimpleTypeNode            (NUMBER, INTEGER, REAL, STRING, BOOLEAN, LOGICAL, BINARY)
  ├─ AggregationTypeNode       (ARRAY/LIST/SET/BAG [lo:hi] OF type)
  ├─ EnumerationTypeNode       (ENUMERATION OF (A, B, C))
  ├─ SelectTypeNode            (SELECT (Type1, Type2, ...))
  └─ NamedTypeNode             (referencia a otro tipo/entidad)
```

**Nodos de expresión:**
```
ExpressionNode
  ├─ BinaryExpressionNode      (+, -, *, /, DIV, MOD, **, AND, OR, XOR, =, <>, <, >, <=, >=, IN, LIKE, ||)
  ├─ UnaryExpressionNode       (-, NOT)
  ├─ LiteralNode               (integer, real, string, binary, TRUE, FALSE, UNKNOWN, ?)
  ├─ IdentifierReferenceNode   (nombre de variable/atributo)
  ├─ QualifiedReferenceNode    (a.b.c)
  ├─ IndexedReferenceNode      (a[i] o a[i:j])
  ├─ FunctionCallNode          (ABS(x), SIZEOF(list), f(a, b))
  ├─ QueryExpressionNode       (QUERY(alias <* coll | expr))
  ├─ AggregateInitializerNode  ([e1, e2, ...] o lista con repetición)
  └─ EntityConstructorNode     (EntityName(v1, v2))
```

**Nodos de statement:**
```
StatementNode
  ├─ AssignmentStatementNode   (var := expr)
  ├─ CallStatementNode         (PROCEDURE(args) o INSERT/REMOVE)
  ├─ IfStatementNode           (IF ... THEN ... ELSE ... END_IF)
  ├─ CaseStatementNode         (CASE ... OF ... END_CASE)
  ├─ RepeatStatementNode       (REPEAT ... END_REPEAT con WHILE/UNTIL/FOR)
  ├─ AliasStatementNode        (ALIAS id FOR ref; ... END_ALIAS)
  ├─ ReturnStatementNode       (RETURN expr)
  ├─ SkipStatementNode         (SKIP)
  └─ EscapeStatementNode       (ESCAPE)
```

- [x] Cada nodo debería incluir información de posición (span/location) para reportar diagnósticos.

### Fase 3 — Token stream / Parser context
**Prioridad: Alta | Esfuerzo: Bajo-Medio**

- [x] Crear `src/parser/token-stream.ts` o `ParserContext`, que:
  - Itere sobre el array de tokens del lexer
  - Filtre automáticamente los trivia (whitespace, comments)
  - Exponga `peek()`, `consume()`, `expect()`, `check()`, `skip()`
  - Acumule `ParseDiagnostic[]`

### Fase 4 — Parser (Recursive Descent)
**Prioridad: Alta | Esfuerzo: Alto**

- [x] Crear `src/parser/parser.ts` con una función pública:

```typescript
export function parseExpress(source: string): ParseResult;

export interface ParseResult {
  ast: SchemaNode;
  diagnostics: ParseDiagnostic[];
}
```

- [x] El parser debe implementar, en orden de dependencias (bottom-up en implementación):

1. **Tipos simples y referencias** — `parseSimpleType()`, `parseNamedType()`, `parseAggregationType()`
2. **Expresiones** — usando precedencia de operadores (Pratt parser o precedence climbing), dado que EXPRESS tiene operadores con 6+ niveles de precedencia
3. **Statements** — `parseStatement()` como dispatcher
4. **Declaraciones de entidad** — `parseEntityDeclaration()`
5. **Declaraciones de tipo** — `parseTypeDeclaration()`
6. **Funciones y procedimientos** — `parseFunctionDeclaration()`, `parseProcedureDeclaration()`
7. **Rules y Subtype Constraints** — `parseRuleDeclaration()`, `parseSubtypeConstraintDeclaration()`
8. **Schema** — `parseSchema()` como punto de entrada
9. **Error recovery** — estrategia de resincronización (ej: sincronizar en `END_ENTITY`, `END_TYPE`, `END_SCHEMA`, `;`)
10. **Entity section limits** — límites configurables (`ParseOptions.maxExplicitAttributes`, `maxEntitySectionItems`) con diagnósticos PAR090/PAR091 al superarlos.

### Fase 5 — Tests del parser
**Prioridad: Alta | Esfuerzo: Medio**

- [x] Tests unitarios por construcción (entity, type, function, etc.)
- [x] Tests con archivos `.exp` reales (geometry.exp, SDAI)
- [x] Tests de recuperación de errores

### Fase 6 — API pública y exports
**Prioridad: Media | Esfuerzo: Bajo**

- [x] Actualizar `src/index.ts` para exportar:
  - `parseExpress()` y `ParseResult`
  - Todos los nodos del AST como tipos
  - Visitor/walker utilities (opcional pero muy útil para consumidores del paquete)

### Fase 7 — Visitor / AST utilities (opcional pero recomendado)
**Prioridad: Media | Esfuerzo: Medio**

- [x] Crear logica de patrones 'visitor' y 'walk'.
```typescript
// Visitor pattern
visit(ast, {
  onEntityDeclaration(node) { ... },
  onTypeDeclaration(node) { ... },
});

// Walker genérico
walk(ast, (node) => { ... });
```

## Resumen visual del pipeline objetivo

```
┌─────────────────────────────────────────────────┐
│              parseExpress(source)               │
│                                                 │
│  source  ──►  lexExpress()  ──►  Token[]        │
│                                    │            │
│                               ParserContext     │
│                                    │            │
│                            Recursive Descent    │
│                                    │            │
│                                 AST Root        │
│                              (SchemaNode)       │
│                                    │            │
│                           ParseDiagnostic[]     │
└─────────────────────────────────────────────────┘
```

La parte más compleja y que más tiempo consume será la **Fase 4** (el parser propiamente), especialmente el parsing de expresiones dada la complejidad de la gramática de EXPRESS con sus operadores relacionales, lógicos, de instancia (`=:=`, `:<>:`), de conjunto (`IN`, `LIKE`, `||`), y la notación de tipos agregados con bounds dinámicos.
