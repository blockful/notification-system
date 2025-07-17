# How to Add New Trigger Logics

This guide walks you through adding new trigger types to the Logic System, enabling monitoring of different blockchain events or implementing new business logics. We'll use our existing **NewProposalTrigger** as the complete reference example to understand how triggers work and how to create new ones.

## 📋 Prerequisites

- Understanding of the [Logic System architecture](../../apps/logic-system/README.md)
- Knowledge of TypeScript and async/await patterns
- Familiarity with the AntiCapture GraphQL API
- Basic understanding of RabbitMQ message patterns

## 🏗️ Understanding Our Trigger System

Before creating new triggers, let's understand how our existing **NewProposalTrigger** works. This will serve as our template for creating any new trigger type.

## 🚀 Step-by-Step Implementation

### Step 1: Define Data Interfaces

First, we need to create interface files to define the data structures our trigger will work with. In our case, for the **NewProposalTrigger**, we have the proposal interfaces:

```typescript
// apps/logic-system/src/interfaces/proposal.interface.ts
export type ProposalOnChain = GetProposalByIdQuery['proposalsOnchain'];

export type ProposalStatus = 
    | 'pending' | 'active' | 'succeeded' | 'defeated'
    | 'executed' | 'canceled' | 'queued' | 'expired';

export interface ListProposalsOptions {
    offset?: number;
    limit?: number;
    status?: string;
    daoId?: string;
}

export interface ProposalDataSource {
    getById(id: string): Promise<ProposalOrNull>;
    listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]>;
}
```

**Why we need this:** These interfaces define the data types our trigger will work with and the contract for accessing that data. If you're creating a trigger for a different type of event (like token transfers, votes, etc.), you'd create similar interfaces for that data type.

### Step 2: Understand the Base Trigger Class

There's an abstract base class called `Trigger` that provides the foundation for all triggers. It handles the timing, lifecycle management, and defines the structure every trigger must follow:

```typescript
// apps/logic-system/src/triggers/base-trigger.ts (conceptual structure)
abstract class Trigger<TData, TFilterOptions> {
  protected abstract fetchData(filterOptions?: TFilterOptions): Promise<TData[]>;
  protected abstract process(data: TData[]): Promise<void>;
  
  start(): void;
  stop(): void;
  restart(): void;
}
```

**How it works:** This base class handles starting/stopping the trigger on intervals, while each specific trigger (like our NewProposalTrigger) implements the `fetchData` and `process` methods for their specific use case.

### Step 3: Implement the Trigger Class

Now let's look at how our **NewProposalTrigger** extends this base class:

```typescript
// apps/logic-system/src/triggers/new-proposal-trigger.ts
import { Trigger } from './base-trigger';
import { ProposalOnChain, ListProposalsOptions, ProposalDataSource } from '../interfaces/proposal.interface';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

export class NewProposalTrigger extends Trigger<ProposalOnChain, ListProposalsOptions> {
  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly proposalRepository: ProposalDataSource,
    interval: number
  ) {
    super('new-proposal', interval);
  }

  protected async fetchData(options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    if (!options?.status) {
      throw new Error('Status is required in filter options');
    }
    return await this.proposalRepository.listAll({ status: options.status });
  }

  async process(data: ProposalOnChain[]) {
    const message: DispatcherMessage = {
      triggerId: this.id,
      events: data
    };
    await this.dispatcherService.sendMessage(message);
  }
}
```

**Key points:**
- **fetchData**: Gets the data from our data source (proposals with specific status)
- **process**: Takes the fetched data and sends it to the Dispatcher via RabbitMQ
- **Constructor**: Receives dependencies and sets the trigger ID ('new-proposal')

### Step 4: Create a Data Repository

To get data from external sources, we need a repository. In our case for the **NewProposalTrigger**, we have the `ProposalRepository` that fetches data from the AntiCapture GraphQL API:

```typescript
// apps/logic-system/src/repositories/proposal.repository.ts
import { ProposalDataSource, ProposalOnChain, ListProposalsOptions } from '../interfaces/proposal.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';

export class ProposalRepository implements ProposalDataSource {
  constructor(private anticaptureClient: AnticaptureClient) {}

  async getById(id: string): Promise<ProposalOnChain | null> {
    try {
      const result = await this.anticaptureClient.getProposalById({ id });
      return result.proposalsOnchain || null;
    } catch (error) {
      console.error(`Failed to fetch proposal ${id}:`, error);
      return null;
    }
  }

  async listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    try {
      // Generate case variations for status (pending, PENDING, Pending)
      const statusVariations = options?.status ? [
        options.status.toLowerCase(),
        options.status.toUpperCase(),
        options.status.charAt(0).toUpperCase() + options.status.slice(1).toLowerCase()
      ] : undefined;

      const result = await this.anticaptureClient.listProposals({
        offset: options?.offset,
        limit: options?.limit,
        status: statusVariations,
        daoId: options?.daoId
      });

      return result.proposalsOnchain || [];
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
      return [];
    }
  }
}
```

**What this does:** This repository abstracts the data access logic, handles API calls, error handling, and data transformation. For other trigger types, you'd create similar repositories for their data sources.

### Step 5: Register the Trigger in the App Class

Now we need to register our trigger in the main App class of the Logic System, like we do with the **NewProposalTrigger**:

```typescript
// apps/logic-system/src/app.ts
import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { ProposalRepository } from './repositories/proposal.repository';

export class App {
  private triggers: Trigger<any, any>[] = [];

  constructor(
    private httpClient: AxiosInstance,
    private rabbitmqUrl: string,
    private config: Config
  ) {}

  async start(): Promise<void> {
    // Setup dependencies
    const rabbitmqClient = new RabbitMQClient(this.rabbitmqUrl);
    await rabbitmqClient.connect();
    
    const dispatcherService = new RabbitMQDispatcherService(rabbitmqClient);
    const anticaptureClient = new AnticaptureClient(this.httpClient);
    const proposalRepository = new ProposalRepository(anticaptureClient);

    // Create and register the NewProposalTrigger
    const newProposalTrigger = new NewProposalTrigger(
      dispatcherService,
      proposalRepository,
      this.config.triggerInterval
    );

    this.triggers.push(newProposalTrigger);

    // Start all triggers
    this.triggers.forEach(trigger => trigger.start());
    
    console.log('Started triggers:', this.triggers.map(t => t.id));
  }

  async stop(): Promise<void> {
    this.triggers.forEach(trigger => trigger.stop());
    // ... cleanup code
  }
}
```

**What happens here:** We create instances of all our dependencies, instantiate our trigger with those dependencies, add it to the triggers array, and start them all. The trigger will now run on the specified interval.

### Step 6: Create a Handler in the Dispatcher

Now that we have a trigger running and sending messages to RabbitMQ, we need to create a handler in the Dispatcher component to receive those messages and decide what to do with them. For our **NewProposalTrigger**, we have the `NewProposalTriggerHandler`:

```typescript
// apps/dispatcher/src/services/triggers/new-proposal-trigger.service.ts
import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";
import crypto from 'crypto';

export class NewProposalTriggerHandler extends BaseTriggerHandler {
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory
  ) {
    super(subscriptionClient, notificationFactory);
  }

  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    for (const proposal of message.events) {
      const { daoId, id: proposalId, description, timestamp } = proposal;
      
      // Extract the proposal title from description
      const proposalTitle = description.split('\n')[0].replace(/^#+\s*/, '') || 'Unnamed Proposal';
      
      // Get all subscribers for this DAO
      const subscribers = await this.getSubscribers(daoId, proposalId, timestamp);
      
      // Create the notification message
      const notificationMessage = `🗳️ New governance proposal in ${daoId}: "${proposalTitle}"`;
      
      // Send notifications to all subscribers
      await this.sendNotificationsToSubscribers(subscribers, notificationMessage, proposalId, daoId);
    }
    
    return {
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }
}
```

**What this handler does:**
- Receives the message from the Logic System containing proposal data
- Extracts relevant information (DAO ID, proposal title, etc.)
- Gets the list of users subscribed to that DAO
- Creates a formatted notification message
- Sends the notification to all subscribers

### Step 7: Register the Handler in TriggerProcessorService

Finally, we need to register our handler in the `TriggerProcessorService` so it knows which handler to use for which trigger type:

```typescript
// apps/dispatcher/src/services/trigger-processor.service.ts
import { NewProposalTriggerHandler } from './triggers/new-proposal-trigger.service';

export class TriggerProcessorService {
  private triggerHandlers = new Map<string, any>();

  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory
  ) {
    // Register the NewProposalTriggerHandler for 'new-proposal' trigger messages
    this.triggerHandlers.set('new-proposal', 
      new NewProposalTriggerHandler(subscriptionClient, notificationFactory)
    );
  }

  async processMessage(message: any): Promise<void> {
    const { type, payload } = message;
    
    if (type === 'TRIGGER_EVENT') {
      const handler = this.triggerHandlers.get(payload.triggerId);
      
      if (!handler) {
        throw new Error(`No handler found for trigger: ${payload.triggerId}`);
      }
      
      await handler.handleMessage(payload);
    }
  }
}
```

**How it works:** When a message comes from RabbitMQ with `triggerId: 'new-proposal'`, the TriggerProcessorService looks up the corresponding handler and calls its `handleMessage` method.

## 🔄 Complete Flow Summary

Now let's see how everything works together:

1. **Logic System** runs the `NewProposalTrigger` every X seconds
2. **Trigger** fetches pending proposals from AntiCapture API via `ProposalRepository`
3. **Trigger** sends found proposals to Dispatcher via RabbitMQ
4. **Dispatcher** receives the message and routes it to `NewProposalTriggerHandler`
5. **Handler** processes each proposal, gets subscribers, and creates notifications
6. **Handler** sends notifications to the Consumer service for delivery

---

**Need help?** Check the existing `NewProposalTrigger` implementation in `apps/logic-system/src/triggers/` and its corresponding handler in `apps/dispatcher/src/services/triggers/` for a complete working example.