import { spawn, ChildProcess } from 'child_process';
import { getServiceEnv } from './env-configuration';
import { setupDatabase, closeDatabase } from './pg-setup';

const PACKAGES = {
  SUBSCRIPTION_SERVER: '@notification-system/subscription-server',
  DISPATCHER: '@notification-system/dispatcher',
  LOGIC_SYSTEM: '@notification-system/logic-system'
};
const runningProcesses: ChildProcess[] = [];

/**
 * Start all system components
 */
export async function startServices(): Promise<void> {
  await setupDatabase();
  startSubscriptionServer();
  startDispatcher();
  startLogicSystem();
  console.log('All services started successfully');
}

/**
 * Stop all running services
 */
export function stopServices(): void {
  runningProcesses.forEach(process => {
    if (!process.killed) process.kill();
  });
  closeDatabase();
  console.log('All services stopped');
}

/**
 * Start the subscription server
 */
function startSubscriptionServer(): void {
  const serverProcess = startProcess(
    'subscription-server',
    ['run', '--filter', PACKAGES.SUBSCRIPTION_SERVER, 'dev']
  );
  runningProcesses.push(serverProcess);
}

/**
 * Start the dispatcher
 */
function startDispatcher(): void {
  const dispatcherProcess = startProcess(
    'dispatcher',
    ['run', '--filter', PACKAGES.DISPATCHER, 'dev']
  );
  runningProcesses.push(dispatcherProcess);
}

/**
 * Start the logic system
 */
function startLogicSystem(): void {
  const logicProcess = startProcess(
    'logic-system',
    ['run', '--filter', PACKAGES.LOGIC_SYSTEM, 'dev']
  );
  runningProcesses.push(logicProcess);
}

/**
 * Helper function to start a process
 */
function startProcess(name: string, args: string[]): ChildProcess {
  const serviceEnv = getServiceEnv(name);
  
  const childProcess = spawn('pnpm', args, {
    cwd: process.cwd(),
    env: serviceEnv,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  childProcess.stdout?.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  childProcess.stderr?.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });
  childProcess.on('error', (error) => {
    console.error(`Error starting ${name}:`, error);
  });
  console.log(`${name} started`);
  return childProcess;
} 