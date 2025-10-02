import fastify, { FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { Knex } from 'knex';
import { initial_routes } from './controllers/initial_routes';
import { DaoController, NotificationController } from './controllers';
import { UserAddressController } from './controllers/user-address.controller';
import { SlackOAuthController } from './controllers/slack-oauth.controller';

export class App {
  private server: FastifyInstance;
  private port: number;
  private db: Knex;

  constructor(
    db: Knex,
    port: number,
    private daoController: DaoController,
    private notificationController: NotificationController,
    private userAddressController: UserAddressController,
    private slackOAuthController: SlackOAuthController
  ) {
    this.db = db;
    this.port = port;
    this.server = fastify();

    this.setupFastify();
    this.setupRoutes();
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

  private setupRoutes(): void {
    this.server.register(initial_routes);
    this.server.register((app) => this.daoController.register(app));
    this.server.register((app) => this.notificationController.register(app));
    this.server.register((app) => this.userAddressController.register(app));
    this.server.register((app) => this.slackOAuthController.register(app));
  }

  async start(): Promise<void> {
    await this.server.listen({ port: this.port, host: '0.0.0.0' });
    console.log(`HTTP server running on port ${this.port}!`);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
} 