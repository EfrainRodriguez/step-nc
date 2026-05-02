import { describe, expect, it } from 'vitest';
import type {
  RepeatControlNode,
  StatementNode,
} from '../../src/ast/statements';
import { lexExpress } from '../../src/lexer/lexer';
import { ParserContext } from '../../src/parser/context';
import { parseStatement } from '../../src/parser/statements';

function parseStmt(source: string): StatementNode {
  const { tokens } = lexExpress(source);
  const ctx = new ParserContext(tokens);
  return parseStatement(ctx);
}

describe('Null statement', () => {
  it('should parse ;', () => {
    const stmt = parseStmt(';');
    expect(stmt.type).toBe('NullStatement');
  });
});

describe('Assignment statement', () => {
  it('should parse x := 1;', () => {
    const stmt = parseStmt('x := 1;');
    expect(stmt.type).toBe('AssignmentStatement');
    if (stmt.type === 'AssignmentStatement') {
      expect(stmt.target.type).toBe('IdentifierRef');
    }
  });

  it('should parse entity.attr := value;', () => {
    const stmt = parseStmt('entity.attr := value;');
    expect(stmt.type).toBe('AssignmentStatement');
    if (stmt.type === 'AssignmentStatement') {
      expect(stmt.target.type).toBe('QualifiedRef');
    }
  });

  it('should parse list[1] := x;', () => {
    const stmt = parseStmt('list[1] := x;');
    expect(stmt.type).toBe('AssignmentStatement');
  });

  it('should parse SELF\\base.attr := y;', () => {
    const stmt = parseStmt('SELF\\base.attr := y;');
    expect(stmt.type).toBe('AssignmentStatement');
    if (stmt.type === 'AssignmentStatement') {
      expect(stmt.target.type).toBe('QualifiedRef');
    }
  });
});

describe('Procedure call statement', () => {
  it('should parse do_something;', () => {
    const stmt = parseStmt('do_something;');
    expect(stmt.type).toBe('ProcedureCallStatement');
    if (stmt.type === 'ProcedureCallStatement') {
      expect(stmt.procedure).toBe('do_something');
      expect(stmt.args).toHaveLength(0);
    }
  });

  it('should parse INSERT(list, item);', () => {
    const stmt = parseStmt('INSERT(list, item);');
    expect(stmt.type).toBe('ProcedureCallStatement');
    if (stmt.type === 'ProcedureCallStatement') {
      expect(stmt.procedure).toBe('INSERT');
      expect(stmt.args).toHaveLength(2);
    }
  });

  it('should parse REMOVE(list, idx);', () => {
    const stmt = parseStmt('REMOVE(list, idx);');
    expect(stmt.type).toBe('ProcedureCallStatement');
    if (stmt.type === 'ProcedureCallStatement') {
      expect(stmt.procedure).toBe('REMOVE');
    }
  });
});

describe('IF statement', () => {
  it('should parse IF x > 0 THEN y := x; END_IF;', () => {
    const stmt = parseStmt('IF x > 0 THEN y := x; END_IF;');
    expect(stmt.type).toBe('IfStatement');
    if (stmt.type === 'IfStatement') {
      expect(stmt.thenBranch).toHaveLength(1);
      expect(stmt.elseBranch).toBeUndefined();
    }
  });

  it('should parse IF with ELSE', () => {
    const stmt = parseStmt('IF x > 0 THEN y := 1; ELSE y := 2; END_IF;');
    expect(stmt.type).toBe('IfStatement');
    if (stmt.type === 'IfStatement') {
      expect(stmt.thenBranch).toHaveLength(1);
      expect(stmt.elseBranch).toHaveLength(1);
    }
  });
});

describe('CASE statement', () => {
  it('should parse CASE with actions', () => {
    const stmt = parseStmt('CASE x OF 1 : y := 1; END_CASE;');
    expect(stmt.type).toBe('CaseStatement');
  });

  it('should parse CASE with several branches and OTHERWISE', () => {
    const stmt = parseStmt(
      'CASE n OF 1 : a := 1; 2 : a := 2; 3 : a := 3; OTHERWISE : a := 0; END_CASE;',
    );
    expect(stmt.type).toBe('CaseStatement');
    if (stmt.type === 'CaseStatement') {
      expect(stmt.actions.length).toBeGreaterThanOrEqual(3);
      expect(stmt.otherwise).toBeDefined();
      expect(stmt.otherwise!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should parse CASE with parenthesized string expression labels', () => {
    const stmt = parseStmt(`CASE x OF
      ('ABC' IN TYPEOF(y)) : a := 1;
      ('DEF' IN TYPEOF(y)) : a := 2;
      OTHERWISE : a := 0;
    END_CASE;`);
    expect(stmt.type).toBe('CaseStatement');
    if (stmt.type === 'CaseStatement') {
      expect(stmt.actions.length).toBeGreaterThanOrEqual(2);
      expect(stmt.otherwise).toBeDefined();
    }
  });

  it('should parse CASE with normal identifier labels after SYM_LPAREN fix (regression)', () => {
    const stmt = parseStmt(
      'CASE n OF 1 : a := 1; 2 : a := 2; OTHERWISE : a := 0; END_CASE;',
    );
    expect(stmt.type).toBe('CaseStatement');
    if (stmt.type === 'CaseStatement') {
      expect(stmt.actions.length).toBeGreaterThanOrEqual(2);
      expect(stmt.otherwise).toBeDefined();
    }
  });
});

describe('REPEAT statement', () => {
  it('should parse REPEAT i := 1 TO 10;', () => {
    const stmt = parseStmt('REPEAT i := 1 TO 10; x := x + 1; END_REPEAT;');
    expect(stmt.type).toBe('RepeatStatement');
    if (stmt.type === 'RepeatStatement') {
      expect(stmt.control).toBeDefined();
      if (stmt.control && stmt.control.type === 'RepeatControl') {
        expect(stmt.control.kind).toBe('FOR');
      }
    }
  });

  it('should parse REPEAT WHILE cond;', () => {
    const stmt = parseStmt('REPEAT WHILE x > 0; x := x - 1; END_REPEAT;');
    expect(stmt.type).toBe('RepeatStatement');
    if (stmt.type === 'RepeatStatement' && stmt.control) {
      expect((stmt.control as RepeatControlNode).kind).toBe('WHILE');
    }
  });

  it('should parse REPEAT UNTIL cond;', () => {
    const stmt = parseStmt('REPEAT UNTIL x = 0; x := x - 1; END_REPEAT;');
    expect(stmt.type).toBe('RepeatStatement');
  });

  it('should parse REPEAT with BY', () => {
    const stmt = parseStmt('REPEAT i := 1 TO 10 BY 2; x := i; END_REPEAT;');
    expect(stmt.type).toBe('RepeatStatement');
    if (stmt.type === 'RepeatStatement' && stmt.control) {
      expect((stmt.control as RepeatControlNode).increment).toBeDefined();
    }
  });

  it('should parse REPEAT without control (body only)', () => {
    const stmt = parseStmt('REPEAT; x := x + 1; END_REPEAT;');
    expect(stmt.type).toBe('RepeatStatement');
    if (stmt.type === 'RepeatStatement') {
      expect(stmt.control).toBeUndefined();
      expect(stmt.statements.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should parse REPEAT i := 1 TO n WHILE condition (FOR + WHILE combined)', () => {
    const stmt = parseStmt(
      'REPEAT i := 1 TO n WHILE x > 0; x := x - 1; END_REPEAT;',
    );
    expect(stmt.type).toBe('RepeatStatement');
    if (stmt.type === 'RepeatStatement') {
      expect(stmt.control).toBeDefined();
      const ctrl = stmt.control as RepeatControlNode;
      expect(ctrl.kind).toBe('FOR');
      expect(ctrl.variable).toBe('i');
      expect(ctrl.whileCondition).toBeDefined();
      expect(ctrl.untilCondition).toBeUndefined();
    }
  });

  it('should parse REPEAT i := 1 TO n UNTIL condition (FOR + UNTIL combined)', () => {
    const stmt = parseStmt(
      'REPEAT i := 1 TO n UNTIL done; x := i; END_REPEAT;',
    );
    expect(stmt.type).toBe('RepeatStatement');
    if (stmt.type === 'RepeatStatement') {
      expect(stmt.control).toBeDefined();
      const ctrl = stmt.control as RepeatControlNode;
      expect(ctrl.kind).toBe('FOR');
      expect(ctrl.variable).toBe('i');
      expect(ctrl.untilCondition).toBeDefined();
      expect(ctrl.whileCondition).toBeUndefined();
    }
  });

  it('should still parse REPEAT WHILE only (regression)', () => {
    const stmt = parseStmt('REPEAT WHILE x > 0; x := x - 1; END_REPEAT;');
    expect(stmt.type).toBe('RepeatStatement');
    if (stmt.type === 'RepeatStatement' && stmt.control) {
      const ctrl = stmt.control as RepeatControlNode;
      expect(ctrl.kind).toBe('WHILE');
      expect(ctrl.condition).toBeDefined();
      expect(ctrl.whileCondition).toBeUndefined();
      expect(ctrl.untilCondition).toBeUndefined();
    }
  });

  it('should still parse REPEAT FOR only (regression)', () => {
    const stmt = parseStmt('REPEAT i := 1 TO 10; x := i; END_REPEAT;');
    expect(stmt.type).toBe('RepeatStatement');
    if (stmt.type === 'RepeatStatement' && stmt.control) {
      const ctrl = stmt.control as RepeatControlNode;
      expect(ctrl.kind).toBe('FOR');
      expect(ctrl.whileCondition).toBeUndefined();
      expect(ctrl.untilCondition).toBeUndefined();
    }
  });
});

describe('ALIAS statement', () => {
  it('should parse ALIAS v FOR entity.attr;', () => {
    const stmt = parseStmt('ALIAS v FOR entity.attr; x := v; END_ALIAS;');
    expect(stmt.type).toBe('AliasStatement');
    if (stmt.type === 'AliasStatement') {
      expect(stmt.variable).toBe('v');
    }
  });
});

describe('RETURN statement', () => {
  it('should parse RETURN;', () => {
    const stmt = parseStmt('RETURN;');
    expect(stmt.type).toBe('ReturnStatement');
    if (stmt.type === 'ReturnStatement') {
      expect(stmt.value).toBeUndefined();
    }
  });

  it('should parse RETURN (expr);', () => {
    const stmt = parseStmt('RETURN (x + 1);');
    expect(stmt.type).toBe('ReturnStatement');
    if (stmt.type === 'ReturnStatement') {
      expect(stmt.value).toBeDefined();
    }
  });
});

describe('SKIP and ESCAPE', () => {
  it('should parse SKIP;', () => {
    const stmt = parseStmt('SKIP;');
    expect(stmt.type).toBe('SkipStatement');
  });

  it('should parse ESCAPE;', () => {
    const stmt = parseStmt('ESCAPE;');
    expect(stmt.type).toBe('EscapeStatement');
  });
});

describe('Compound statement', () => {
  it('should parse BEGIN stmts END;', () => {
    const stmt = parseStmt('BEGIN x := 1; y := 2; END;');
    expect(stmt.type).toBe('CompoundStatement');
    if (stmt.type === 'CompoundStatement') {
      expect(stmt.statements).toHaveLength(2);
    }
  });
});
