import fastify from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { HealthController, MessageController } from './controllers';
import { config } from './envConfig';
import { SubscriptionClient } from './services/subscription-client.service';
import { NotificationClientFactory } from './services/notification/notification-factory.service';
import { TelegramNotificationClient } from './services/notification/telegram-notification.service';
import { TriggerProcessorService } from './services/trigger-processor.service';

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

// Configure services
const subscriptionClient = new SubscriptionClient(config.subscriptionServerUrl);
const notificationFactory = new NotificationClientFactory();
notificationFactory.addClient('telegram', new TelegramNotificationClient(config.telegramConsumerUrl));
const triggerProcessorService = new TriggerProcessorService(subscriptionClient, notificationFactory);
const healthController = new HealthController();
const messageController = new MessageController(triggerProcessorService);

// Register routes
server.register(async (instance) => {
  await healthController.healthRoutes(instance);
});
server.register(async (instance) => {
  await messageController.messageRoutes(instance);
});

server.listen({ port: config.port, host: '0.0.0.0' });
console.log(`Server is running on port ${config.port}`);