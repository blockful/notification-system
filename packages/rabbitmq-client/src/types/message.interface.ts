export interface PublishMessage<T = any> {
  type: string;
  payload: T;
}

export interface RabbitMQMessage<T = any> extends PublishMessage<T> {
  id: string;
  timestamp: string;
}

export interface MessageHandler<T = any> {
  (message: RabbitMQMessage<T>): Promise<void>;
}