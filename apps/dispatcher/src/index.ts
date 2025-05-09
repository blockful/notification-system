import fastify from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { config } from 'dotenv';
import { healthRoutes } from './controllers';

// Load environment variables
config();

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

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
