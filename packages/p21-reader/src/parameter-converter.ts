import type {
  AggregationTypeDescriptor,
  ExpressSchema,
  TypeDefinition,
  TypeDescriptor,
} from '@step-nc/express-dictionary';
import {
  getEntity,
  getType,
  resolveToBaseType,
} from '@step-nc/express-dictionary';
import type { ListNode, ParameterNode } from '@step-nc/p21-parser';
import type { AttributeValue, InstanceId } from '@step-nc/step-factory';
import {
  asInstanceId,
  createBag,
  createList,
  createRef,
  createSelectValue,
  createSet,
  extractBoundValue,
  INDETERMINATE,
} from '@step-nc/step-factory';
import type { ReaderDiagnostic } from './diagnostics';
import { warningDiag } from './diagnostics';

export interface ConvertContext {
  instanceId?: InstanceId;
  entityName?: string;
  attributeName?: string;
}

export interface ConvertResult {
  value: AttributeValue | null;
  diagnostics: ReaderDiagnostic[];
}

export function convertParameter(
  param: ParameterNode,
  typeDescriptor: TypeDescriptor | undefined,
  schema: ExpressSchema,
  context?: ConvertContext,
): ConvertResult {
  const diagnostics: ReaderDiagnostic[] = [];

  switch (param.type) {
    case 'OmittedParameter':
      return { value: INDETERMINATE, diagnostics };

    case 'NullParameter':
      return { value: null, diagnostics };

    case 'IntegerValue':
      return { value: param.value, diagnostics };

    case 'RealValue':
      return { value: param.value, diagnostics };

    case 'StringValue': {
      const raw = param.value;
      const inner = raw.startsWith("'") ? raw.slice(1, -1) : raw;
      const decoded = inner.replace(/''/g, "'");
      return { value: decoded, diagnostics };
    }

    case 'EnumerationValue': {
      const raw = param.value;
      const stripped = raw.startsWith('.') ? raw.slice(1, -1) : raw;
      if (typeDescriptor) {
        const resolved = resolveToBaseType(typeDescriptor);
        if (resolved.kind === 'simple') {
          // P21 .T./.F. for BOOLEAN/LOGICAL
          if (
            resolved.simpleType === 'BOOLEAN' ||
            resolved.simpleType === 'LOGICAL'
          ) {
            const upper = stripped.toUpperCase();
            if (upper === 'T' || upper === 'TRUE') {
              return { value: true, diagnostics };
            }
            if (upper === 'F' || upper === 'FALSE') {
              return { value: false, diagnostics };
            }
            if (upper === 'U' || upper === 'UNKNOWN') {
              return { value: null, diagnostics };
            }
          }
        }
        if (resolved.kind === 'enumeration') {
          const upper = stripped.toUpperCase();
          if (!resolved.values.some((v) => v.toUpperCase() === upper)) {
            diagnostics.push(
              warningDiag(
                'PARAMETER_TYPE_MISMATCH',
                `Enumeration value '${stripped}' not in type values: [${resolved.values.join(', ')}]`,
                context,
              ),
            );
          }
        }
      }
      return { value: stripped, diagnostics };
    }

    case 'BinaryValue': {
      const raw = param.value;
      const inner = raw.startsWith('"') ? raw.slice(1, -1) : raw;
      // First character is unused-bits count (0–3), rest is hex data
      const hex = inner.length > 1 ? inner.slice(1) : '';
      const len = Math.ceil(hex.length / 2);
      const bytes = new Uint8Array(len);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(
          hex.substring(i, Math.min(i + 2, hex.length)),
          16,
        );
      }
      return { value: bytes, diagnostics };
    }

    case 'EntityRef': {
      // Placeholder ref: entityName will be resolved in phase 2 by resolve-refs
      const ref = createRef(asInstanceId(param.id), '');
      return { value: ref, diagnostics };
    }

    case 'ValueRef': {
      diagnostics.push(
        warningDiag(
          'DANGLING_VALUE_REF',
          `Value reference @${param.id} is not supported; treating as INDETERMINATE`,
          context,
        ),
      );
      return { value: INDETERMINATE, diagnostics };
    }

    case 'ConstantEntityRef': {
      const constant = schema.constants.get(param.name.toUpperCase());
      if (!constant) {
        diagnostics.push(
          warningDiag(
            'UNKNOWN_CONSTANT',
            `Constant entity '#${param.name}' not found in schema`,
            context,
          ),
        );
        return { value: INDETERMINATE, diagnostics };
      }
      // Cannot evaluate constant expressions at read time; use INDETERMINATE
      return { value: INDETERMINATE, diagnostics };
    }

    case 'ConstantValueRef': {
      const constant = schema.constants.get(param.name.toUpperCase());
      if (!constant) {
        diagnostics.push(
          warningDiag(
            'UNKNOWN_CONSTANT',
            `Constant value '@${param.name}' not found in schema`,
            context,
          ),
        );
        return { value: INDETERMINATE, diagnostics };
      }
      return { value: INDETERMINATE, diagnostics };
    }

    case 'List':
      return convertList(param, typeDescriptor, schema, context, diagnostics);

    case 'TypedParameter':
      return convertTypedParameter(
        param.keyword,
        param.parameter,
        typeDescriptor,
        schema,
        context,
        diagnostics,
      );
  }
}

function convertList(
  list: ListNode,
  typeDescriptor: TypeDescriptor | undefined,
  schema: ExpressSchema,
  context: ConvertContext | undefined,
  diagnostics: ReaderDiagnostic[],
): ConvertResult {
  const resolved = typeDescriptor
    ? resolveToBaseType(typeDescriptor)
    : undefined;

  let elementType: TypeDescriptor | undefined;
  let aggKind: 'LIST' | 'SET' | 'BAG' | 'ARRAY' = 'LIST';
  let aggDescriptor: AggregationTypeDescriptor | undefined;

  if (resolved?.kind === 'aggregation') {
    aggDescriptor = resolved;
    elementType = resolved.elementType;
    aggKind = resolved.aggregationKind;
  }

  const elements: AttributeValue[] = [];
  for (const item of list.items) {
    const result = convertParameter(item, elementType, schema, context);
    diagnostics.push(...result.diagnostics);
    if (result.value !== null) {
      elements.push(result.value);
    } else {
      // null items in aggregations are preserved as-is
      elements.push(null as unknown as AttributeValue);
    }
  }

  switch (aggKind) {
    case 'SET':
      return { value: createSet(elements), diagnostics: [] };
    case 'BAG':
      return { value: createBag(elements), diagnostics: [] };
    case 'ARRAY': {
      const lower = aggDescriptor?.bounds
        ? (extractBoundValue(aggDescriptor.bounds.lower) ?? 1)
        : 1;
      return {
        value: {
          kind: 'array' as const,
          lowerIndex: lower,
          elements,
        },
        diagnostics: [],
      };
    }
    case 'LIST':
    default:
      return { value: createList(elements), diagnostics: [] };
  }
}

function convertTypedParameter(
  keyword: string,
  innerParam: ParameterNode,
  typeDescriptor: TypeDescriptor | undefined,
  schema: ExpressSchema,
  context: ConvertContext | undefined,
  diagnostics: ReaderDiagnostic[],
): ConvertResult {
  const keyUpper = keyword.toUpperCase();

  if (typeDescriptor) {
    const resolved = resolveToBaseType(typeDescriptor);

    // SELECT type disambiguation: keyword is a select option name
    if (resolved.kind === 'select') {
      const option = resolved.selections.find(
        (s) => s.name.toUpperCase() === keyUpper,
      );
      if (option) {
        let optionType: TypeDescriptor | undefined;
        const entityDef = getEntity(schema, keyUpper);
        if (entityDef) {
          optionType = { kind: 'entity', entity: entityDef };
        } else {
          const typeDef = getType(schema, keyUpper);
          if (typeDef) {
            optionType = typeDef.underlyingType;
          }
        }

        const innerResult = convertParameter(
          innerParam,
          optionType,
          schema,
          context,
        );
        diagnostics.push(...innerResult.diagnostics);

        if (innerResult.value !== null) {
          // Build typePath: [selectTypeName, optionName]
          const selectTypeName =
            typeDescriptor.kind === 'defined'
              ? (typeDescriptor.definition as TypeDefinition).name.toUpperCase()
              : keyUpper;
          const selectValue = createSelectValue(
            [selectTypeName, keyUpper],
            innerResult.value,
          );
          return { value: selectValue, diagnostics: [] };
        }
        return { value: null, diagnostics: [] };
      }
    }
  }

  // Not a SELECT disambiguation: treat keyword as a defined type wrapper.
  // Resolve the keyword as a TYPE name and convert the inner parameter.
  const typeDef = getType(schema, keyUpper);
  const innerType = typeDef ? typeDef.underlyingType : typeDescriptor;
  const innerResult = convertParameter(innerParam, innerType, schema, context);
  diagnostics.push(...innerResult.diagnostics);
  return { value: innerResult.value, diagnostics: [] };
}
