#!/usr/bin/env node

import fastify from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { HealthController, MessageController } from './controllers';
import { TriggerProcessorService } from './services/trigger-processor.service';
import { config } from './envConfig';
import { SubscriptionClient } from './services/subscription-client.service';
import { NotificationClientFactory } from './services/notification/notification-factory.service';
import { TelegramNotificationClient } from './services/notification/telegram-notification.service';
import { NewProposalTriggerHandler } from './services/triggers/new-proposal-trigger.service';

const server = fastify({
  logger: true
});

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

server.setErrorHandler((error, request, reply) => {
  console.error('Error occurred:', error);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  reply.status(error.statusCode || 500).send({
    statusCode: error.statusCode || 500,
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred'
  });
});

// Configure services
const subscriptionClient = new SubscriptionClient(config.subscriptionServerUrl);
const notificationFactory = new NotificationClientFactory();
notificationFactory.addClient('telegram', new TelegramNotificationClient(config.telegramConsumerUrl));
const triggerProcessorService = new TriggerProcessorService();

// Register trigger handlers
triggerProcessorService.addHandler(
  'new-proposal',
  new NewProposalTriggerHandler(subscriptionClient, notificationFactory)
);

const healthController = new HealthController();
const messageController = new MessageController(triggerProcessorService);

server.register(async (instance) => {
  await healthController.healthRoutes(instance);
});
server.register(async (instance) => {
  await messageController.messageRoutes(instance);
});

const start = async () => {
  try {
    await server.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server is running on port ${config.port}`);
    console.log(`Subscription server URL: ${config.subscriptionServerUrl}`);
    console.log(`Telegram consumer URL: ${config.telegramConsumerUrl}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();