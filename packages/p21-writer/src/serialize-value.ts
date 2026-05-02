import type {
  AggregationTypeDescriptor,
  ExpressSchema,
  TypeDescriptor,
} from '@step-nc/express-dictionary';
import { resolveToBaseType } from '@step-nc/express-dictionary';
import type { AttributeValue, SelectValue } from '@step-nc/step-factory';
import {
  isIndeterminate,
  isInstanceRef,
  isSelectValue,
  isStepAggregation,
} from '@step-nc/step-factory';
import type { WriterDiagnostic } from './diagnostics';
import { errorDiag } from './diagnostics';

export interface SerializeValueResult {
  text: string;
  diagnostics: WriterDiagnostic[];
}

function serializeString(value: string): string {
  let result = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)!;
    const ch = value[i]!;

    if (ch === '\\') {
      result += '\\\\';
    } else if (ch === "'") {
      result += "''";
    } else if (code > 126 || code < 32) {
      const codePoint = value.codePointAt(i)!;
      if (codePoint > 0xffff) {
        // Supplementary plane — \X4\ encoding
        result +=
          '\\X4\\' +
          codePoint.toString(16).toUpperCase().padStart(8, '0') +
          '\\X0\\';
        i++; // skip surrogate pair
      } else {
        // BMP non-ASCII — \X2\ encoding
        result +=
          '\\X2\\' +
          codePoint.toString(16).toUpperCase().padStart(4, '0') +
          '\\X0\\';
      }
    } else {
      result += ch;
    }
  }
  return "'" + result + "'";
}

function serializeNumber(
  value: number,
  typeDescriptor?: TypeDescriptor,
): SerializeValueResult {
  const diagnostics: WriterDiagnostic[] = [];

  if (Number.isNaN(value)) {
    diagnostics.push(
      errorDiag('UNSUPPORTED_VALUE', `NaN is not a valid P21 numeric value`),
    );
    return { text: '$', diagnostics };
  }
  if (!Number.isFinite(value)) {
    diagnostics.push(
      errorDiag(
        'UNSUPPORTED_VALUE',
        `Infinity is not a valid P21 numeric value`,
      ),
    );
    return { text: '$', diagnostics };
  }

  const isRealHint = typeDescriptor ? isRealType(typeDescriptor) : false;

  if (Number.isInteger(value) && !isRealHint) {
    return { text: String(value), diagnostics };
  }

  // REAL formatting
  let text: string;
  if (Number.isInteger(value)) {
    // Integer value but type is REAL — force decimal point
    text = value + '.';
  } else {
    text = String(value);
    // Ensure at least one digit after decimal point in exponential notation
    if (!text.includes('.') && !text.includes('e') && !text.includes('E')) {
      text += '.';
    }
  }

  // Uppercase E for scientific notation
  text = text.replace('e+', 'E').replace('e-', 'E-').replace('e', 'E');

  return { text, diagnostics };
}

function serializeBoolean(value: boolean): string {
  return value ? '.T.' : '.F.';
}

function serializeBinary(data: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < data.length; i++) {
    hex += data[i]!.toString(16).toUpperCase().padStart(2, '0');
  }
  return '"' + hex + '"';
}

function serializeEnumValue(value: string): string {
  return '.' + value.toUpperCase() + '.';
}

function isRealType(descriptor: TypeDescriptor): boolean {
  const base = resolveToBaseType(descriptor);
  if (base.kind === 'simple') {
    return base.simpleType === 'REAL' || base.simpleType === 'NUMBER';
  }
  return false;
}

function isEnumType(descriptor: TypeDescriptor): boolean {
  const base = resolveToBaseType(descriptor);
  return base.kind === 'enumeration';
}

function serializeSelectValueInner(
  sv: SelectValue,
  typeDescriptor?: TypeDescriptor,
  schema?: ExpressSchema,
): SerializeValueResult {
  const wrapperType = sv.typePath[sv.typePath.length - 1];
  if (!wrapperType) {
    return serializeAttributeValue(
      sv.value as AttributeValue,
      typeDescriptor,
      schema,
    );
  }

  const inner = isSelectValue(sv.value as AttributeValue)
    ? serializeSelectValueInner(sv.value as SelectValue, typeDescriptor, schema)
    : serializeAttributeValue(
        sv.value as AttributeValue,
        typeDescriptor,
        schema,
      );

  return {
    text: wrapperType.toUpperCase() + '(' + inner.text + ')',
    diagnostics: inner.diagnostics,
  };
}

function serializeAggregation(
  value: { readonly elements: readonly unknown[] },
  elementTypeDescriptor?: TypeDescriptor,
  schema?: ExpressSchema,
): SerializeValueResult {
  const diagnostics: WriterDiagnostic[] = [];
  const parts: string[] = [];

  for (const elem of value.elements) {
    const result = serializeAttributeValue(
      elem as AttributeValue,
      elementTypeDescriptor,
      schema,
    );
    parts.push(result.text);
    diagnostics.push(...result.diagnostics);
  }

  return { text: '(' + parts.join(',') + ')', diagnostics };
}

export function serializeAttributeValue(
  value: AttributeValue | undefined,
  typeDescriptor?: TypeDescriptor,
  schema?: ExpressSchema,
): SerializeValueResult {
  // 1. undefined → $
  if (value === undefined) {
    return { text: '$', diagnostics: [] };
  }

  // 2. null → $
  if (value === null) {
    return { text: '$', diagnostics: [] };
  }

  // 3. INDETERMINATE → *
  if (isIndeterminate(value)) {
    return { text: '*', diagnostics: [] };
  }

  // 4. boolean → .T. / .F.
  if (typeof value === 'boolean') {
    return { text: serializeBoolean(value), diagnostics: [] };
  }

  // 5. number → integer or real
  if (typeof value === 'number') {
    return serializeNumber(value, typeDescriptor);
  }

  // 6. string → check if enumeration or plain string
  if (typeof value === 'string') {
    if (typeDescriptor && isEnumType(typeDescriptor)) {
      return { text: serializeEnumValue(value), diagnostics: [] };
    }
    return { text: serializeString(value), diagnostics: [] };
  }

  // 7. Uint8Array → binary hex
  if (value instanceof Uint8Array) {
    return { text: serializeBinary(value), diagnostics: [] };
  }

  // 8. InstanceRef → #id
  if (isInstanceRef(value)) {
    return { text: '#' + String(value.id), diagnostics: [] };
  }

  // 9. SelectValue → TYPE(value)
  if (isSelectValue(value)) {
    return serializeSelectValueInner(value, typeDescriptor, schema);
  }

  // 10. StepAggregation → (elem1,elem2,...)
  if (isStepAggregation(value)) {
    let elementType: TypeDescriptor | undefined;
    if (typeDescriptor) {
      const base = resolveToBaseType(typeDescriptor);
      if (base.kind === 'aggregation') {
        elementType = (base as AggregationTypeDescriptor).elementType;
      }
    }
    return serializeAggregation(value, elementType, schema);
  }

  // 11. fallback
  return {
    text: '$',
    diagnostics: [
      errorDiag(
        'UNSUPPORTED_VALUE',
        `Cannot serialize value of type ${typeof value}`,
      ),
    ],
  };
}
