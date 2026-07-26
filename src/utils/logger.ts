import { LogEntry, LogLevel } from '../types';

type LogListener = (logs: LogEntry[]) => void;

class Logger {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 200;

  private createEntry(level: LogLevel, moduleName: string, message: string, details?: Record<string, unknown> | string): LogEntry {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
      level,
      module: moduleName,
      message,
      details,
    };

    this.logs = [entry, ...this.logs.slice(0, this.maxLogs - 1)];
    
    // Console log output
    const consoleMsg = `[RokuOS::${moduleName}] [${entry.level}] ${message}`;
    if (level === 'ERROR') console.error(consoleMsg, details || '');
    else if (level === 'WARN') console.warn(consoleMsg, details || '');
    else console.log(consoleMsg, details || '');

    this.notify();
    return entry;
  }

  debug(moduleName: string, message: string, details?: Record<string, unknown> | string) {
    return this.createEntry('DEBUG', moduleName, message, details);
  }

  info(moduleName: string, message: string, details?: Record<string, unknown> | string) {
    return this.createEntry('INFO', moduleName, message, details);
  }

  warn(moduleName: string, message: string, details?: Record<string, unknown> | string) {
    return this.createEntry('WARN', moduleName, message, details);
  }

  error(moduleName: string, message: string, details?: Record<string, unknown> | string) {
    return this.createEntry('ERROR', moduleName, message, details);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentLogs = [...this.logs];
    this.listeners.forEach((fn) => fn(currentLogs));
  }
}

export const logger = new Logger();
