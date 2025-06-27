import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { ProposalRepository } from './repositories/proposal.repository';
import { RabbitMQDispatcherService } from './api-clients/rabbitmq-dispatcher.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { ProposalStatus } from './interfaces/proposal.interface';
import { AxiosInstance } from 'axios';

export interface LogicSystemAppConfig {
  triggerInterval: number;
  proposalStatus: ProposalStatus;
  anticaptureHttpClient: AxiosInstance;
  rabbitmqUrl: string;
}

export class App {
  private trigger: NewProposalTrigger;
  private proposalStatus: ProposalStatus;
  private rabbitMQConnection: RabbitMQConnection;
  private rabbitMQPublisher: RabbitMQPublisher;

  private constructor(
    trigger: NewProposalTrigger,
    proposalStatus: ProposalStatus,
    rabbitMQConnection: RabbitMQConnection,
    rabbitMQPublisher: RabbitMQPublisher
  ) {
    this.trigger = trigger;
    this.proposalStatus = proposalStatus;
    this.rabbitMQConnection = rabbitMQConnection;
    this.rabbitMQPublisher = rabbitMQPublisher;
  }

  static async create(config: LogicSystemAppConfig): Promise<App> {
    const anticaptureClient = new AnticaptureClient(config.anticaptureHttpClient);
    const proposalDB = new ProposalRepository(anticaptureClient);

    const rabbitMQConnection = new RabbitMQConnection(config.rabbitmqUrl);
    await rabbitMQConnection.connect();
    
    const rabbitMQPublisher = await RabbitMQPublisher.create(rabbitMQConnection);
    const dispatcherService = new RabbitMQDispatcherService(rabbitMQPublisher);

    const trigger = new NewProposalTrigger(
      dispatcherService,
      proposalDB,
      config.triggerInterval
    );

    return new App(trigger, config.proposalStatus, rabbitMQConnection, rabbitMQPublisher);
  }

  async start(): Promise<void> {
    this.trigger.start({ status: this.proposalStatus });
    console.log('Logic system is running. Press Ctrl+C to stop.');
  }

  async stop(): Promise<void> {
    await this.trigger.stop();
    if (this.rabbitMQPublisher) {
      await this.rabbitMQPublisher.close();
    }
    if (this.rabbitMQConnection) {
      await this.rabbitMQConnection.close();
    }
  }
}

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};
