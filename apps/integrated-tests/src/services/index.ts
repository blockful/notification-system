import { closeDatabase } from '../config/database';
import { processManager } from './process-manager';
import { logManager } from './log-manager';

export const SERVICE_PACKAGES = {
  SUBSCRIPTION_SERVER: '@notification-system/subscription-server',
  DISPATCHER: '@notification-system/dispatcher',
  LOGIC_SYSTEM: '@notification-system/logic-system',
  CONSUMER: '@notification-system/consumer'
} as const;

export type ServiceName = 'subscription-server' | 'dispatcher' | 'logic-system' | 'consumer';

// Main service orchestration functions
export async function startServices(): Promise<void> {
  // Database tables and data are now created in test files
  
  processManager.startProcess('subscription-server', SERVICE_PACKAGES.SUBSCRIPTION_SERVER);
  processManager.startProcess('dispatcher', SERVICE_PACKAGES.DISPATCHER);
  processManager.startProcess('consumer', SERVICE_PACKAGES.CONSUMER);
  processManager.startProcess('logic-system', SERVICE_PACKAGES.LOGIC_SYSTEM);
  
  console.log('All services started successfully');
}

export function stopServices(): void {
  processManager.stopAllProcesses();
  closeDatabase();
  console.log('All services stopped');
}

export function hasAnyLog(message: string, service?: string): boolean {
  return logManager.hasLog(message, service);
}

export function clearCapturedLogs(): void {
  logManager.clearLogs();
}

export { logManager } from './log-manager';
export { processManager } from './process-manager';
export type { LogEntry } from './log-manager'; 