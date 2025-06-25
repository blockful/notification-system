import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { ProposalRepository } from './repositories/proposal.repository';
import { RabbitMQDispatcherService } from './api-clients/rabbitmq-dispatcher.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { ProposalStatus } from './interfaces/proposal.interface';
import { AxiosInstance } from 'axios';

export class App {
  private trigger?: NewProposalTrigger;
  private proposalStatus: ProposalStatus;
  private rabbitMQConnection?: RabbitMQConnection;
  private rabbitMQPublisher?: RabbitMQPublisher;

  constructor(
    private triggerInterval: number, 
    proposalStatus: ProposalStatus,
    private anticaptureHttpClient: AxiosInstance,
    private rabbitmqUrl: string
  ) {
    this.proposalStatus = proposalStatus;
  }

  async start(): Promise<void> {
    if (!this.trigger) {
      const anticaptureClient = new AnticaptureClient(this.anticaptureHttpClient);
      const proposalDB = new ProposalRepository(anticaptureClient);

      this.rabbitMQConnection = new RabbitMQConnection(this.rabbitmqUrl);
      await this.rabbitMQConnection.connect();
      
      this.rabbitMQPublisher = await RabbitMQPublisher.create(this.rabbitMQConnection);
      const dispatcherService = new RabbitMQDispatcherService(this.rabbitMQPublisher);

      this.trigger = new NewProposalTrigger(
        dispatcherService,
        proposalDB,
        this.triggerInterval
      );
    }

    this.trigger.start({ status: this.proposalStatus });
    console.log('Logic system is running. Press Ctrl+C to stop.');
  }

  async stop(): Promise<void> {
    if (this.trigger) {
      await this.trigger.stop();
    }
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
