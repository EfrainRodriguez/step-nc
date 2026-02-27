import type { Span } from './base';

export type ParameterNode =
  | TypedParameterNode
  | IntegerValueNode
  | RealValueNode
  | StringValueNode
  | EnumerationValueNode
  | BinaryValueNode
  | EntityRefNode
  | ValueRefNode
  | ConstantEntityRefNode
  | ConstantValueRefNode
  | OmittedParameterNode
  | NullParameterNode
  | ListNode;

export interface TypedParameterNode {
  readonly type: 'TypedParameter';
  readonly keyword: string;
  readonly parameter: ParameterNode;
  readonly span: Span;
}

export interface IntegerValueNode {
  readonly type: 'IntegerValue';
  readonly value: number;
  readonly span: Span;
}

export interface RealValueNode {
  readonly type: 'RealValue';
  readonly value: number;
  readonly span: Span;
}

export interface StringValueNode {
  readonly type: 'StringValue';
  readonly value: string;
  readonly span: Span;
}

export interface EnumerationValueNode {
  readonly type: 'EnumerationValue';
  readonly value: string;
  readonly span: Span;
}

export interface BinaryValueNode {
  readonly type: 'BinaryValue';
  readonly value: string;
  readonly span: Span;
}

export interface EntityRefNode {
  readonly type: 'EntityRef';
  readonly id: number;
  readonly span: Span;
}

export interface ValueRefNode {
  readonly type: 'ValueRef';
  readonly id: number;
  readonly span: Span;
}

export interface ConstantEntityRefNode {
  readonly type: 'ConstantEntityRef';
  readonly name: string;
  readonly span: Span;
}

export interface ConstantValueRefNode {
  readonly type: 'ConstantValueRef';
  readonly name: string;
  readonly span: Span;
}

export interface OmittedParameterNode {
  readonly type: 'OmittedParameter';
  readonly span: Span;
}

export interface NullParameterNode {
  readonly type: 'NullParameter';
  readonly span: Span;
}

export interface ListNode {
  readonly type: 'List';
  readonly items: ParameterNode[];
  readonly span: Span;
}
