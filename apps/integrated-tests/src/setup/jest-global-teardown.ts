import { globalRabbitMQSetup } from './rabbitmq-setup';

export default async function globalTeardown() {
  console.log('Jest global teardown: Cleaning up RabbitMQ container...');
  await globalRabbitMQSetup.globalCleanup();
  console.log('Jest global teardown: Complete');
  
  // Kill any remaining child processes
  process.kill(process.pid, 'SIGTERM');
  
  // Force exit after teardown to ensure hanging processes don't block Jest
  setTimeout(() => process.exit(0), 1000);
}