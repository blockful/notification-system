import fastify from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { HealthController, MessageController } from './controllers';
import { config } from './envConfig';

const server = fastify();

// Configure zod to be the input validator
server.setValidatorCompiler(validatorCompiler);
// Configure zod to be the output serializer
server.setSerializerCompiler(serializerCompiler);
server.register(fastifyCors, {
  origin: '*',
});
server.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Dispatcher API',
      description: 'API for the dispatcher service',
      version: '0.1.0'
    }
  }
});
server.register(fastifySwaggerUi, {
  routePrefix: '/docs'
});
const healthController = new HealthController();
const messageController = new MessageController();
server.register(async (instance) => {
  await healthController.healthRoutes(instance);
});
server.register(async (instance) => {
  await messageController.messageRoutes(instance);
});

server.listen({ port: config.port, host: '0.0.0.0' });
console.log(`Server is running on port ${config.port}`);