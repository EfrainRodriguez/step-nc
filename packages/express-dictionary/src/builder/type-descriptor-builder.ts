import type { TypeNode } from '@step-nc/express-parser';
import type { TypeDescriptor } from '../types/type-descriptor';

/**
 * Converts an AST TypeNode into a TypeDescriptor.
 * Named types remain as 'unresolved' — resolution happens in Phase 2 (resolve-types).
 */
export function buildTypeDescriptor(node: TypeNode): TypeDescriptor {
  switch (node.type) {
    case 'SimpleType':
      return { kind: 'simple', simpleType: node.kind };

    case 'AggregationType':
      return {
        kind: 'aggregation',
        aggregationKind: node.kind,
        ...(node.bounds && {
          bounds: {
            ...(node.bounds.lower !== undefined && {
              lower: node.bounds.lower,
            }),
            ...(node.bounds.upper !== undefined && {
              upper: node.bounds.upper,
            }),
          },
        }),
        elementType: buildTypeDescriptor(node.baseType),
      };

    case 'EnumerationType':
      return {
        kind: 'enumeration',
        values: [...node.values],
        extensible: node.extensible ?? false,
      };

    case 'SelectType':
      return {
        kind: 'select',
        selections: node.types.map((name) => ({ name })),
        extensible: node.extensible ?? false,
        ...(node.generic !== undefined && { generic: node.generic }),
      };

    case 'NamedType':
      return {
        kind: 'unresolved',
        name: node.name,
        span: node.span,
      };

    case 'GenericType':
      return { kind: 'generic' };

    case 'GenericEntityType':
      return { kind: 'genericEntity' };

    case 'AggregateType':
      return {
        kind: 'aggregation',
        aggregationKind: 'BAG',
        elementType: buildTypeDescriptor(node.baseType),
      };
  }
}
