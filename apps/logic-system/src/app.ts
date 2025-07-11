import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { VotingPowerChangedTrigger } from './triggers/voting-power-changed-trigger';
import { ProposalRepository } from './repositories/proposal.repository';
import { VotingPowerRepository } from './repositories/voting-power.repository';
import { RabbitMQDispatcherService } from './api-clients/rabbitmq-dispatcher.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { ProposalStatus } from './interfaces/proposal.interface';
import { AxiosInstance } from 'axios';

export class App {
  private trigger!: NewProposalTrigger;
  private votingPowerTrigger!: VotingPowerChangedTrigger;
  private proposalStatus: ProposalStatus;
  private rabbitMQConnection!: RabbitMQConnection;
  private rabbitMQPublisher!: RabbitMQPublisher;
  private initPromise: Promise<void>;

  constructor(
    triggerInterval: number, 
    proposalStatus: ProposalStatus,
    anticaptureHttpClient: AxiosInstance,
    rabbitmqUrl: string,
  ) {
    this.proposalStatus = proposalStatus;
    
    const anticaptureClient = new AnticaptureClient(anticaptureHttpClient);
    const proposalDB = new ProposalRepository(anticaptureClient);
    const votingPowerDB = new VotingPowerRepository(anticaptureClient);

    this.initPromise = this.initializeRabbitMQ(rabbitmqUrl, proposalDB, votingPowerDB, triggerInterval);
  }

  private async initializeRabbitMQ(
    rabbitmqUrl: string, 
    proposalDB: ProposalRepository,
    votingPowerDB: VotingPowerRepository,
    triggerInterval: number
  ): Promise<void> {
    this.rabbitMQConnection = new RabbitMQConnection(rabbitmqUrl);
    await this.rabbitMQConnection.connect();
    
    this.rabbitMQPublisher = await RabbitMQPublisher.create(this.rabbitMQConnection);
    const dispatcherService = new RabbitMQDispatcherService(this.rabbitMQPublisher);

    this.trigger = new NewProposalTrigger(
      dispatcherService,
      proposalDB,
      triggerInterval
    );

    this.votingPowerTrigger = new VotingPowerChangedTrigger(
      dispatcherService,
      votingPowerDB,
      triggerInterval
    );
  }

  async start(): Promise<void> {
    await this.initPromise;
    this.trigger.start({ status: this.proposalStatus });
    this.votingPowerTrigger.start({});
    console.log('Logic system is running. Press Ctrl+C to stop.');
  }

  async stop(): Promise<void> {
    await this.trigger.stop();
    await this.votingPowerTrigger.stop();
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
