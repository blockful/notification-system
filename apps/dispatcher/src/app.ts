import fastify, { FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { HealthController, MessageController } from './controllers';
import { TriggerProcessorService } from './services/trigger-processor.service';
import { SubscriptionClient } from './services/subscription-client.service';
import { NotificationClientFactory } from './services/notification/notification-factory.service';
import { TelegramNotificationClient } from './services/notification/telegram-notification.service';
import { NewProposalTriggerHandler } from './services/triggers/new-proposal-trigger.service';

export class App {
  private server: FastifyInstance;
  private port: number;

  constructor(port: number, subscriptionServerUrl: string, telegramConsumerUrl: string) {
    this.port = port;
    this.server = fastify({
      logger: true
    });

    this.setupFastify();
    this.setupServices(subscriptionServerUrl, telegramConsumerUrl);
  }

  private setupFastify(): void {
    // Configure zod to be the input validator
    this.server.setValidatorCompiler(validatorCompiler);
    // Configure zod to be the output serializer
    this.server.setSerializerCompiler(serializerCompiler);
    
    this.server.register(fastifyCors, {
      origin: '*',
    });
    
    this.server.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Dispatcher API',
          description: 'API for the dispatcher service',
          version: '0.1.0'
        }
      }
    });
    
    this.server.register(fastifySwaggerUi, {
      routePrefix: '/docs'
    });

    this.server.setErrorHandler((error, request, reply) => {
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
  }

  private setupServices(subscriptionServerUrl: string, telegramConsumerUrl: string): void {
    // Configure services
    const subscriptionClient = new SubscriptionClient(subscriptionServerUrl);
    const notificationFactory = new NotificationClientFactory();
    notificationFactory.addClient('telegram', new TelegramNotificationClient(telegramConsumerUrl));
    const triggerProcessorService = new TriggerProcessorService();

    // Register trigger handlers
    triggerProcessorService.addHandler(
      'new-proposal',
      new NewProposalTriggerHandler(subscriptionClient, notificationFactory)
    );

    const healthController = new HealthController(this.environment);
    const messageController = new MessageController(triggerProcessorService);

    this.setupRoutes(healthController, messageController);
  }

  private setupRoutes(healthController: HealthController, messageController: MessageController): void {
    this.server.register(async (instance) => {
      await healthController.healthRoutes(instance);
    });
    
    this.server.register(async (instance) => {
      await messageController.messageRoutes(instance);
    });
  }

  async start(): Promise<void> {
    await this.server.listen({ port: this.port, host: '0.0.0.0' });
    console.log(`Dispatcher server running on port ${this.port}!`);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
} 