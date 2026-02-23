import { describe, expect, it } from 'vitest';
import { parseExpress } from '../../src/parser/parser';

describe('parseExpress — end-to-end integration', () => {
  it('should parse a complete realistic schema', () => {
    const source = `
      SCHEMA geometry;
        USE FROM math_functions;
        REFERENCE FROM support (base_type AS bt);

        TYPE length = REAL;
          WHERE wr1 : SELF > 0.0;
        END_TYPE;

        ENTITY point;
          x : REAL;
          y : REAL;
          z : REAL;
        END_ENTITY;

        ENTITY circle
          SUBTYPE OF (curve);
          centre : point;
          radius : length;
          DERIVE
            area : REAL := PI * radius ** 2;
          WHERE
            positive_radius : radius > 0.0;
        END_ENTITY;

        FUNCTION distance(p1 : point; p2 : point) : REAL;
          LOCAL
            dx : REAL := p2.x - p1.x;
            dy : REAL := p2.y - p1.y;
            dz : REAL := p2.z - p1.z;
          END_LOCAL;
          RETURN (SQRT(dx ** 2 + dy ** 2 + dz ** 2));
        END_FUNCTION;
      END_SCHEMA;
    `;

    const { ast, diagnostics } = parseExpress(source);

    expect(diagnostics).toHaveLength(0);
    expect(ast.type).toBe('SchemaDeclaration');
    expect(ast.name).toBe('geometry');

    expect(ast.interfaces).toHaveLength(2);
    expect(ast.interfaces[0]!.type).toBe('UseClause');
    expect(ast.interfaces[1]!.type).toBe('ReferenceClause');

    expect(ast.declarations).toHaveLength(4);
    expect(ast.declarations[0]!.type).toBe('TypeDeclaration');
    expect(ast.declarations[1]!.type).toBe('EntityDeclaration');
    expect(ast.declarations[2]!.type).toBe('EntityDeclaration');
    expect(ast.declarations[3]!.type).toBe('FunctionDeclaration');

    const typeDecl = ast.declarations[0]!;
    if (typeDecl.type === 'TypeDeclaration') {
      expect(typeDecl.name).toBe('length');
      expect(typeDecl.underlyingType.type).toBe('SimpleType');
      expect(typeDecl.whereRules).toHaveLength(1);
    }

    const pointEntity = ast.declarations[1]!;
    if (pointEntity.type === 'EntityDeclaration') {
      expect(pointEntity.name).toBe('point');
      expect(pointEntity.attributes).toHaveLength(3);
    }

    const circleEntity = ast.declarations[2]!;
    if (circleEntity.type === 'EntityDeclaration') {
      expect(circleEntity.name).toBe('circle');
      expect(circleEntity.subtypeOf).toBeDefined();
      expect(circleEntity.subtypeOf!.entities).toEqual(['curve']);
      expect(circleEntity.attributes).toHaveLength(2);
      expect(circleEntity.derivedAttributes).toHaveLength(1);
      expect(circleEntity.whereRules).toHaveLength(1);
    }

    const funcDecl = ast.declarations[3]!;
    if (funcDecl.type === 'FunctionDeclaration') {
      expect(funcDecl.name).toBe('distance');
      expect(funcDecl.parameters).toHaveLength(2);
      expect(funcDecl.returnType.type).toBe('SimpleType');
      expect(funcDecl.declarations).toBeDefined();
      expect(funcDecl.body).toHaveLength(1);
    }
  });

  it('should parse a minimal schema without errors', () => {
    const { ast, diagnostics } = parseExpress('SCHEMA s; END_SCHEMA;');
    expect(diagnostics).toHaveLength(0);
    expect(ast.name).toBe('s');
    expect(ast.declarations).toHaveLength(0);
  });

  it('should parse entity with all sections', () => {
    const source = `
      SCHEMA s;
        ENTITY shape
          ABSTRACT SUPERTYPE OF (ONEOF(circle, rectangle));
          name : STRING;
          DERIVE
            description : STRING := name + ' shape';
          INVERSE
            used_in : SET OF usage FOR shape;
          UNIQUE
            ur1 : name;
          WHERE
            wr1 : name <> '';
        END_ENTITY;
      END_SCHEMA;
    `;

    const { ast, diagnostics } = parseExpress(source);
    expect(diagnostics).toHaveLength(0);

    const entity = ast.declarations[0]!;
    if (entity.type === 'EntityDeclaration') {
      expect(entity.abstract).toBe(true);
      expect(entity.supertypeConstraint).toBeDefined();
      expect(entity.attributes).toHaveLength(1);
      expect(entity.derivedAttributes).toHaveLength(1);
      expect(entity.inverseAttributes).toHaveLength(1);
      expect(entity.uniqueRules).toHaveLength(1);
      expect(entity.whereRules).toHaveLength(1);
    }
  });

  it('should parse schema with procedure and rule', () => {
    const source = `
      SCHEMA s;
        PROCEDURE do_nothing;
        END_PROCEDURE;

        RULE check_positive FOR (point);
          WHERE
            wr1 : point.x > 0;
        END_RULE;
      END_SCHEMA;
    `;

    const { ast, diagnostics } = parseExpress(source);
    expect(diagnostics).toHaveLength(0);
    expect(ast.declarations).toHaveLength(2);
    expect(ast.declarations[0]!.type).toBe('ProcedureDeclaration');
    expect(ast.declarations[1]!.type).toBe('RuleDeclaration');
  });

  it('should parse schema with constant block', () => {
    const source = `
      SCHEMA s;
        CONSTANT
          pi_val : REAL := 3.14159;
          max_count : INTEGER := 100;
        END_CONSTANT;
      END_SCHEMA;
    `;

    const { ast, diagnostics } = parseExpress(source);
    expect(diagnostics).toHaveLength(0);
    expect(ast.declarations).toHaveLength(1);
    expect(ast.declarations[0]!.type).toBe('ConstantDeclaration');
    if (ast.declarations[0]!.type === 'ConstantDeclaration') {
      expect(ast.declarations[0]!.constants).toHaveLength(2);
    }
  });

  it('should report diagnostics for malformed input', () => {
    const { diagnostics } = parseExpress('SCHEMA s; ENTITY END_SCHEMA;');
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it('should parse span covering entire source', () => {
    const source = 'SCHEMA s; END_SCHEMA;';
    const { ast } = parseExpress(source);
    expect(ast.span.start.offset).toBe(0);
    expect(ast.span.end.offset).toBeGreaterThan(0);
  });
});
