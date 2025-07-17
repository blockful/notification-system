import * as amqp from 'amqplib';

// Type alias for amqplib connection to avoid verbose ReturnType everywhere
export type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;