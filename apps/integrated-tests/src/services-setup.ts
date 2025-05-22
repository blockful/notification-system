import { spawn, ChildProcess } from 'child_process';
import { getServiceEnv } from './env-configuration';
import { setupDatabase, closeDatabase } from './pg-setup';

const PACKAGES = {
  SUBSCRIPTION_SERVER: '@notification-system/subscription-server',
  DISPATCHER: '@notification-system/dispatcher',
  LOGIC_SYSTEM: '@notification-system/logic-system',
  CONSUMER: '@notification-system/consumer'
};
const runningProcesses: ChildProcess[] = [];
const capturedLogs: { service: string; type: 'stdout' | 'stderr'; message: string; timestamp: Date }[] = [];
export async function startServices(): Promise<void> {
  await setupDatabase();
  startSubscriptionServer();
  startDispatcher();
  startConsumer();
  startLogicSystem();
  console.log('All services started successfully');
}

export function stopServices(): void {
  runningProcesses.forEach(process => {
    if (!process.killed) process.kill();
  });
  closeDatabase();
  console.log('All services stopped');
}

export function hasAnyLog(message: string, service?: string): boolean {
  return capturedLogs.some(log => 
    log.message.includes(message) &&
    (service ? log.service === service : true)
  );
}

export function clearCapturedLogs(): void {
  capturedLogs.length = 0;
}

function startSubscriptionServer(): void {
  const serverProcess = startProcess(
    'subscription-server',
    ['run', '--filter', PACKAGES.SUBSCRIPTION_SERVER, 'dev']
  );
  runningProcesses.push(serverProcess);
}

function startDispatcher(): void {
  const dispatcherProcess = startProcess(
    'dispatcher',
    ['run', '--filter', PACKAGES.DISPATCHER, 'dev']
  );
  runningProcesses.push(dispatcherProcess);
}

function startConsumer(): void {
  const consumerProcess = startProcess(
    'consumer',
    ['run', '--filter', PACKAGES.CONSUMER, 'dev']
  );
  runningProcesses.push(consumerProcess);
}

function startLogicSystem(): void {
  const logicProcess = startProcess(
    'logic-system',
    ['run', '--filter', PACKAGES.LOGIC_SYSTEM, 'dev']
  );
  runningProcesses.push(logicProcess);
}
function startProcess(name: string, args: string[]): ChildProcess {
  const serviceEnv = getServiceEnv(name);
  
  const childProcess = spawn('pnpm', args, {
    cwd: process.cwd(),
    env: serviceEnv,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  childProcess.stdout?.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`[${name}] ${message}`);
    capturedLogs.push({
      service: name,
      type: 'stdout',
      message: message,
      timestamp: new Date()
    });
  });
  childProcess.stderr?.on('data', (data) => {
    const message = data.toString().trim();
    console.error(`[${name}] ${message}`);
    capturedLogs.push({
      service: name,
      type: 'stderr',
      message: message,
      timestamp: new Date()
    });
  });
  childProcess.on('error', (error) => {
    console.error(`Error starting ${name}:`, error);
  });
  console.log(`${name} started`);
  return childProcess;
} 