import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Smart Polling Hook
 * - Stops polling when document is hidden (tab inactive)
 * - Restarts polling when tab is active
 * - Stops polling when offline
 * - Prevents overlapping requests (waits for previous fetch to complete)
 * - Provides a manual trigger function
 */
export function useSmartPolling(callback: () => Promise<any> | void, intervalMs: number, enabled: boolean = true) {
  const [isSyncing, setIsSyncing] = useState(false);
  const isFetchingRef = useRef(false);
  const savedCallback = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const executePoll = useCallback(async () => {
    if (!enabled) return;
    if (isFetchingRef.current) return; // Prevent overlapping calls
    if (typeof document !== "undefined" && document.hidden) return; // Stop if tab is hidden
    if (typeof window !== "undefined" && !window.navigator.onLine) return; // Stop if offline

    isFetchingRef.current = true;
    setIsSyncing(true);
    try {
      const result = savedCallback.current();
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error("Polling error:", error);
    } finally {
      isFetchingRef.current = false;
      setIsSyncing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Set up the interval
    timerRef.current = setInterval(executePoll, intervalMs);

    // Event listener for visibility change (trigger immediate fetch when returning to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Reset interval to avoid immediate double fetch
        if (timerRef.current) clearInterval(timerRef.current);
        executePoll();
        timerRef.current = setInterval(executePoll, intervalMs);
      }
    };

    // Event listener for online (trigger immediate fetch when internet is back)
    const handleOnline = () => {
      executePoll();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (typeof window !== "undefined") {
        window.addEventListener("online", handleOnline);
      }
    };
  }, [executePoll, intervalMs, enabled]);

  return { manualSync: executePoll, isSyncing };
}
