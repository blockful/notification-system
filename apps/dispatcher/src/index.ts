import fastify from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { healthRoutes, messageRoutes } from './controllers';
import { config } from './envConfig';

const server = fastify();

// Configure zod to be the input validator
server.setValidatorCompiler(validatorCompiler);
// Configure zod to be the output serializer
server.setSerializerCompiler(serializerCompiler);

// Register plugins
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

// Register routes
server.register(healthRoutes);
server.register(messageRoutes);

const start = async () => {
  try {
    await server.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server is running on port ${config.port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();
