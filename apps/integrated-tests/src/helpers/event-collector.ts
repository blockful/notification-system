export interface CollectedEvent<T = any> {
  type: string;
  source: string;
  data: T;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface Listener {
  id: string;
  callback: (event: CollectedEvent) => void;
}

export class EventCollector {
  private events: CollectedEvent[] = [];
  private listeners: Map<string, Listener> = new Map();
  private nextListenerId = 0;

  collect<T = any>(event: CollectedEvent<T>): void {
    this.events.push(event);
    this.notifyListeners(event);
  }

  clear(): void {
    this.events = [];
    this.listeners.clear();
  }

  getEvents(): CollectedEvent[] {
    return [...this.events];
  }

  getEventsByType(type: string): CollectedEvent[] {
    return [...this.events.filter(e => e.type === type)];
  }

  getEventsBySource(source: string): CollectedEvent[] {
    return [...this.events.filter(e => e.source === source)];
  }

  findEvent<T = any>(predicate: (event: CollectedEvent<T>) => boolean): CollectedEvent<T> | undefined {
    return this.events.find(predicate as (event: CollectedEvent) => boolean) as CollectedEvent<T> | undefined;
  }

  async waitForEvent<T = any>(
    predicate: (event: CollectedEvent<T>) => boolean,
    options: { timeout?: number; includeExisting?: boolean } = {}
  ): Promise<CollectedEvent<T>> {
    const { timeout = 5000, includeExisting = true } = options;

    // Check existing events first
    if (includeExisting) {
      const existing = this.findEvent(predicate);
      if (existing) return existing;
    }

    // Wait for new events
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeListener(listenerId);
        reject(new Error(`Event not received within ${timeout}ms`));
      }, timeout);

      const listenerId = this.addListener((event) => {
        if (predicate(event as CollectedEvent<T>)) {
          clearTimeout(timeoutId);
          this.removeListener(listenerId);
          resolve(event as CollectedEvent<T>);
        }
      });
    });
  }

  async waitForEventCount(
    expectedCount: number,
    options: { timeout?: number; type?: string; source?: string } = {}
  ): Promise<CollectedEvent[]> {
    const { timeout = 5000, type, source } = options;
    
    const getFilteredEvents = () => {
      let events = this.events;
      if (type) events = events.filter(e => e.type === type);
      if (source) events = events.filter(e => e.source === source);
      return events;
    };

    // Check if we already have enough events
    const currentEvents = getFilteredEvents();
    if (currentEvents.length >= expectedCount) {
      return [...currentEvents.slice(0, expectedCount)];
    }

    // Wait for new events using listener (event-driven)
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeListener(listenerId);
        const finalEvents = getFilteredEvents();
        reject(new Error(
          `Expected ${expectedCount} events but only received ${finalEvents.length} within ${timeout}ms`
        ));
      }, timeout);

      const listenerId = this.addListener(() => {
        const events = getFilteredEvents();
        if (events.length >= expectedCount) {
          clearTimeout(timeoutId);
          this.removeListener(listenerId);
          resolve([...events.slice(0, expectedCount)]);
        }
      });
    });
  }

  private addListener(callback: (event: CollectedEvent) => void): string {
    const id = (++this.nextListenerId).toString();
    this.listeners.set(id, { id, callback });
    return id;
  }

  private removeListener(id: string): void {
    this.listeners.delete(id);
  }

  private notifyListeners(event: CollectedEvent): void {
    this.listeners.forEach(listener => {
      listener.callback(event);
    });
  }
}