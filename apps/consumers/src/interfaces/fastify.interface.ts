/**
 * FastifyTypedInstance interface provides proper typing for Fastify with Zod integration.
 */

import type { 
  FastifyBaseLogger, 
  FastifyInstance, 
  RawReplyDefaultExpression, 
  RawRequestDefaultExpression, 
  RawServerDefault 
} from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export type FastifyTypedInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>; 