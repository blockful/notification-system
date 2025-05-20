import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Define packages como constantes para evitar erros de digitação
const PACKAGES = {
  SUBSCRIPTION_SERVER: '@notification-system/subscription-server',
  DISPATCHER: '@notification-system/dispatcher',
  LOGIC_SYSTEM: '@notification-system/logic-system'
};

// Store all running processes
const runningProcesses: ChildProcess[] = [];

/**
 * Start all system components
 */
export async function startServices(): Promise<void> {
  await startSubscriptionServer();
  await startDispatcher();
  await startLogicSystem();
  console.log('All services started successfully');
}

/**
 * Stop all running services
 */
export async function stopServices(): Promise<void> {
  for (const process of runningProcesses) {
    if (process && !process.killed) {
      process.kill();
    }
  }
  console.log('All services stopped');
}

/**
 * Start the subscription server
 */
async function startSubscriptionServer(): Promise<void> {
  const serverProcess = startPackageWithPnpm('subscription-server', PACKAGES.SUBSCRIPTION_SERVER);
  runningProcesses.push(serverProcess);
  console.log('Subscription server started');
}

/**
 * Start the dispatcher
 */
async function startDispatcher(): Promise<void> {
  const dispatcherProcess = startPackageWithPnpm('dispatcher', PACKAGES.DISPATCHER);
  runningProcesses.push(dispatcherProcess);
  console.log('Dispatcher started');
}

/**
 * Start the logic system
 */
async function startLogicSystem(): Promise<void> {
  const logicProcess = startPackageWithPnpm('logic-system', PACKAGES.LOGIC_SYSTEM);
  runningProcesses.push(logicProcess);
  console.log('Logic system started');
}

/**
 * Helper function to start a package with pnpm
 */
function startPackageWithPnpm(name: string, packageName: string): ChildProcess {
  return startProcess(
    name, 
    process.cwd(),
    'pnpm', 
    ['run', '--filter', packageName, 'dev']
  );
}

/**
 * Helper function to start a process
 */
function startProcess(name: string, cwd: string, command: string, args: string[]): ChildProcess {
  const childProcess = spawn(command, args, {
    cwd,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Log output
  if (childProcess.stdout) {
    childProcess.stdout.on('data', (data) => {
      console.log(`[${name}] ${data.toString().trim()}`);
    });
  }

  if (childProcess.stderr) {
    childProcess.stderr.on('data', (data) => {
      console.error(`[${name}] ${data.toString().trim()}`);
    });
  }

  childProcess.on('error', (error) => {
    console.error(`Error starting ${name}:`, error);
  });

  childProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  return childProcess;
}

// If this script is run directly
if (require.main === module) {
  startServices().catch(error => {
    console.error('Failed to start services:', error);
    process.exit(1);
  });
  const shutdown = async () => {
    console.log('Shutting down...');
    await stopServices();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} 