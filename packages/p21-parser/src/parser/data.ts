import type {
  ComplexEntityInstanceNode,
  DataSectionNode,
  EntityInstanceNode,
  SimpleEntityInstanceNode,
  SimpleRecordNode,
} from '../ast/data';
import type { ParameterNode } from '../ast/parameter';
import { expectSemicolon, SYNC_ENTITY, synchronize } from './common';
import { ParserContext } from './context';
import { parseParameterList } from './parameter';
import { spanOfToken } from './types';

export function parseDataSection(ctx: ParserContext): DataSectionNode {
  const start = ctx.startPos();

  ctx.expect('KW_DATA');

  let name: string | undefined;
  let parameters: ParameterNode[] | undefined;

  if (ctx.check('SYM_LPAREN')) {
    ctx.consume();
    const paramList = parseParameterList(ctx);
    ctx.expect('SYM_RPAREN');
    parameters = paramList;
    // If the first parameter is a string, extract it as the name
    if (paramList.length > 0 && paramList[0]!.type === 'StringValue') {
      name = paramList[0]!.value;
    }
  }

  expectSemicolon(ctx);

  const entities: EntityInstanceNode[] = [];

  while (!ctx.isEOF() && !ctx.check('KW_ENDSEC')) {
    if (ctx.check('ENTITY_INSTANCE_NAME')) {
      entities.push(parseEntityInstance(ctx));
    } else {
      const token = ctx.current();
      ctx.error(
        'P21P030',
        `Expected entity instance (#N), found '${token.kind}'`,
        spanOfToken(token),
      );
      synchronize(ctx, SYNC_ENTITY);
      if (ctx.check('ENTITY_INSTANCE_NAME')) continue;
      break;
    }
  }

  ctx.expect('KW_ENDSEC');
  expectSemicolon(ctx);

  return {
    type: 'DataSection',
    ...(name !== undefined ? { name } : {}),
    ...(parameters !== undefined ? { parameters } : {}),
    entities,
    span: ctx.spanFrom(start),
  };
}

function parseEntityInstance(ctx: ParserContext): EntityInstanceNode {
  const start = ctx.startPos();
  const idToken = ctx.consume(); // ENTITY_INSTANCE_NAME
  const id = parseInt(idToken.text.slice(1), 10);

  ctx.expect('SYM_EQUALS');

  let result: EntityInstanceNode;

  if (ctx.check('STANDARD_KEYWORD')) {
    // Simple entity: #N = KEYWORD(...);
    const record = parseSimpleRecord(ctx);
    result = {
      type: 'SimpleEntityInstance',
      id,
      record,
      span: ctx.spanFrom(start),
    } as SimpleEntityInstanceNode;
  } else if (ctx.check('SYM_LPAREN')) {
    // Complex entity: #N = (REC1(...) REC2(...) ...);
    const records = parseSubsuperRecord(ctx);
    result = {
      type: 'ComplexEntityInstance',
      id,
      records,
      span: ctx.spanFrom(start),
    } as ComplexEntityInstanceNode;
  } else {
    const token = ctx.current();
    ctx.error(
      'P21P031',
      `Expected keyword or '(' after '=', found '${token.kind}'`,
      spanOfToken(token),
    );
    synchronize(ctx, SYNC_ENTITY);
    return {
      type: 'SimpleEntityInstance',
      id,
      record: {
        type: 'SimpleRecord',
        keyword: '<error>',
        parameters: [],
        span: ctx.spanFrom(start),
      },
      span: ctx.spanFrom(start),
    };
  }

  expectSemicolon(ctx);

  return {
    ...result,
    span: ctx.spanFrom(start),
  };
}

function parseSimpleRecord(ctx: ParserContext): SimpleRecordNode {
  const start = ctx.startPos();
  const keyword = ctx.consume().text; // STANDARD_KEYWORD

  ctx.expect('SYM_LPAREN');
  const parameters = parseParameterList(ctx);
  ctx.expect('SYM_RPAREN');

  return {
    type: 'SimpleRecord',
    keyword,
    parameters,
    span: ctx.spanFrom(start),
  };
}

function parseSubsuperRecord(ctx: ParserContext): SimpleRecordNode[] {
  const records: SimpleRecordNode[] = [];

  ctx.expect('SYM_LPAREN');

  while (!ctx.isEOF() && !ctx.check('SYM_RPAREN')) {
    if (ctx.check('STANDARD_KEYWORD')) {
      records.push(parseSimpleRecord(ctx));
    } else {
      const token = ctx.current();
      ctx.error(
        'P21P032',
        `Expected keyword in complex entity record, found '${token.kind}'`,
        spanOfToken(token),
      );
      break;
    }
  }

  ctx.expect('SYM_RPAREN');

  return records;
}
