import type { Span } from './base';
import type { ParameterNode } from './parameter';

export interface DataSectionNode {
  readonly type: 'DataSection';
  readonly name?: string;
  readonly parameters?: ParameterNode[];
  readonly entities: EntityInstanceNode[];
  readonly span: Span;
}

export type EntityInstanceNode =
  | SimpleEntityInstanceNode
  | ComplexEntityInstanceNode;

export interface SimpleEntityInstanceNode {
  readonly type: 'SimpleEntityInstance';
  readonly id: number;
  readonly record: SimpleRecordNode;
  readonly span: Span;
}

export interface ComplexEntityInstanceNode {
  readonly type: 'ComplexEntityInstance';
  readonly id: number;
  readonly records: SimpleRecordNode[];
  readonly span: Span;
}

export interface SimpleRecordNode {
  readonly type: 'SimpleRecord';
  readonly keyword: string;
  readonly parameters: ParameterNode[];
  readonly span: Span;
}
