import type {
  EntityDefinition,
  ExplicitAttribute,
} from '@step-nc/express-dictionary';
import type { AttributeValue, InstanceId } from './values';

export interface EntityInstance {
  readonly id: InstanceId;
  readonly definition: EntityDefinition;
  readonly typeName: string;
  readonly attributes: Map<string, AttributeValue | undefined>;
  readonly attributeDefinitions: Map<string, ExplicitAttribute>;
}
