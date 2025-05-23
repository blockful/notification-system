import { spawn, ChildProcess } from 'child_process';
import { getServiceEnv } from '../env-configuration';
import { logManager } from './log-manager';

export type ServiceName = 'subscription-server' | 'dispatcher' | 'logic-system' | 'consumer';

class ProcessManager {
  private processes: ChildProcess[] = [];

  startProcess(serviceName: ServiceName, packageName: string): ChildProcess {
    const serviceEnv = getServiceEnv(serviceName);
    const childProcess = spawn('pnpm', ['run', '--filter', packageName, 'dev'], {
      cwd: process.cwd(),
      env: serviceEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    childProcess.stdout?.on('data', (data) => {
      const message = data.toString().trim();
      console.log(`[${serviceName}] ${message}`);
      logManager.addLog(serviceName, 'stdout', message);
    });
    childProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      console.error(`[${serviceName}] ${message}`);
      logManager.addLog(serviceName, 'stderr', message);
    });
    childProcess.on('error', (error) => {
      console.error(`Error starting ${serviceName}:`, error);
    });
    console.log(`${serviceName} started`);
    this.processes.push(childProcess);
    return childProcess;
  }

  stopAllProcesses(): void {
    this.processes.forEach(process => {
      if (!process.killed) process.kill();
    });
    this.processes = [];
  }
}

export const processManager = new ProcessManager(); 