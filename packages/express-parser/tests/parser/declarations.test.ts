import { describe, expect, it } from 'vitest';
import type { DeclarationNode } from '../../src/ast/declarations';
import { lexExpress } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseDeclaration } from '../../src/parser/declarations';

function parseDecl(source: string): DeclarationNode {
  const { tokens } = lexExpress(source);
  const ctx = new ParserContext(tokens);
  return parseDeclaration(ctx);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
});

describe('Type declarations', () => {
  it('should parse simple TYPE', () => {
    const decl = parseDecl('TYPE length = REAL; END_TYPE;');
    expect(decl.type).toBe('TypeDeclaration');
    if (decl.type === 'TypeDeclaration') {
      expect(decl.name).toBe('length');
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
});
