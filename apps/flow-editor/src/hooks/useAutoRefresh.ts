'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  /** Callback when refresh is triggered */
  onRefresh: () => void;
  /** Polling interval in milliseconds (default: 5000) */
  interval?: number;
  /** Whether auto-refresh is enabled */
  enabled?: boolean;
}

/**
 * Hook for auto-refreshing the flow when files change
 * Uses polling in development mode to check for changes
 */
export function useAutoRefresh({
  onRefresh,
  interval = 5000,
  enabled = true,
}: UseAutoRefreshOptions) {
  const lastGeneratedAt = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkForUpdates = useCallback(async () => {
    try {
      const response = await fetch('/api/flow/current');
      if (!response.ok) return;
      
      const flow = await response.json();
      const currentGeneratedAt = flow.metadata?.generatedAt;
      
      if (lastGeneratedAt.current && currentGeneratedAt !== lastGeneratedAt.current) {
        console.log('[AutoRefresh] Flow updated, refreshing...');
        onRefresh();
      }
      
      lastGeneratedAt.current = currentGeneratedAt;
    } catch (error) {
      console.error('[AutoRefresh] Error checking for updates:', error);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') {
      return;
    }

    // Initial check
    checkForUpdates();

    // Set up polling
    intervalRef.current = setInterval(checkForUpdates, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, checkForUpdates]);

  return {
    checkNow: checkForUpdates,
  };
}
