export interface LogEntry {
  service: string;
  type: 'stdout' | 'stderr';
  message: string;
  timestamp: Date;
}

class LogManager {
  private logs: LogEntry[] = [];
  addLog(service: string, type: 'stdout' | 'stderr', message: string): void {
    this.logs.push({
      service,
      type,
      message,
      timestamp: new Date()
    });
  }
  hasLog(message: string, service?: string): boolean {
    return this.logs.some(log => 
      log.message.includes(message) &&
      (service ? log.service === service : true)
    );
  }
  clearLogs(): void {
    this.logs.length = 0;
  }
  getAllLogs(): ReadonlyArray<LogEntry> {
    return [...this.logs];
  }
}

export const logManager = new LogManager(); 