import fastify from 'fastify';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { initial_routes } from './controllers/initial_routes';
import { daoHandlers } from './controllers/dao.controller';
import { knexInstance, PORT } from './config';
import { KnexUserRepository, KnexPreferenceRepository } from './repositories/knex.repository';

// Create repository instances
export const userRepository = new KnexUserRepository(knexInstance);
export const preferenceRepository = new KnexPreferenceRepository(knexInstance);

const app = fastify();
// Configure zod to be the input validator
app.setValidatorCompiler(validatorCompiler);
// Configure zod to be the output serializer
app.setSerializerCompiler(serializerCompiler);
app.register(fastifyCors, {
  origin: '*',
});
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Notification System API',
      description: 'API for managing DAO notifications',
      version: '1.0.0',
    }
  },
  transform: jsonSchemaTransform
});
app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});
app.register(initial_routes);
app.register(daoHandlers);
app.listen({ port: PORT }, () => {
  console.log(`HTTP server running on port ${PORT}!`);
});