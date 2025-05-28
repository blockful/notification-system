import fastify, { FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { Knex } from 'knex';
import { initial_routes } from './controllers/initial_routes';
import { DaoController } from './controllers/dao.controller';
import { KnexUserRepository, KnexPreferenceRepository } from './repositories/knex.repository';
import { SubscriptionService } from './services/subscription.service';
import { DaoHandler } from './handlers/dao.handlers';

export class App {
  private server: FastifyInstance;
  private port: number;

  constructor(db: Knex, port: number) {
    this.port = port;
    this.server = fastify();
    
    const userRepository = new KnexUserRepository(db);
    const preferenceRepository = new KnexPreferenceRepository(db);
    const subscriptionService = new SubscriptionService(userRepository, preferenceRepository);
    const daoHandler = new DaoHandler(subscriptionService);
    const daoController = new DaoController(daoHandler);

    this.setupFastify();
    this.setupRoutes(daoController);
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

  private setupRoutes(daoController: DaoController): void {
    this.server.register(initial_routes);
    this.server.register((app) => daoController.register(app));
  }

  async start(): Promise<void> {
    await this.server.listen({ port: this.port });
    console.log(`HTTP server running on port ${this.port}!`);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
} 