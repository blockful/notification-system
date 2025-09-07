import { Connection, Consumer as RabbitConsumer, Publisher as RabbitPublisher } from 'rabbitmq-client';

export class RabbitMQConnection {
  private connection: Connection | null = null;
  private url: string;
  private isClosing: boolean = false;

  constructor(url: string) {
    const urlObj = new URL(url);
    
    // Force IPv4 for consistency
    if (urlObj.hostname === 'localhost') {
      urlObj.hostname = '127.0.0.1';
    }
    urlObj.searchParams.set('heartbeat', '30');
    
    this.url = urlObj.toString();
  }

  async connect(): Promise<void> {
    if (!this.connection) {
      this.connection = new Connection(this.url);
      this.connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err.message);
      });
      
      this.connection.on('connection', () => {
        console.log('[RabbitMQ] Connection (re)established');
      });
      
      await this.connection.onConnect(5000);
    }
  }

  async close(): Promise<void> {
    if (!this.connection || this.isClosing) {
      return;
    }
    
    this.isClosing = true;
    try {
      await this.connection.close();
      this.connection = null;
    } finally {
      this.isClosing = false;
    }
  }

  isConnected(): boolean {
    return this.connection !== null && !this.isClosing;
  }
  
  getConnection(): Connection | null {
    return this.connection;
  }
}