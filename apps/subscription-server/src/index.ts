// Import configuration
import fastify from 'fastify';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { initial_routes } from './controllers/initial_routes';
import { DaoController } from './controllers/dao.controller';
import { knexInstance, PORT } from './config';
import { KnexUserRepository, KnexPreferenceRepository } from './repositories/knex.repository';
import { SubscriptionService } from './services/subscription.service';
import { DaoHandler } from './handlers/dao.handlers';
const app = fastify();
const userRepository = new KnexUserRepository(knexInstance);
const preferenceRepository = new KnexPreferenceRepository(knexInstance);
const subscriptionService = new SubscriptionService(userRepository, preferenceRepository);
const daoHandler = new DaoHandler(subscriptionService);
const daoController = new DaoController(daoHandler);
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(fastifyCors, {
  origin: '*',
});
// Global error handler middleware
app.setErrorHandler((error, request, reply) => {
  console.error(`Error occurred: ${error.message}`);
  return reply.code(error.statusCode || 500).send({
    message: error.message || 'Internal server error',
    error: error.stack || 'Unknown error'
  });
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
app.register((app) => daoController.register(app));
app.listen({ port: PORT }, () => {
  console.log(`HTTP server running on port ${PORT}!`);
});