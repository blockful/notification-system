export interface RabbitMQMessage<T = any> {
  id: string;
  timestamp: string;
  type: string;
  payload: T;
}

export interface MessageHandler<T = any> {
  (message: RabbitMQMessage<T>): Promise<void>;
}