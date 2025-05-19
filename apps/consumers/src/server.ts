/**
 * API Server configuration
 * Sets up the Fastify server with plugins and security configurations
 */

import Fastify from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config/env';
import { FastifyTypedInstance } from './interfaces/fastify.interface';
import { NotificationService } from './services/notification.service';
import { APIController } from './controllers/api.controller';

export async function startServer(notificationService: NotificationService): Promise<FastifyTypedInstance> {
  const server = Fastify({
    logger: true
  }) as FastifyTypedInstance;
  // Configure Zod as validator and serializer
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);
  await server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST']
  });
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Telegram Notification API',
        description: 'API for sending notifications through Telegram',
        version: '1.0.0'
      }
    }
  });
  await server.register(swaggerUi, {
    routePrefix: '/docs'
  });
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred'
    });
  });
  
  // Setup API controllers
  new APIController(server, notificationService);
  
  return server;
}

export async function startListening(server: FastifyTypedInstance): Promise<void> {
  await server.listen({ port: config.port });
  console.log(`🚀 API server running on http://localhost:${config.port}`);
  console.log(`📚 API documentation available at http://localhost:${config.port}/docs`);
} 