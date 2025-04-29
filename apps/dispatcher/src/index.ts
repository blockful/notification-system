import fastify from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { initial_routes } from './controllers/initial_routes';
const app = fastify();

// Configure zod to be the input validator
app.setValidatorCompiler(validatorCompiler);
// Configure zod to be the outout serializer
app.setSerializerCompiler(serializerCompiler);
app.register(fastifyCors, {
  origin: '*',
});
app.register(fastifySwagger, {
    openapi: {
    info: {
      title: 'Notification System API',
      version: '1.0.0',
    }
  }
});
app.register(fastifySwaggerUi, {
  routePrefix: '/documentation',
});
app.register(initial_routes);
app.listen({ port: 3000 }, () => {
  console.log('HTTP server running!');
});