/**
 * Returns the direct AST children of a node. Used by visit() and walk().
 * Nodes without children (literals, SelfRef, SkipStatement, etc.) return an empty array.
 */
import type { ASTNodeBase } from './base';
import type {
  ConstantDeclarationNode,
  ConstantValueDeclarationNode,
  DerivedAttributeNode,
  EntityDeclarationNode,
  ExplicitAttributeNode,
  FunctionDeclarationNode,
  InverseAttributeNode,
  LocalVariableNode,
  ParameterNode,
  ProcedureDeclarationNode,
  ReferenceClauseNode,
  RuleDeclarationNode,
  SchemaDeclarationNode,
  SubtypeConstraintDeclarationNode,
  SupertypeConstraintNode,
  SupertypeExpressionNode,
  TypeDeclarationNode,
  UseClauseNode,
  WhereRuleNode,
} from './declarations';
import type {
  AggregateElementNode,
  AggregateInitializerNode,
  BinaryExpressionNode,
  EntityConstructorNode,
  FunctionCallExpressionNode,
  IndexRefNode,
  IntervalExpressionNode,
  QualifiedRefNode,
  QueryExpressionNode,
  UnaryExpressionNode,
} from './expressions';
import type {
  AliasStatementNode,
  AssignmentStatementNode,
  CaseActionNode,
  CaseStatementNode,
  CompoundStatementNode,
  IfStatementNode,
  ProcedureCallStatementNode,
  RepeatControlNode,
  RepeatStatementNode,
  ReturnStatementNode,
} from './statements';
import type { AggregateTypeNode, AggregationTypeNode } from './types';

const EMPTY: readonly ASTNodeBase[] = [];

export function getChildren(node: ASTNodeBase): readonly ASTNodeBase[] {
  switch (node.type) {
    case 'SchemaDeclaration': {
      const n = node as SchemaDeclarationNode;
      return [...n.interfaces, ...n.declarations];
    }
    case 'EntityDeclaration': {
      const n = node as EntityDeclarationNode;
      const out: ASTNodeBase[] = [];
      if (n.supertypeConstraint) out.push(n.supertypeConstraint);
      if (n.subtypeOf) out.push(n.subtypeOf);
      out.push(...n.attributes);
      if (n.derivedAttributes) out.push(...n.derivedAttributes);
      if (n.inverseAttributes) out.push(...n.inverseAttributes);
      if (n.uniqueRules) out.push(...n.uniqueRules);
      if (n.whereRules) out.push(...n.whereRules);
      return out;
    }
    case 'UseClause':
      return (node as UseClauseNode).items ?? EMPTY;
    case 'ReferenceClause':
      return (node as ReferenceClauseNode).items ?? EMPTY;
    case 'SupertypeConstraint': {
      const expr = (node as SupertypeConstraintNode).expression;
      return expr ? [expr] : EMPTY;
    }
    case 'ExplicitAttribute':
      return [(node as ExplicitAttributeNode).attributeType];
    case 'DerivedAttribute': {
      const n = node as DerivedAttributeNode;
      return n.redeclaredAttr
        ? [n.redeclaredAttr, n.attributeType, n.expression]
        : [n.attributeType, n.expression];
    }
    case 'InverseAttribute':
      return [(node as InverseAttributeNode).attributeType];
    case 'WhereRule':
      return [(node as WhereRuleNode).expression];
    case 'TypeDeclaration': {
      const n = node as TypeDeclarationNode;
      return n.whereRules
        ? [n.underlyingType, ...n.whereRules]
        : [n.underlyingType];
    }
    case 'FunctionDeclaration': {
      const n = node as FunctionDeclarationNode;
      const out: ASTNodeBase[] = [...n.parameters, n.returnType];
      if (n.declarations) out.push(...n.declarations);
      out.push(...n.body);
      return out;
    }
    case 'ProcedureDeclaration': {
      const n = node as ProcedureDeclarationNode;
      const out: ASTNodeBase[] = [...n.parameters];
      if (n.declarations) out.push(...n.declarations);
      out.push(...n.body);
      return out;
    }
    case 'Parameter':
      return [(node as ParameterNode).parameterType];
    case 'RuleDeclaration': {
      const n = node as RuleDeclarationNode;
      const out: ASTNodeBase[] = [];
      if (n.declarations) out.push(...n.declarations);
      out.push(...n.body);
      if (n.whereRules) out.push(...n.whereRules);
      return out;
    }
    case 'SubtypeConstraintDeclaration': {
      const n = node as SubtypeConstraintDeclarationNode;
      return n.supertypeExpression ? [n.supertypeExpression] : EMPTY;
    }
    case 'ConstantDeclaration':
      return [...(node as ConstantDeclarationNode).constants];
    case 'ConstantValueDeclaration': {
      const n = node as ConstantValueDeclarationNode;
      return [n.constantType, n.expression];
    }
    case 'LocalVariable': {
      const n = node as LocalVariableNode;
      return n.initialValue
        ? [n.variableType, n.initialValue]
        : [n.variableType];
    }
    case 'SupertypeExpression':
      return [(node as SupertypeExpressionNode).expression];
    case 'AggregationType': {
      const n = node as AggregationTypeNode;
      const out: ASTNodeBase[] = [n.baseType];
      if (n.bounds?.lower) out.push(n.bounds.lower);
      if (n.bounds?.upper) out.push(n.bounds.upper);
      return out;
    }
    case 'AggregateType':
      return [(node as AggregateTypeNode).baseType];
    case 'BinaryExpression': {
      const n = node as BinaryExpressionNode;
      return [n.left, n.right];
    }
    case 'UnaryExpression':
      return [(node as UnaryExpressionNode).operand];
    case 'QualifiedRef': {
      const n = node as QualifiedRefNode;
      return [n.root, ...n.qualifiers];
    }
    case 'IndexRef': {
      const n = node as IndexRefNode;
      return n.upperIndex ? [n.index, n.upperIndex] : [n.index];
    }
    case 'FunctionCallExpression':
      return [...(node as FunctionCallExpressionNode).args];
    case 'QueryExpression': {
      const n = node as QueryExpressionNode;
      return [n.source, n.condition];
    }
    case 'AggregateInitializer':
      return [...(node as AggregateInitializerNode).elements];
    case 'AggregateElement': {
      const n = node as AggregateElementNode;
      return n.repetition ? [n.value, n.repetition] : [n.value];
    }
    case 'EntityConstructor':
      return [...(node as EntityConstructorNode).args];
    case 'IntervalExpression': {
      const n = node as IntervalExpressionNode;
      return [n.low, n.value, n.high];
    }
    case 'AssignmentStatement': {
      const n = node as AssignmentStatementNode;
      return [n.target, n.value];
    }
    case 'ProcedureCallStatement':
      return [...(node as ProcedureCallStatementNode).args];
    case 'IfStatement': {
      const n = node as IfStatementNode;
      const out: ASTNodeBase[] = [n.condition, ...n.thenBranch];
      if (n.elseBranch) out.push(...n.elseBranch);
      return out;
    }
    case 'CaseStatement': {
      const n = node as CaseStatementNode;
      const out: ASTNodeBase[] = [n.selector, ...n.actions];
      if (n.otherwise) out.push(...n.otherwise);
      return out;
    }
    case 'CaseAction': {
      const n = node as CaseActionNode;
      return [...n.selectors, ...n.statements];
    }
    case 'RepeatStatement': {
      const n = node as RepeatStatementNode;
      const out: ASTNodeBase[] = [];
      if (n.control) out.push(n.control);
      out.push(...n.statements);
      return out;
    }
    case 'RepeatControl': {
      const n = node as RepeatControlNode;
      const out: ASTNodeBase[] = [];
      if (n.condition) out.push(n.condition);
      if (n.initial) out.push(n.initial);
      if (n.increment) out.push(n.increment);
      if (n.final) out.push(n.final);
      return out;
    }
    case 'AliasStatement': {
      const n = node as AliasStatementNode;
      return [n.base, ...n.statements];
    }
    case 'ReturnStatement': {
      const n = node as ReturnStatementNode;
      return n.value ? [n.value] : EMPTY;
    }
    case 'CompoundStatement':
      return [...(node as CompoundStatementNode).statements];
    default:
      return EMPTY;
  }
}
