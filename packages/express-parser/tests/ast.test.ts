import { describe, expect, it } from 'vitest';
import type {
  AggregateElementNode,
  AggregateInitializerNode,
  AggregationTypeNode,
  AliasStatementNode,
  AssignmentStatementNode,
  ASTNode,
  BinaryExpressionNode,
  BinaryLiteralNode,
  CaseActionNode,
  CaseStatementNode,
  CompoundStatementNode,
  ConstantDeclarationNode,
  ConstantValueDeclarationNode,
  DeclarationNode,
  DerivedAttributeNode,
  EntityConstructorNode,
  EntityDeclarationNode,
  EnumerationTypeNode,
  EnumRefNode,
  EscapeStatementNode,
  ExplicitAttributeNode,
  ExpressionNode,
  FunctionCallExpressionNode,
  FunctionDeclarationNode,
  IdentifierRefNode,
  IfStatementNode,
  IndeterminateLiteralNode,
  IntegerLiteralNode,
  IntervalExpressionNode,
  InverseAttributeNode,
  LocalVariableNode,
  LogicalLiteralNode,
  NamedTypeNode,
  NullStatementNode,
  ParameterNode,
  Position,
  ProcedureCallStatementNode,
  ProcedureDeclarationNode,
  QualifiedRefNode,
  QueryExpressionNode,
  RealLiteralNode,
  ReferenceClauseNode,
  RenamedRefNode,
  RepeatControlNode,
  RepeatStatementNode,
  ReturnStatementNode,
  RuleDeclarationNode,
  SchemaDeclarationNode,
  SelectTypeNode,
  SelfRefNode,
  SimpleTypeNode,
  SkipStatementNode,
  Span,
  StatementNode,
  StringLiteralNode,
  SubtypeConstraintDeclarationNode,
  SubtypeOfNode,
  SupertypeConstraintNode,
  TypeDeclarationNode,
  TypeNode,
  UnaryExpressionNode,
  UniqueRuleNode,
  UseClauseNode,
  WhereRuleNode,
} from '../src/index';

// ── Test helpers ─────────────────────────────────────────────────

function pos(line: number, column: number, offset = 0): Position {
  return { offset, line, column };
}

function span(sl: number, sc: number, el: number, ec: number): Span {
  return { start: pos(sl, sc), end: pos(el, ec) };
}

const S: Span = span(1, 1, 1, 1);

function intLit(value: number): IntegerLiteralNode {
  return { type: 'IntegerLiteral', span: S, value };
}

function realLit(value: number): RealLiteralNode {
  return { type: 'RealLiteral', span: S, value };
}

function strLit(value: string): StringLiteralNode {
  return { type: 'StringLiteral', span: S, value };
}

function ident(name: string): IdentifierRefNode {
  return { type: 'IdentifierRef', span: S, name };
}

function simpleType(name: SimpleTypeNode['name']): SimpleTypeNode {
  return { type: 'SimpleType', span: S, name };
}

function namedType(name: string): NamedTypeNode {
  return { type: 'NamedType', span: S, name };
}

// ── Tests ────────────────────────────────────────────────────────

describe('AST types', () => {
  // ─── Position y Span ──────────────────────────────────────────

  describe('Position y Span', () => {
    it('crea una Position válida', () => {
      const p: Position = pos(1, 5, 4);
      expect(p.line).toBe(1);
      expect(p.column).toBe(5);
      expect(p.offset).toBe(4);
    });

    it('crea un Span válido (half-open interval)', () => {
      const s: Span = span(1, 1, 3, 10);
      expect(s.start.line).toBe(1);
      expect(s.end.line).toBe(3);
      expect(s.end.column).toBe(10);
    });
  });

  // ─── Expresiones: literales ───────────────────────────────────

  describe('Expresiones — literales', () => {
    it('IntegerLiteral', () => {
      const node: IntegerLiteralNode = intLit(42);
      expect(node.type).toBe('IntegerLiteral');
      expect(node.value).toBe(42);
    });

    it('RealLiteral', () => {
      const node: RealLiteralNode = realLit(3.14);
      expect(node.type).toBe('RealLiteral');
      expect(node.value).toBeCloseTo(3.14);
    });

    it('StringLiteral', () => {
      const node: StringLiteralNode = strLit('hello');
      expect(node.type).toBe('StringLiteral');
      expect(node.value).toBe('hello');
    });

    it('BinaryLiteral', () => {
      const node: BinaryLiteralNode = {
        type: 'BinaryLiteral',
        span: S,
        value: '01101',
      };
      expect(node.type).toBe('BinaryLiteral');
      expect(node.value).toBe('01101');
    });

    it('LogicalLiteral — TRUE / FALSE / UNKNOWN', () => {
      const t: LogicalLiteralNode = {
        type: 'LogicalLiteral',
        span: S,
        value: 'TRUE',
      };
      const f: LogicalLiteralNode = {
        type: 'LogicalLiteral',
        span: S,
        value: 'FALSE',
      };
      const u: LogicalLiteralNode = {
        type: 'LogicalLiteral',
        span: S,
        value: 'UNKNOWN',
      };
      expect(t.value).toBe('TRUE');
      expect(f.value).toBe('FALSE');
      expect(u.value).toBe('UNKNOWN');
    });

    it('IndeterminateLiteral (?)', () => {
      const node: IndeterminateLiteralNode = {
        type: 'IndeterminateLiteral',
        span: S,
      };
      expect(node.type).toBe('IndeterminateLiteral');
    });

    it('SelfRef', () => {
      const node: SelfRefNode = { type: 'SelfRef', span: S };
      expect(node.type).toBe('SelfRef');
    });
  });

  // ─── Expresiones: referencias ─────────────────────────────────

  describe('Expresiones — referencias', () => {
    it('IdentifierRef', () => {
      const node = ident('x');
      expect(node.type).toBe('IdentifierRef');
      expect(node.name).toBe('x');
    });

    it('QualifiedRef — a.b[1]', () => {
      const node: QualifiedRefNode = {
        type: 'QualifiedRef',
        span: S,
        root: ident('a'),
        qualifiers: [
          { type: 'AttributeRef', span: S, name: 'b' },
          { type: 'IndexRef', span: S, index: intLit(1) },
        ],
      };
      expect(node.type).toBe('QualifiedRef');
      expect(node.qualifiers).toHaveLength(2);
    });

    it('QualifiedRef — SELF\\entity.attr', () => {
      const node: QualifiedRefNode = {
        type: 'QualifiedRef',
        span: S,
        root: { type: 'SelfRef', span: S } as SelfRefNode,
        qualifiers: [
          { type: 'GroupRef', span: S, name: 'my_entity' },
          { type: 'AttributeRef', span: S, name: 'name' },
        ],
      };
      expect(node.qualifiers[0]!.type).toBe('GroupRef');
    });

    it('EnumRef', () => {
      const node: EnumRefNode = { type: 'EnumRef', span: S, enumValue: 'RED' };
      expect(node.type).toBe('EnumRef');
    });

    it('EnumRef con typeName', () => {
      const node: EnumRefNode = {
        type: 'EnumRef',
        span: S,
        typeName: 'colour',
        enumValue: 'RED',
      };
      expect(node.typeName).toBe('colour');
    });
  });

  // ─── Expresiones: compuestas ──────────────────────────────────

  describe('Expresiones — compuestas', () => {
    it('BinaryExpression — a + b * c', () => {
      const mul: BinaryExpressionNode = {
        type: 'BinaryExpression',
        span: S,
        operator: '*',
        left: ident('b'),
        right: ident('c'),
      };
      const add: BinaryExpressionNode = {
        type: 'BinaryExpression',
        span: S,
        operator: '+',
        left: ident('a'),
        right: mul,
      };
      expect(add.operator).toBe('+');
      expect(add.right.type).toBe('BinaryExpression');
    });

    it('UnaryExpression — NOT flag', () => {
      const node: UnaryExpressionNode = {
        type: 'UnaryExpression',
        span: S,
        operator: 'NOT',
        operand: ident('flag'),
      };
      expect(node.operator).toBe('NOT');
    });

    it('FunctionCallExpression — SIZEOF(items)', () => {
      const node: FunctionCallExpressionNode = {
        type: 'FunctionCallExpression',
        span: S,
        name: 'SIZEOF',
        args: [ident('items')],
      };
      expect(node.name).toBe('SIZEOF');
      expect(node.args).toHaveLength(1);
    });

    it('QueryExpression — QUERY(x <* items | x > 0)', () => {
      const node: QueryExpressionNode = {
        type: 'QueryExpression',
        span: S,
        variable: 'x',
        source: ident('items'),
        condition: {
          type: 'BinaryExpression',
          span: S,
          operator: '>',
          left: ident('x'),
          right: intLit(0),
        },
      };
      expect(node.variable).toBe('x');
    });

    it('AggregateInitializer — [1, 2 : 3]', () => {
      const el1: AggregateElementNode = {
        type: 'AggregateElement',
        span: S,
        value: intLit(1),
      };
      const el2: AggregateElementNode = {
        type: 'AggregateElement',
        span: S,
        value: intLit(2),
        repetition: intLit(3),
      };
      const node: AggregateInitializerNode = {
        type: 'AggregateInitializer',
        span: S,
        elements: [el1, el2],
      };
      expect(node.elements).toHaveLength(2);
      expect(node.elements[1]!.repetition).toBeDefined();
    });

    it('EntityConstructor — point(1.0, 2.0, 3.0)', () => {
      const node: EntityConstructorNode = {
        type: 'EntityConstructor',
        span: S,
        entity: 'point',
        args: [realLit(1.0), realLit(2.0), realLit(3.0)],
      };
      expect(node.entity).toBe('point');
      expect(node.args).toHaveLength(3);
    });

    it('IntervalExpression — { 0 <= x < 10 }', () => {
      const node: IntervalExpressionNode = {
        type: 'IntervalExpression',
        span: S,
        low: intLit(0),
        lowOp: '<=',
        value: ident('x'),
        highOp: '<',
        high: intLit(10),
      };
      expect(node.lowOp).toBe('<=');
      expect(node.highOp).toBe('<');
    });
  });

  // ─── Discriminated union narrowing — ExpressionNode ───────────

  describe('ExpressionNode narrowing', () => {
    it('switch en node.type permite acceso a propiedades específicas', () => {
      const exprs: ExpressionNode[] = [
        intLit(42),
        strLit('abc'),
        ident('x'),
        { type: 'SelfRef', span: S },
      ];

      for (const expr of exprs) {
        switch (expr.type) {
          case 'IntegerLiteral':
            expect(typeof expr.value).toBe('number');
            break;
          case 'StringLiteral':
            expect(typeof expr.value).toBe('string');
            break;
          case 'IdentifierRef':
            expect(typeof expr.name).toBe('string');
            break;
          case 'SelfRef':
            expect(expr.type).toBe('SelfRef');
            break;
        }
      }
    });
  });

  // ─── Tipos EXPRESS ────────────────────────────────────────────

  describe('Tipos EXPRESS', () => {
    it('SimpleType — INTEGER', () => {
      const node = simpleType('INTEGER');
      expect(node.name).toBe('INTEGER');
    });

    it('SimpleType — STRING(n) FIXED', () => {
      const node: SimpleTypeNode = {
        type: 'SimpleType',
        span: S,
        name: 'STRING',
        width: intLit(80),
        fixed: true,
      };
      expect(node.name).toBe('STRING');
      expect(node.fixed).toBe(true);
    });

    it('AggregationType — LIST [0:?] OF point', () => {
      const node: AggregationTypeNode = {
        type: 'AggregationType',
        span: S,
        kind: 'LIST',
        elementType: namedType('point'),
        lowerBound: intLit(0),
      };
      expect(node.kind).toBe('LIST');
    });

    it('EnumerationType — ENUMERATION OF (...)', () => {
      const node: EnumerationTypeNode = {
        type: 'EnumerationType',
        span: S,
        items: ['RED', 'GREEN', 'BLUE'],
      };
      expect(node.items).toEqual(['RED', 'GREEN', 'BLUE']);
    });

    it('EnumerationType — EXTENSIBLE BASED_ON', () => {
      const node: EnumerationTypeNode = {
        type: 'EnumerationType',
        span: S,
        extensible: true,
        items: [],
        basedOn: 'colour',
        basedOnItems: ['PURPLE'],
      };
      expect(node.extensible).toBe(true);
      expect(node.basedOn).toBe('colour');
    });

    it('SelectType — SELECT (...)', () => {
      const node: SelectTypeNode = {
        type: 'SelectType',
        span: S,
        selections: ['point', 'line', 'curve'],
      };
      expect(node.selections).toHaveLength(3);
    });

    it('NamedType con schemaRef', () => {
      const node: NamedTypeNode = {
        type: 'NamedType',
        span: S,
        name: 'length_measure',
        schemaRef: 'geometry_schema',
      };
      expect(node.schemaRef).toBe('geometry_schema');
    });

    it('GenericType', () => {
      const node: TypeNode = { type: 'GenericType', span: S, label: 'T' };
      expect(node.type).toBe('GenericType');
    });

    it('GenericEntityType', () => {
      const node: TypeNode = { type: 'GenericEntityType', span: S };
      expect(node.type).toBe('GenericEntityType');
    });

    it('AggregateType', () => {
      const node: TypeNode = { type: 'AggregateType', span: S, label: 'items' };
      expect(node.type).toBe('AggregateType');
    });
  });

  // ─── TypeNode narrowing ──────────────────────────────────────

  describe('TypeNode narrowing', () => {
    it('switch en node.type funciona correctamente', () => {
      const types: TypeNode[] = [
        simpleType('REAL'),
        namedType('point'),
        { type: 'EnumerationType', span: S, items: ['A'] },
      ];

      for (const t of types) {
        switch (t.type) {
          case 'SimpleType':
            expect(typeof t.name).toBe('string');
            break;
          case 'NamedType':
            expect(typeof t.name).toBe('string');
            break;
          case 'EnumerationType':
            expect(Array.isArray(t.items)).toBe(true);
            break;
        }
      }
    });
  });

  // ─── Statements ───────────────────────────────────────────────

  describe('Statements', () => {
    it('AssignmentStatement — result := a + b', () => {
      const node: AssignmentStatementNode = {
        type: 'AssignmentStatement',
        span: S,
        target: ident('result'),
        value: {
          type: 'BinaryExpression',
          span: S,
          operator: '+',
          left: ident('a'),
          right: ident('b'),
        },
      };
      expect(node.type).toBe('AssignmentStatement');
    });

    it('ProcedureCallStatement — INSERT(lst, elem)', () => {
      const node: ProcedureCallStatementNode = {
        type: 'ProcedureCallStatement',
        span: S,
        name: 'INSERT',
        args: [ident('lst'), ident('elem')],
      };
      expect(node.args).toHaveLength(2);
    });

    it('IfStatement — IF x > 0 THEN SKIP; END_IF', () => {
      const node: IfStatementNode = {
        type: 'IfStatement',
        span: S,
        condition: {
          type: 'BinaryExpression',
          span: S,
          operator: '>',
          left: ident('x'),
          right: intLit(0),
        },
        thenBody: [{ type: 'SkipStatement', span: S }],
      };
      expect(node.thenBody).toHaveLength(1);
    });

    it('IfStatement con ELSE', () => {
      const node: IfStatementNode = {
        type: 'IfStatement',
        span: S,
        condition: ident('flag'),
        thenBody: [{ type: 'ReturnStatement', span: S, value: intLit(1) }],
        elseBody: [{ type: 'ReturnStatement', span: S, value: intLit(0) }],
      };
      expect(node.elseBody).toHaveLength(1);
    });

    it('CaseStatement — CASE expr OF ... OTHERWISE ... END_CASE', () => {
      const action: CaseActionNode = {
        type: 'CaseAction',
        span: S,
        labels: [intLit(1), intLit(2)],
        body: [{ type: 'ReturnStatement', span: S, value: strLit('small') }],
      };
      const node: CaseStatementNode = {
        type: 'CaseStatement',
        span: S,
        selector: ident('val'),
        actions: [action],
        otherwise: [
          { type: 'ReturnStatement', span: S, value: strLit('other') },
        ],
      };
      expect(node.actions).toHaveLength(1);
      expect(node.otherwise).toHaveLength(1);
    });

    it('RepeatStatement — REPEAT i := 1 TO n; ... END_REPEAT', () => {
      const ctrl: RepeatControlNode = {
        type: 'RepeatControl',
        span: S,
        variable: 'i',
        from: intLit(1),
        to: ident('n'),
      };
      const node: RepeatStatementNode = {
        type: 'RepeatStatement',
        span: S,
        control: ctrl,
        body: [
          {
            type: 'AssignmentStatement',
            span: S,
            target: ident('total'),
            value: {
              type: 'BinaryExpression',
              span: S,
              operator: '+',
              left: ident('total'),
              right: ident('i'),
            },
          },
        ],
      };
      expect(node.control!.variable).toBe('i');
    });

    it('RepeatStatement — REPEAT WHILE cond', () => {
      const node: RepeatStatementNode = {
        type: 'RepeatStatement',
        span: S,
        control: {
          type: 'RepeatControl',
          span: S,
          while: {
            type: 'BinaryExpression',
            span: S,
            operator: '>',
            left: ident('x'),
            right: intLit(0),
          },
        },
        body: [{ type: 'NullStatement', span: S }],
      };
      expect(node.control!.while).toBeDefined();
    });

    it('AliasStatement — ALIAS id FOR ref', () => {
      const node: AliasStatementNode = {
        type: 'AliasStatement',
        span: S,
        variable: 'p',
        target: ident('points'),
        body: [{ type: 'NullStatement', span: S }],
      };
      expect(node.variable).toBe('p');
    });

    it('ReturnStatement con y sin valor', () => {
      const r1: ReturnStatementNode = {
        type: 'ReturnStatement',
        span: S,
        value: intLit(0),
      };
      const r2: ReturnStatementNode = { type: 'ReturnStatement', span: S };
      expect(r1.value).toBeDefined();
      expect(r2.value).toBeUndefined();
    });

    it('SkipStatement / EscapeStatement / NullStatement', () => {
      const skip: SkipStatementNode = { type: 'SkipStatement', span: S };
      const escape: EscapeStatementNode = { type: 'EscapeStatement', span: S };
      const nil: NullStatementNode = { type: 'NullStatement', span: S };
      expect(skip.type).toBe('SkipStatement');
      expect(escape.type).toBe('EscapeStatement');
      expect(nil.type).toBe('NullStatement');
    });

    it('CompoundStatement — BEGIN ... END', () => {
      const node: CompoundStatementNode = {
        type: 'CompoundStatement',
        span: S,
        body: [
          { type: 'NullStatement', span: S },
          { type: 'SkipStatement', span: S },
        ],
      };
      expect(node.body).toHaveLength(2);
    });
  });

  // ─── StatementNode narrowing ──────────────────────────────────

  describe('StatementNode narrowing', () => {
    it('switch en node.type funciona correctamente', () => {
      const stmts: StatementNode[] = [
        {
          type: 'AssignmentStatement',
          span: S,
          target: ident('x'),
          value: intLit(1),
        },
        { type: 'SkipStatement', span: S },
        { type: 'ReturnStatement', span: S },
      ];

      for (const stmt of stmts) {
        switch (stmt.type) {
          case 'AssignmentStatement':
            expect(stmt.target).toBeDefined();
            break;
          case 'SkipStatement':
            expect(stmt.type).toBe('SkipStatement');
            break;
          case 'ReturnStatement':
            expect(stmt.type).toBe('ReturnStatement');
            break;
        }
      }
    });
  });

  // ─── Declarations ─────────────────────────────────────────────

  describe('Declarations', () => {
    it('TypeDeclaration — TYPE length_measure = REAL; END_TYPE', () => {
      const node: TypeDeclarationNode = {
        type: 'TypeDeclaration',
        span: S,
        name: 'length_measure',
        underlyingType: simpleType('REAL'),
      };
      expect(node.name).toBe('length_measure');
      expect(node.underlyingType.type).toBe('SimpleType');
    });

    it('TypeDeclaration con WHERE rule', () => {
      const wr: WhereRuleNode = {
        type: 'WhereRule',
        span: S,
        label: 'wr1',
        expression: {
          type: 'BinaryExpression',
          span: S,
          operator: '>',
          left: { type: 'SelfRef', span: S },
          right: intLit(0),
        },
      };
      const node: TypeDeclarationNode = {
        type: 'TypeDeclaration',
        span: S,
        name: 'positive_real',
        underlyingType: simpleType('REAL'),
        whereRules: [wr],
      };
      expect(node.whereRules).toHaveLength(1);
    });

    it('EntityDeclaration — entidad simple con atributos explícitos', () => {
      const attr: ExplicitAttributeNode = {
        type: 'ExplicitAttribute',
        span: S,
        names: ['x', 'y', 'z'],
        attributeType: simpleType('REAL'),
      };
      const node: EntityDeclarationNode = {
        type: 'EntityDeclaration',
        span: S,
        name: 'cartesian_point',
        attributes: [attr],
      };
      expect(node.name).toBe('cartesian_point');
      expect(node.attributes[0]!.names).toEqual(['x', 'y', 'z']);
    });

    it('SupertypeConstraintNode accepts node without expression (ABSTRACT SUPERTYPE)', () => {
      const node: SupertypeConstraintNode = {
        type: 'SupertypeConstraint',
        span: S,
      };
      expect(node.type).toBe('SupertypeConstraint');
      expect(node.expression).toBeUndefined();
    });

    it('EntityDeclaration — ABSTRACT SUPERTYPE OF SUBTYPE OF', () => {
      const sup: SupertypeConstraintNode = {
        type: 'SupertypeConstraint',
        span: S,
        expression: {
          type: 'FunctionCallExpression',
          span: S,
          name: 'ONEOF',
          args: [ident('point_2d'), ident('point_3d')],
        },
      };
      const sub: SubtypeOfNode = {
        type: 'SubtypeOf',
        span: S,
        entities: ['geometric_representation_item'],
      };
      const node: EntityDeclarationNode = {
        type: 'EntityDeclaration',
        span: S,
        name: 'point',
        abstract: true,
        supertypeConstraint: sup,
        subtypeOf: sub,
        attributes: [],
      };
      expect(node.abstract).toBe(true);
      expect(node.supertypeConstraint!.expression.type).toBe(
        'FunctionCallExpression',
      );
      expect(node.subtypeOf!.entities).toEqual([
        'geometric_representation_item',
      ]);
    });

    it('EntityDeclaration con DERIVE, INVERSE, UNIQUE, WHERE', () => {
      const derived: DerivedAttributeNode = {
        type: 'DerivedAttribute',
        span: S,
        name: 'dim',
        attributeType: simpleType('INTEGER'),
        expression: intLit(3),
      };
      const inverse: InverseAttributeNode = {
        type: 'InverseAttribute',
        span: S,
        name: 'used_in',
        attributeType: {
          type: 'AggregationType',
          span: S,
          kind: 'SET',
          elementType: namedType('curve'),
          lowerBound: intLit(0),
        },
        forEntity: 'curve',
        forAttribute: 'control_points',
      };
      const unique: UniqueRuleNode = {
        type: 'UniqueRule',
        span: S,
        label: 'ur1',
        attributes: ['name', 'id'],
      };
      const where: WhereRuleNode = {
        type: 'WhereRule',
        span: S,
        label: 'wr1',
        expression: {
          type: 'BinaryExpression',
          span: S,
          operator: '>',
          left: ident('dim'),
          right: intLit(0),
        },
      };
      const node: EntityDeclarationNode = {
        type: 'EntityDeclaration',
        span: S,
        name: 'point',
        attributes: [
          {
            type: 'ExplicitAttribute',
            span: S,
            names: ['coords'],
            attributeType: namedType('list_of_real'),
          },
        ],
        derivedAttributes: [derived],
        inverseAttributes: [inverse],
        uniqueRules: [unique],
        whereRules: [where],
      };
      expect(node.derivedAttributes).toHaveLength(1);
      expect(node.inverseAttributes).toHaveLength(1);
      expect(node.uniqueRules).toHaveLength(1);
      expect(node.whereRules).toHaveLength(1);
    });

    it('ExplicitAttribute — OPTIONAL', () => {
      const node: ExplicitAttributeNode = {
        type: 'ExplicitAttribute',
        span: S,
        names: ['description'],
        optional: true,
        attributeType: simpleType('STRING'),
      };
      expect(node.optional).toBe(true);
    });

    it('FunctionDeclaration — dot_product', () => {
      const param: ParameterNode = {
        type: 'Parameter',
        span: S,
        names: ['a', 'b'],
        parameterType: namedType('vector'),
      };
      const local: LocalVariableNode = {
        type: 'LocalVariable',
        span: S,
        names: ['result'],
        variableType: simpleType('REAL'),
        initialValue: realLit(0.0),
      };
      const node: FunctionDeclarationNode = {
        type: 'FunctionDeclaration',
        span: S,
        name: 'dot_product',
        parameters: [param],
        returnType: simpleType('REAL'),
        declarations: [local],
        body: [{ type: 'ReturnStatement', span: S, value: ident('result') }],
      };
      expect(node.name).toBe('dot_product');
      expect(node.parameters).toHaveLength(1);
      expect(node.returnType.type).toBe('SimpleType');
    });

    it('ProcedureDeclaration con VAR parameter', () => {
      const param: ParameterNode = {
        type: 'Parameter',
        span: S,
        names: ['lst'],
        parameterType: {
          type: 'AggregationType',
          span: S,
          kind: 'LIST',
          elementType: simpleType('INTEGER'),
        },
        isVar: true,
      };
      const node: ProcedureDeclarationNode = {
        type: 'ProcedureDeclaration',
        span: S,
        name: 'sort_list',
        parameters: [param],
        body: [{ type: 'NullStatement', span: S }],
      };
      expect(node.parameters[0]!.isVar).toBe(true);
    });

    it('RuleDeclaration', () => {
      const node: RuleDeclarationNode = {
        type: 'RuleDeclaration',
        span: S,
        name: 'unique_names',
        appliesTo: ['named_entity'],
        body: [],
        whereRules: [
          {
            type: 'WhereRule',
            span: S,
            label: 'wr1',
            expression: {
              type: 'FunctionCallExpression',
              span: S,
              name: 'VALUE_UNIQUE',
              args: [ident('names')],
            },
          },
        ],
      };
      expect(node.appliesTo).toEqual(['named_entity']);
      expect(node.whereRules).toHaveLength(1);
    });

    it('SubtypeConstraintDeclaration', () => {
      const node: SubtypeConstraintDeclarationNode = {
        type: 'SubtypeConstraintDeclaration',
        span: S,
        name: 'point_subs',
        entity: 'point',
        abstract: true,
        totalOver: ['point_2d', 'point_3d'],
        expression: {
          type: 'FunctionCallExpression',
          span: S,
          name: 'ONEOF',
          args: [ident('point_2d'), ident('point_3d')],
        },
      };
      expect(node.abstract).toBe(true);
      expect(node.totalOver).toEqual(['point_2d', 'point_3d']);
    });

    it('ConstantDeclaration', () => {
      const constVal: ConstantValueDeclarationNode = {
        type: 'ConstantValueDeclaration',
        span: S,
        name: 'pi_val',
        constantType: simpleType('REAL'),
        value: realLit(3.14159265),
      };
      const node: ConstantDeclarationNode = {
        type: 'ConstantDeclaration',
        span: S,
        values: [constVal],
      };
      expect(node.values).toHaveLength(1);
    });

    it('UseClause y ReferenceClause', () => {
      const renamed: RenamedRefNode = {
        type: 'RenamedRef',
        span: S,
        name: 'point',
        alias: 'pt',
      };
      const use: UseClauseNode = {
        type: 'UseClause',
        span: S,
        schemaName: 'geometry_schema',
        items: [renamed],
      };
      const ref: ReferenceClauseNode = {
        type: 'ReferenceClause',
        span: S,
        schemaName: 'math_schema',
      };
      expect(use.items).toHaveLength(1);
      expect(use.items![0]!.alias).toBe('pt');
      expect(ref.items).toBeUndefined();
    });

    it('LocalVariable con initialValue', () => {
      const node: LocalVariableNode = {
        type: 'LocalVariable',
        span: S,
        names: ['i', 'j'],
        variableType: simpleType('INTEGER'),
        initialValue: intLit(0),
      };
      expect(node.names).toEqual(['i', 'j']);
      expect(node.initialValue).toBeDefined();
    });
  });

  // ─── DeclarationNode narrowing ────────────────────────────────

  describe('DeclarationNode narrowing', () => {
    it('switch en node.type funciona correctamente', () => {
      const decls: DeclarationNode[] = [
        {
          type: 'TypeDeclaration',
          span: S,
          name: 'my_type',
          underlyingType: simpleType('INTEGER'),
        },
        {
          type: 'EntityDeclaration',
          span: S,
          name: 'my_entity',
          attributes: [],
        },
      ];

      for (const decl of decls) {
        switch (decl.type) {
          case 'TypeDeclaration':
            expect(decl.name).toBe('my_type');
            break;
          case 'EntityDeclaration':
            expect(decl.name).toBe('my_entity');
            break;
        }
      }
    });
  });

  // ─── SchemaDeclaration completo ───────────────────────────────

  describe('SchemaDeclaration', () => {
    it('schema con USE, REFERENCE y declaraciones', () => {
      const schema: SchemaDeclarationNode = {
        type: 'SchemaDeclaration',
        span: span(1, 1, 100, 12),
        name: 'geometry_schema',
        versionId: '{version 1.0}',
        interfaces: [
          {
            type: 'UseClause',
            span: S,
            schemaName: 'measure_schema',
            items: [{ type: 'RenamedRef', span: S, name: 'length_measure' }],
          },
          {
            type: 'ReferenceClause',
            span: S,
            schemaName: 'support_schema',
          },
        ],
        declarations: [
          {
            type: 'TypeDeclaration',
            span: S,
            name: 'positive_length',
            underlyingType: simpleType('REAL'),
            whereRules: [
              {
                type: 'WhereRule',
                span: S,
                label: 'positive',
                expression: {
                  type: 'BinaryExpression',
                  span: S,
                  operator: '>',
                  left: { type: 'SelfRef', span: S },
                  right: realLit(0.0),
                },
              },
            ],
          },
          {
            type: 'EntityDeclaration',
            span: S,
            name: 'cartesian_point',
            attributes: [
              {
                type: 'ExplicitAttribute',
                span: S,
                names: ['coordinates'],
                attributeType: {
                  type: 'AggregationType',
                  span: S,
                  kind: 'LIST',
                  elementType: simpleType('REAL'),
                  lowerBound: intLit(1),
                  upperBound: intLit(3),
                },
              },
            ],
          },
        ],
      };
      expect(schema.name).toBe('geometry_schema');
      expect(schema.interfaces).toHaveLength(2);
      expect(schema.declarations).toHaveLength(2);
    });
  });

  // ─── DeclarationNode narrowing ────────────────────────────────

  describe('DeclarationNode narrowing', () => {
    it('switch en node.type funciona correctamente', () => {
      const decls: DeclarationNode[] = [
        {
          type: 'TypeDeclaration',
          span: S,
          name: 'my_type',
          underlyingType: simpleType('INTEGER'),
        },
        {
          type: 'EntityDeclaration',
          span: S,
          name: 'my_entity',
          attributes: [],
        },
      ];

      for (const decl of decls) {
        switch (decl.type) {
          case 'TypeDeclaration':
            expect(decl.name).toBe('my_type');
            break;
          case 'EntityDeclaration':
            expect(decl.name).toBe('my_entity');
            break;
        }
      }
    });
  });

  // ─── ASTNode global union ────────────────────────────────────

  describe('ASTNode global union', () => {
    it('acepta cualquier tipo de nodo AST', () => {
      const nodes: ASTNode[] = [
        intLit(1),
        simpleType('REAL'),
        { type: 'SkipStatement', span: S },
        {
          type: 'TypeDeclaration',
          span: S,
          name: 't',
          underlyingType: simpleType('INTEGER'),
        },
        { type: 'WhereRule', span: S, label: 'w', expression: intLit(1) },
        {
          type: 'Parameter',
          span: S,
          names: ['x'],
          parameterType: simpleType('REAL'),
        },
        { type: 'CaseAction', span: S, labels: [intLit(1)], body: [] },
        { type: 'RepeatControl', span: S, variable: 'i' },
        { type: 'AggregateElement', span: S, value: intLit(1) },
        { type: 'AttributeRef', span: S, name: 'attr' },
      ];
      expect(nodes).toHaveLength(10);
    });
  });

  // ─── Serialización JSON ───────────────────────────────────────

  describe('Serialización JSON', () => {
    it('JSON.stringify produce output válido', () => {
      const node: TypeDeclarationNode = {
        type: 'TypeDeclaration',
        span: span(1, 1, 1, 30),
        name: 'length_measure',
        underlyingType: simpleType('REAL'),
      };
      const json = JSON.stringify(node);
      expect(json).toBeTruthy();
      expect(json).toContain('"TypeDeclaration"');
    });

    it('JSON roundtrip preserva la estructura', () => {
      const node: BinaryExpressionNode = {
        type: 'BinaryExpression',
        span: span(1, 1, 1, 10),
        operator: '+',
        left: intLit(1),
        right: intLit(2),
      };
      const roundtrip = JSON.parse(JSON.stringify(node));
      expect(roundtrip).toEqual(node);
    });

    it('nodos complejos sobreviven el roundtrip', () => {
      const entity: EntityDeclarationNode = {
        type: 'EntityDeclaration',
        span: S,
        name: 'point',
        abstract: true,
        attributes: [
          {
            type: 'ExplicitAttribute',
            span: S,
            names: ['x', 'y'],
            attributeType: simpleType('REAL'),
          },
        ],
        whereRules: [
          {
            type: 'WhereRule',
            span: S,
            label: 'valid',
            expression: {
              type: 'BinaryExpression',
              span: S,
              operator: '>=',
              left: ident('x'),
              right: intLit(0),
            },
          },
        ],
      };
      const roundtrip = JSON.parse(JSON.stringify(entity));
      expect(roundtrip).toEqual(entity);
    });
  });
});
