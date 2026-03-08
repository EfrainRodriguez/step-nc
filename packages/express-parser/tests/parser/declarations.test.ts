import { describe, expect, it } from 'vitest';
import type { DeclarationNode } from '../../src/ast/declarations';
import { lexExpress } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseDeclaration } from '../../src/parser/declarations';
import { parseExpress } from '../../src/parser/parser';

function parseDecl(source: string): DeclarationNode {
  const { tokens } = lexExpress(source);
  const ctx = new ParserContext(tokens);
  return parseDeclaration(ctx);
}

function parseDeclWithDiag(source: string) {
  const { tokens } = lexExpress(source);
  const ctx = new ParserContext(tokens);
  const decl = parseDeclaration(ctx);
  return { decl, diagnostics: ctx.diagnostics };
}

describe('Entity declarations', () => {
  it('should parse simple entity', () => {
    const decl = parseDecl('ENTITY point; x : REAL; y : REAL; END_ENTITY;');
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.name).toBe('point');
      expect(decl.attributes).toHaveLength(2);
    }
  });

  it('should parse entity with SUBTYPE OF', () => {
    const decl = parseDecl(
      'ENTITY circle SUBTYPE OF (curve); radius : REAL; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.subtypeOf).toBeDefined();
      expect(decl.subtypeOf!.entities).toEqual(['curve']);
    }
  });

  it('should parse ABSTRACT SUPERTYPE entity', () => {
    const decl = parseDecl(
      'ENTITY shape ABSTRACT SUPERTYPE OF (ONEOF(circle, rectangle)); END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.abstract).toBe(true);
      expect(decl.supertypeConstraint).toBeDefined();
      expect(decl.supertypeConstraint!.expression).toBeDefined();
    }
  });

  it('should parse ABSTRACT SUPERTYPE without OF (expression optional)', () => {
    const decl = parseDecl(
      'ENTITY foo ABSTRACT SUPERTYPE; attr : INTEGER; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.abstract).toBe(true);
      expect(decl.supertypeConstraint).toBeDefined();
      expect(decl.supertypeConstraint!.expression).toBeUndefined();
      expect(decl.attributes).toHaveLength(1);
    }
  });

  it('should parse ABSTRACT SUPERTYPE without OF combined with SUBTYPE OF', () => {
    const decl = parseDecl(
      'ENTITY foo ABSTRACT SUPERTYPE; SUBTYPE OF (bar); attr : INTEGER; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.abstract).toBe(true);
      expect(decl.supertypeConstraint).toBeDefined();
      expect(decl.supertypeConstraint!.expression).toBeUndefined();
      expect(decl.subtypeOf).toBeDefined();
      expect(decl.subtypeOf!.entities).toEqual(['bar']);
      expect(decl.attributes).toHaveLength(1);
    }
  });

  it('should parse entity with ABSTRACT only (no SUPERTYPE)', () => {
    const decl = parseDecl('ENTITY foo ABSTRACT; attr : INTEGER; END_ENTITY;');
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.abstract).toBe(true);
      expect(decl.supertypeConstraint).toBeUndefined();
      expect(decl.attributes).toHaveLength(1);
    }
  });

  it('should parse entity with DERIVE section', () => {
    const decl = parseDecl(
      'ENTITY circle; radius : REAL; DERIVE area : REAL := PI * radius ** 2; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.derivedAttributes).toHaveLength(1);
    }
  });

  it('should parse entity with INVERSE section', () => {
    const decl = parseDecl(
      'ENTITY item; INVERSE used_in : SET OF assembly FOR components; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.inverseAttributes).toHaveLength(1);
    }
  });

  it('should parse entity with UNIQUE section', () => {
    const decl = parseDecl(
      'ENTITY item; name : STRING; UNIQUE ur1 : name; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.uniqueRules).toHaveLength(1);
    }
  });

  it('should parse entity with WHERE section', () => {
    const decl = parseDecl(
      'ENTITY item; value : REAL; WHERE wr1 : value > 0; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.whereRules).toHaveLength(1);
    }
  });

  it('should stop explicit attributes loop at WHERE', () => {
    const decl = parseDecl(
      'ENTITY e; a : INTEGER; b : REAL; WHERE wr1 : a > 0; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.attributes).toHaveLength(2);
      expect(decl.whereRules).toBeDefined();
      expect(decl.whereRules).toHaveLength(1);
    }
  });

  it('should parse entity with OPTIONAL attribute', () => {
    const decl = parseDecl('ENTITY e; OPTIONAL x : REAL; END_ENTITY;');
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.attributes).toHaveLength(1);
      expect(decl.attributes[0]!.optional).toBe(true);
      expect(decl.attributes[0]!.names).toEqual(['x']);
    }
  });

  it('should parse entity with multiple names in one attribute', () => {
    const decl = parseDecl('ENTITY e; a, b : INTEGER; END_ENTITY;');
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.attributes).toHaveLength(1);
      expect(decl.attributes[0]!.names).toEqual(['a', 'b']);
      expect(decl.attributes[0]!.attributeType.type).toBe('SimpleType');
    }
  });

  it('should emit PAR090 when explicit attributes exceed limit', () => {
    const source =
      'SCHEMA s; ENTITY e; a : INTEGER; b : REAL; END_ENTITY; END_SCHEMA;';
    const { diagnostics } = parseExpress(source, { maxExplicitAttributes: 1 });
    const par090 = diagnostics.filter((d) => d.code === 'PAR090');
    expect(par090).toHaveLength(1);
    expect(par090[0]!.message).toBe('Too many explicit attributes in entity');
  });

  it('should emit PAR091 when DERIVE/INVERSE section items exceed limit', () => {
    const source = `SCHEMA s;
      ENTITY e;
        DERIVE
          d1 : REAL := 1.0;
          d2 : REAL := 2.0;
        END_ENTITY;
      END_SCHEMA;`;
    const { diagnostics } = parseExpress(source, { maxEntitySectionItems: 1 });
    const par091 = diagnostics.filter((d) => d.code === 'PAR091');
    expect(par091).toHaveLength(1);
    expect(par091[0]!.message).toBe(
      'Too many section items (DERIVE/INVERSE) in entity',
    );
  });

  it('should parse DERIVE with SELF\\supertype.attribute redeclaration', () => {
    const decl = parseDecl(`ENTITY oriented_edge SUBTYPE OF (edge);
      edge_element : edge;
      orientation : BOOLEAN;
    DERIVE
      SELF\\edge.edge_start : vertex := conditional_reverse(SELF.orientation, SELF.edge_element.edge_start);
    END_ENTITY;`);
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.derivedAttributes).toHaveLength(1);
      const derived = decl.derivedAttributes![0]!;
      expect(derived.name).toBe('edge_start');
      expect(derived.redeclaredAttr).toBeDefined();
      expect(derived.redeclaredAttr!.type).toBe('QualifiedRef');
      expect(derived.redeclaredAttr!.root.type).toBe('SelfRef');
      expect(derived.redeclaredAttr!.qualifiers).toHaveLength(2);
      expect(derived.redeclaredAttr!.qualifiers[0]!.type).toBe('GroupRef');
      if (derived.redeclaredAttr!.qualifiers[0]!.type === 'GroupRef') {
        expect(derived.redeclaredAttr!.qualifiers[0]!.name).toBe('edge');
      }
      expect(derived.redeclaredAttr!.qualifiers[1]!.type).toBe('AttributeRef');
      if (derived.redeclaredAttr!.qualifiers[1]!.type === 'AttributeRef') {
        expect(derived.redeclaredAttr!.qualifiers[1]!.name).toBe('edge_start');
      }
    }
  });

  it('should parse DERIVE with mix of simple and redeclared attributes', () => {
    const decl = parseDecl(`ENTITY foo SUBTYPE OF (bar);
    DERIVE
      simple_attr : REAL := 1.0;
      SELF\\bar.inherited_attr : INTEGER := 42;
    END_ENTITY;`);
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.derivedAttributes).toHaveLength(2);
      const first = decl.derivedAttributes![0]!;
      expect(first.name).toBe('simple_attr');
      expect(first.redeclaredAttr).toBeUndefined();
      const second = decl.derivedAttributes![1]!;
      expect(second.name).toBe('inherited_attr');
      expect(second.redeclaredAttr).toBeDefined();
      expect(second.redeclaredAttr!.root.type).toBe('SelfRef');
    }
  });

  it('should parse ap203-style entity with SELF\\ in DERIVE and WHERE', () => {
    const { decl, diagnostics } =
      parseDeclWithDiag(`ENTITY oriented_closed_shell SUBTYPE OF (closed_shell);
      closed_shell_element : closed_shell;
      orientation : BOOLEAN;
    DERIVE
      SELF\\connected_face_set.cfs_faces : SET [1:?] OF face :=
        conditional_reverse(SELF.orientation, SELF.closed_shell_element.cfs_faces);
    WHERE
      wr1 : NOT ('CONFIG_CONTROL_DESIGN.ORIENTED_CLOSED_SHELL' IN TYPEOF(SELF.closed_shell_element));
    END_ENTITY;`);
    expect(diagnostics).toHaveLength(0);
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.derivedAttributes).toHaveLength(1);
      expect(decl.derivedAttributes![0]!.name).toBe('cfs_faces');
      expect(decl.derivedAttributes![0]!.redeclaredAttr).toBeDefined();
      expect(decl.whereRules).toHaveLength(1);
    }
  });

  it('should parse explicit attribute with SELF\\supertype.attr redeclaration', () => {
    const decl = parseDecl(`ENTITY child SUBTYPE OF (parent);
      SELF\\parent.name : STRING;
    END_ENTITY;`);
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.attributes).toHaveLength(1);
      const attr = decl.attributes[0]!;
      expect(attr.names).toEqual(['name']);
      expect(attr.redeclaredAttr).toBeDefined();
      expect(attr.redeclaredAttr!.type).toBe('QualifiedRef');
      expect(attr.redeclaredAttr!.root.type).toBe('SelfRef');
      expect(attr.redeclaredAttr!.qualifiers).toHaveLength(2);
      expect(attr.redeclaredAttr!.qualifiers[0]!.type).toBe('GroupRef');
      if (attr.redeclaredAttr!.qualifiers[0]!.type === 'GroupRef') {
        expect(attr.redeclaredAttr!.qualifiers[0]!.name).toBe('parent');
      }
      expect(attr.redeclaredAttr!.qualifiers[1]!.type).toBe('AttributeRef');
      if (attr.redeclaredAttr!.qualifiers[1]!.type === 'AttributeRef') {
        expect(attr.redeclaredAttr!.qualifiers[1]!.name).toBe('name');
      }
    }
  });

  it('should parse inverse attribute with SELF\\supertype.attr redeclaration', () => {
    const decl = parseDecl(`ENTITY child SUBTYPE OF (parent);
      INVERSE
        SELF\\parent.items : SET OF other_entity FOR ref;
    END_ENTITY;`);
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.inverseAttributes).toHaveLength(1);
      const inv = decl.inverseAttributes![0]!;
      expect(inv.name).toBe('items');
      expect(inv.redeclaredAttr).toBeDefined();
      expect(inv.redeclaredAttr!.type).toBe('QualifiedRef');
      expect(inv.redeclaredAttr!.root.type).toBe('SelfRef');
      expect(inv.redeclaredAttr!.qualifiers).toHaveLength(2);
    }
  });

  it('should parse normal explicit attributes after SELF\\ fix (regression)', () => {
    const decl = parseDecl('ENTITY e; a, b : INTEGER; c : REAL; END_ENTITY;');
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.attributes).toHaveLength(2);
      expect(decl.attributes[0]!.names).toEqual(['a', 'b']);
      expect(decl.attributes[0]!.redeclaredAttr).toBeUndefined();
      expect(decl.attributes[1]!.names).toEqual(['c']);
      expect(decl.attributes[1]!.redeclaredAttr).toBeUndefined();
    }
  });

  it('should parse UNIQUE clause with SELF\\entity.attribute', () => {
    const decl = parseDecl(
      'ENTITY foo SUBTYPE OF (bar); UNIQUE UR1: SELF\\bar.name; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.uniqueRules).toHaveLength(1);
      const rule = decl.uniqueRules![0]!;
      expect(rule.label).toBe('UR1');
      expect(rule.attributes).toHaveLength(1);
      expect(typeof rule.attributes[0]).not.toBe('string');
      if (typeof rule.attributes[0] !== 'string') {
        expect(rule.attributes[0].type).toBe('QualifiedRef');
      }
    }
  });

  it('should parse UNIQUE clause with mixed simple and qualified refs', () => {
    const decl = parseDecl(
      'ENTITY baz SUBTYPE OF (bar); cfg : STRING; UNIQUE UR1: cfg, SELF\\bar.name; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.uniqueRules).toHaveLength(1);
      const rule = decl.uniqueRules![0]!;
      expect(rule.attributes).toHaveLength(2);
      expect(typeof rule.attributes[0]).toBe('string');
      expect(rule.attributes[0]).toBe('cfg');
      expect(typeof rule.attributes[1]).not.toBe('string');
    }
  });

  it('should parse UNIQUE clause with multiple SELF refs', () => {
    const decl = parseDecl(
      'ENTITY qux SUBTYPE OF (bar); UNIQUE UR1: SELF\\bar.name, SELF\\bar.description; END_ENTITY;',
    );
    expect(decl.type).toBe('EntityDeclaration');
    if (decl.type === 'EntityDeclaration') {
      expect(decl.uniqueRules).toHaveLength(1);
      const rule = decl.uniqueRules![0]!;
      expect(rule.attributes).toHaveLength(2);
      expect(typeof rule.attributes[0]).not.toBe('string');
      expect(typeof rule.attributes[1]).not.toBe('string');
    }
  });
});

describe('Type declarations', () => {
  it('should parse simple TYPE', () => {
    const decl = parseDecl('TYPE length = REAL; END_TYPE;');
    expect(decl.type).toBe('TypeDeclaration');
    if (decl.type === 'TypeDeclaration') {
      expect(decl.name).toBe('LENGTH');
    }
  });

  it('should parse TYPE with WHERE', () => {
    const decl = parseDecl(
      'TYPE positive_real = REAL; WHERE wr1 : SELF > 0; END_TYPE;',
    );
    expect(decl.type).toBe('TypeDeclaration');
    if (decl.type === 'TypeDeclaration') {
      expect(decl.whereRules).toHaveLength(1);
    }
  });

  it('should parse TYPE enumeration', () => {
    const decl = parseDecl(
      'TYPE color = ENUMERATION OF (red, green, blue); END_TYPE;',
    );
    expect(decl.type).toBe('TypeDeclaration');
    if (decl.type === 'TypeDeclaration') {
      expect(decl.underlyingType.type).toBe('EnumerationType');
    }
  });

  it('should parse TYPE select', () => {
    const decl = parseDecl(
      'TYPE geometric_item = SELECT (point, curve, surface); END_TYPE;',
    );
    expect(decl.type).toBe('TypeDeclaration');
    if (decl.type === 'TypeDeclaration') {
      expect(decl.underlyingType.type).toBe('SelectType');
    }
  });

  it('should parse TYPE with LIST OF aggregation', () => {
    const decl = parseDecl('TYPE list_real = LIST OF REAL; END_TYPE;');
    expect(decl.type).toBe('TypeDeclaration');
    if (decl.type === 'TypeDeclaration') {
      expect(decl.underlyingType.type).toBe('AggregationType');
      if (decl.underlyingType.type === 'AggregationType') {
        expect(decl.underlyingType.kind).toBe('LIST');
        expect(decl.underlyingType.baseType.type).toBe('SimpleType');
      }
    }
  });
});

describe('Function declarations', () => {
  it('should parse FUNCTION with params, return type, locals, body', () => {
    const src = `FUNCTION distance(p1 : point; p2 : point) : REAL;
      LOCAL
        dx : REAL := p2.x - p1.x;
      END_LOCAL;
      RETURN (dx);
    END_FUNCTION;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('FunctionDeclaration');
    if (decl.type === 'FunctionDeclaration') {
      expect(decl.name).toBe('distance');
      expect(decl.parameters).toHaveLength(2);
      expect(decl.declarations).toBeDefined();
      expect(decl.body.length).toBeGreaterThan(0);
    }
  });

  it('should parse FUNCTION with several params sharing same type (a, b : point)', () => {
    const src = `FUNCTION mid(a, b : point) : point;
      RETURN (point(0.0, 0.0));
    END_FUNCTION;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('FunctionDeclaration');
    if (decl.type === 'FunctionDeclaration') {
      expect(decl.parameters).toHaveLength(1);
      expect(decl.parameters[0]!.names).toEqual(['a', 'b']);
      expect(decl.parameters[0]!.parameterType.type).toBe('NamedType');
      if (decl.parameters[0]!.parameterType.type === 'NamedType') {
        expect(decl.parameters[0]!.parameterType.name).toBe('point');
      }
    }
  });

  it('should parse FUNCTION with only RETURN without LOCALS', () => {
    const src = `FUNCTION one() : INTEGER; RETURN (1); END_FUNCTION;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('FunctionDeclaration');
    if (decl.type === 'FunctionDeclaration') {
      expect(decl.name).toBe('one');
      expect(decl.parameters).toHaveLength(0);
      expect(decl.declarations).toBeUndefined();
      expect(decl.body.length).toBeGreaterThan(0);
    }
  });

  it('should parse FUNCTION with nested FUNCTION declaration', () => {
    const src = `FUNCTION outer(x : INTEGER) : INTEGER;
      FUNCTION inner(y : INTEGER) : INTEGER;
        RETURN (y + 1);
      END_FUNCTION;
      RETURN (inner(x));
    END_FUNCTION;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('FunctionDeclaration');
    if (decl.type === 'FunctionDeclaration') {
      expect(decl.name).toBe('outer');
      expect(decl.declarations).toBeDefined();
      expect(decl.declarations!.length).toBe(1);
      expect(decl.declarations![0]!.type).toBe('FunctionDeclaration');
      if (decl.declarations![0]!.type === 'FunctionDeclaration') {
        expect(decl.declarations![0]!.name).toBe('inner');
      }
      expect(decl.body.length).toBeGreaterThan(0);
    }
  });

  it('should parse FUNCTION with nested PROCEDURE declaration', () => {
    const src = `FUNCTION compute(x : INTEGER) : INTEGER;
      PROCEDURE helper(VAR out : INTEGER);
        out := x + 1;
      END_PROCEDURE;
      LOCAL
        result : INTEGER;
      END_LOCAL;
      helper(result);
      RETURN (result);
    END_FUNCTION;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('FunctionDeclaration');
    if (decl.type === 'FunctionDeclaration') {
      expect(decl.declarations).toBeDefined();
      const nestedProc = decl.declarations!.find(
        (d) => d.type === 'ProcedureDeclaration',
      );
      expect(nestedProc).toBeDefined();
    }
  });
});

describe('Procedure declarations', () => {
  it('should parse PROCEDURE with params', () => {
    const src = `PROCEDURE do_work(VAR items : LIST OF INTEGER);
      x := 1;
    END_PROCEDURE;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('ProcedureDeclaration');
    if (decl.type === 'ProcedureDeclaration') {
      expect(decl.parameters).toHaveLength(1);
      expect(decl.parameters[0]!.isVar).toBe(true);
    }
  });

  it('should parse PROCEDURE without params', () => {
    const src = `PROCEDURE init;
      x := 0;
    END_PROCEDURE;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('ProcedureDeclaration');
    if (decl.type === 'ProcedureDeclaration') {
      expect(decl.parameters).toHaveLength(0);
    }
  });

  it('should parse PROCEDURE with several params and mix of VAR and non-VAR', () => {
    const src = `PROCEDURE mix_params(x : INTEGER; VAR out : REAL);
      out := 0.0;
    END_PROCEDURE;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('ProcedureDeclaration');
    if (decl.type === 'ProcedureDeclaration') {
      expect(decl.parameters).toHaveLength(2);
      expect(decl.parameters[0]!.isVar).toBeUndefined();
      expect(decl.parameters[1]!.isVar).toBe(true);
    }
  });

  it('should parse PROCEDURE with nested FUNCTION declaration', () => {
    const src = `PROCEDURE do_calc(VAR out : INTEGER);
      FUNCTION helper(x : INTEGER) : INTEGER;
        RETURN (x * 2);
      END_FUNCTION;
      out := helper(5);
    END_PROCEDURE;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('ProcedureDeclaration');
    if (decl.type === 'ProcedureDeclaration') {
      expect(decl.declarations).toBeDefined();
      expect(decl.declarations!.length).toBe(1);
      expect(decl.declarations![0]!.type).toBe('FunctionDeclaration');
    }
  });
});

describe('Rule declarations', () => {
  it('should parse RULE with WHERE', () => {
    const src = `RULE check FOR (item);
      WHERE wr1 : item.value > 0;
    END_RULE;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('RuleDeclaration');
    if (decl.type === 'RuleDeclaration') {
      expect(decl.name).toBe('check');
      expect(decl.entities).toEqual(['item']);
      expect(decl.whereRules).toBeDefined();
    }
  });

  it('should parse RULE with several WHERE rules', () => {
    const src = `RULE check FOR (item);
      WHERE wr1 : item.value > 0;
      WHERE wr2 : item.name <> '';
    END_RULE;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('RuleDeclaration');
    if (decl.type === 'RuleDeclaration') {
      expect(decl.whereRules).toBeDefined();
      expect(decl.whereRules!.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('Subtype constraint declarations', () => {
  it('should parse SUBTYPE_CONSTRAINT with ABSTRACT SUPERTYPE', () => {
    const src = `SUBTYPE_CONSTRAINT sc FOR shape;
      ABSTRACT SUPERTYPE;
      ONEOF(circle, rectangle);
    END_SUBTYPE_CONSTRAINT;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('SubtypeConstraintDeclaration');
    if (decl.type === 'SubtypeConstraintDeclaration') {
      expect(decl.abstractSupertype).toBe(true);
    }
  });

  it('should parse SUBTYPE_CONSTRAINT without ABSTRACT (only ONEOF)', () => {
    const src = `SUBTYPE_CONSTRAINT sc FOR shape;
      ONEOF(circle, rectangle);
    END_SUBTYPE_CONSTRAINT;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('SubtypeConstraintDeclaration');
    if (decl.type === 'SubtypeConstraintDeclaration') {
      expect(decl.abstractSupertype).toBeFalsy();
      expect(decl.name).toBe('sc');
    }
  });
});

describe('Constant declarations', () => {
  it('should parse CONSTANT block', () => {
    const src = `CONSTANT
      pi : REAL := 3.14159;
      two_pi : REAL := 6.28318;
    END_CONSTANT;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('ConstantDeclaration');
    if (decl.type === 'ConstantDeclaration') {
      expect(decl.constants).toHaveLength(2);
    }
  });

  it('should parse CONSTANT with expression involving function call', () => {
    const src = `CONSTANT
      zero : REAL := abs(-1.0);
    END_CONSTANT;`;
    const decl = parseDecl(src);
    expect(decl.type).toBe('ConstantDeclaration');
    if (decl.type === 'ConstantDeclaration') {
      expect(decl.constants).toHaveLength(1);
      expect(decl.constants[0]!.expression.type).toBe('FunctionCallExpression');
    }
  });
});
