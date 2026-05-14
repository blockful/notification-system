import fastify, { type FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function startServer(port: number): Promise<FastifyInstance> {
  const server = fastify();
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  server.withTypeProvider<ZodTypeProvider>().get('/health', {
    schema: {
      tags: ['health'],
      response: { 200: z.object({ status: z.string(), timestamp: z.string() }) },
    },
  }, () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await server.listen({ port, host: '0.0.0.0' });

  return server;
}
