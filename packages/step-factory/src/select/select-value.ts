import type {
  ExpressSchema,
  SelectTypeDescriptor,
} from '@step-nc/express-dictionary';
import { getSelectOptions } from '@step-nc/express-dictionary';
import type { FactoryDiagnostic } from '../diagnostics';
import { errorDiag } from '../diagnostics';
import type { AttributeValue, SelectValue } from '../types/values';

export function createSelectValue(
  typePath: string[],
  value: AttributeValue,
): SelectValue {
  return {
    kind: 'select',
    typePath: typePath.map((t) => t.toUpperCase()),
    value,
  };
}

export function validateSelectValue(
  selectValue: SelectValue,
  descriptor: SelectTypeDescriptor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schema: ExpressSchema,
): FactoryDiagnostic[] {
  const diagnostics: FactoryDiagnostic[] = [];

  if (selectValue.typePath.length < 2) {
    diagnostics.push(
      errorDiag(
        'INVALID_SELECT_PATH',
        `SELECT typePath must have at least 2 elements (select type + concrete type)`,
      ),
    );
    return diagnostics;
  }

  const leafName =
    selectValue.typePath[selectValue.typePath.length - 1]!.toUpperCase();

  const options = getSelectOptions(descriptor);
  const validNames = options.map((o) => o.name.toUpperCase());

  if (!validNames.includes(leafName)) {
    diagnostics.push(
      errorDiag(
        'INVALID_SELECT_PATH',
        `'${leafName}' is not a valid option for SELECT type. Valid options: ${validNames.join(', ')}`,
      ),
    );
  }

  return diagnostics;
}

export function getSelectActualValue(selectValue: SelectValue): AttributeValue {
  return selectValue.value;
}

export function getSelectTypePath(selectValue: SelectValue): readonly string[] {
  return selectValue.typePath;
}
