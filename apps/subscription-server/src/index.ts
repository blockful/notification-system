// Carregar variáveis de ambiente do arquivo .env
import * as dotenv from 'dotenv';
import fastify from 'fastify';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { initial_routes } from './controllers/initial_routes';
import { daoHandlers } from './controllers/dao.controller';
import Knex from 'knex';
dotenv.config();
export const knexInstance = Knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/'
});
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
app.listen({ port: 3000 }, () => {
  console.log('HTTP server running!');
});