import { timeouts } from '../../config';

/**
 * Represents a collected event with metadata
 * 
 * @template T - Type of the event data payload
 */
export interface CollectedEvent<T = any> {
  /** The type/name of the event */
  type: string;
  /** The source system that generated the event */
  source: string;
  /** The event payload data */
  data: T;
  /** When the event was created */
  timestamp: Date;
  /** Optional additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Internal listener interface for event notifications
 */
interface Listener {
  /** Unique identifier for the listener */
  id: string;
  /** Callback function to execute when events occur */
  callback: (event: CollectedEvent) => void;
}

/**
 * Event collector for integration tests
 * 
 * This class provides functionality to collect, store, and wait for events
 * during integration testing. It supports filtering by type/source and
 * event-driven waiting with timeouts.
 */
export class EventCollector {
  /** Storage for all collected events */
  private events: CollectedEvent[] = [];
  /** Active event listeners */
  private listeners: Map<string, Listener> = new Map();
  /** Counter for generating unique listener IDs */
  private nextListenerId = 0;

  /**
   * Collects a new event and notifies all active listeners
   * 
   * @template T - Type of the event data
   * @param event - The event to collect
   */
  collect<T = any>(event: CollectedEvent<T>): void {
    this.events.push(event);
    this.notifyListeners(event);
  }

  /**
   * Clears all collected events and removes all listeners
   */
  clear(): void {
    this.events = [];
    this.listeners.clear();
  }

  /**
   * Gets a copy of all collected events
   * 
   * @returns Array of all collected events
   */
  getEvents(): CollectedEvent[] {
    return [...this.events];
  }

  /**
   * Gets all events of a specific type
   * 
   * @param type - The event type to filter by
   * @returns Array of events matching the type
   */
  getEventsByType(type: string): CollectedEvent[] {
    return [...this.events.filter(e => e.type === type)];
  }

  /**
   * Gets all events from a specific source
   * 
   * @param source - The event source to filter by
   * @returns Array of events matching the source
   */
  getEventsBySource(source: string): CollectedEvent[] {
    return [...this.events.filter(e => e.source === source)];
  }

  /**
   * Finds the first event matching a predicate function
   * 
   * @template T - Type of the event data
   * @param predicate - Function to test each event
   * @returns The first matching event or undefined
   */
  findEvent<T = any>(predicate: (event: CollectedEvent<T>) => boolean): CollectedEvent<T> | undefined {
    return this.events.find(predicate as (event: CollectedEvent) => boolean) as CollectedEvent<T> | undefined;
  }

  /**
   * Waits for an event matching a predicate function
   * 
   * @template T - Type of the event data
   * @param predicate - Function to test each event
   * @param options - Configuration options
   * @param options.timeout - Maximum time to wait in milliseconds (default: 5000)
   * @param options.includeExisting - Whether to check existing events first (default: true)
   * @returns Promise that resolves to the matching event
   * @throws Will throw an error if no matching event is found within the timeout
   */
  async waitForEvent<T = any>(
    predicate: (event: CollectedEvent<T>) => boolean,
    options: { timeout?: number; includeExisting?: boolean } = {}
  ): Promise<CollectedEvent<T>> {
    const { timeout = timeouts.wait.default, includeExisting = true } = options;

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

  /**
   * Waits for a specific number of events to be collected
   * 
   * @param expectedCount - The number of events to wait for
   * @param options - Configuration options
   * @param options.timeout - Maximum time to wait in milliseconds (default: 5000)
   * @param options.type - Optional event type filter
   * @param options.source - Optional event source filter
   * @returns Promise that resolves to an array of the collected events
   * @throws Will throw an error if the expected count is not reached within the timeout
   */
  async waitForEventCount(
    expectedCount: number,
    options: { timeout?: number; type?: string; source?: string } = {}
  ): Promise<CollectedEvent[]> {
    const { timeout = timeouts.wait.default, type, source } = options;
    
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

  /**
   * Adds a new event listener
   * 
   * @param callback - Function to call when events are collected
   * @returns Unique listener ID for removal
   */
  private addListener(callback: (event: CollectedEvent) => void): string {
    const id = (++this.nextListenerId).toString();
    this.listeners.set(id, { id, callback });
    return id;
  }

  /**
   * Removes an event listener by ID
   * 
   * @param id - The listener ID to remove
   */
  private removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Notifies all active listeners about a new event
   * 
   * @param event - The event to notify listeners about
   */
  private notifyListeners(event: CollectedEvent): void {
    this.listeners.forEach(listener => {
      listener.callback(event);
    });
  }
}