import type { SchemaRegistry } from '@step-nc/express-dictionary';

export interface StepModelOptions {
  readonly initialId?: number;
  readonly registry?: SchemaRegistry;
}
