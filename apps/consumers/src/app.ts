import { Telegraf } from 'telegraf';
import { session } from 'telegraf/session';
import Fastify from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { AxiosInstance } from 'axios';
import { BotController } from './controllers/bot.controller';
import { DAOService } from './services/dao.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { SubscriptionAPIService } from './services/subscription-api.service';
import { NotificationService } from './services/notification.service';
import { APIController } from './controllers/api.controller';
import { FastifyTypedInstance } from './interfaces/fastify.interface';
import { ContextWithSession } from './interfaces/bot.interface';
import { RabbitMQNotificationConsumerService } from './services/rabbitmq-notification-consumer.service';

export class App {
  private notificationService: NotificationService;
  private botController: BotController;
  private server?: FastifyTypedInstance;
  private port: number;
  private rabbitmqConsumerService: RabbitMQNotificationConsumerService;
  private rabbitmqUrl: string;

  constructor(
    telegramBotToken: string, 
    subscriptionServerUrl: string, 
    port: number,
    httpClient: AxiosInstance,
    rabbitmqUrl: string
  ) {
    this.port = port;
    const subscriptionApi = new SubscriptionAPIService(subscriptionServerUrl);
    const anticaptureClient = new AnticaptureClient(httpClient);
    const daoService = new DAOService(anticaptureClient, subscriptionApi);
    const bot = new Telegraf<ContextWithSession>(telegramBotToken);
    bot.use(session());
    this.notificationService = new NotificationService(bot);
    this.botController = new BotController(bot, daoService);
    this.rabbitmqUrl = rabbitmqUrl;
    this.rabbitmqConsumerService = new RabbitMQNotificationConsumerService(
      this.rabbitmqUrl, 
      this.notificationService
    );
  }

  private async setupServer(): Promise<FastifyTypedInstance> {
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
    new APIController(server, this.notificationService);
    
    return server;
  }

  async start(): Promise<void> {
    this.server = await this.setupServer();
    await this.server.listen({ port: this.port, host: '0.0.0.0' });
    console.log(`API server running on http://localhost:${this.port}`);
    console.log(`API documentation available at http://localhost:${this.port}/docs`);
    
    await this.rabbitmqConsumerService.start();
    this.botController.launch();
    console.log('Telegram bot and API server are now running!');
  }

  async stop(): Promise<void> {
    if (!this.server) {
      console.log('Server is not running');
      return;
    }
    await this.rabbitmqConsumerService.stop();
    await this.server.close();
    this.botController.stop('SIGINT');
  }
} 