import fastify, { FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { Knex } from 'knex';
import { initial_routes } from './controllers/initial_routes';
import { DaoController, NotificationController } from './controllers';
import { KnexUserRepository, KnexPreferenceRepository, KnexNotificationRepository } from './repositories/knex.repository';
import { SubscriptionService, NotificationService } from './services';
import { DaoHandler } from './handlers/dao.handlers';

export interface SubscriptionServerAppConfig {
  db: Knex;
  port: number;
}

export class App {
  private server: FastifyInstance;
  private port: number;

  private constructor(server: FastifyInstance, port: number) {
    this.server = server;
    this.port = port;
  }

  static create(config: SubscriptionServerAppConfig): App {
    const server = fastify();
    
    // Repository instances
    const userRepository = new KnexUserRepository(config.db);
    const preferenceRepository = new KnexPreferenceRepository(config.db);
    const notificationRepository = new KnexNotificationRepository(config.db);
    
    // Service instances
    const subscriptionService = new SubscriptionService(userRepository, preferenceRepository);
    const notificationService = new NotificationService(notificationRepository);
    
    // Handler instances
    const daoHandler = new DaoHandler(subscriptionService);
    
    // Controller instances
    const daoController = new DaoController(daoHandler);
    const notificationController = new NotificationController(notificationService);

    const app = new App(server, config.port);
    app.setupFastify();
    app.setupRoutes(daoController, notificationController);
    
    return app;
  }

  private setupFastify(): void {
    this.server.setValidatorCompiler(validatorCompiler);
    this.server.setSerializerCompiler(serializerCompiler);
    
    this.server.register(fastifyCors, {
      origin: '*',
    });

    this.server.setErrorHandler((error, request, reply) => {
      console.error(`Error occurred: ${error.message}`);
      return reply.code(error.statusCode || 500).send({
        message: error.message || 'Internal server error',
        error: error.stack || 'Unknown error'
      });
    });

    this.server.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Notification System API',
          description: 'API for managing DAO notifications',
          version: '1.0.0',
        }
      },
      transform: jsonSchemaTransform
    });

    this.server.register(fastifySwaggerUi, {
      routePrefix: '/docs',
    });
  }

  private setupRoutes(daoController: DaoController, notificationController: NotificationController): void {
    this.server.register(initial_routes);
    this.server.register((app) => daoController.register(app));
    this.server.register((app) => notificationController.register(app));
  }

  async start(): Promise<void> {
    await this.server.listen({ port: this.port, host: '0.0.0.0' });
    console.log(`HTTP server running on port ${this.port}!`);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
} 