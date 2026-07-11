import { useEffect, useState, useRef } from "react";
import { apiClient } from "../config/axios";

export function useTimer(attemptId: number, onTimeout: () => void) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const syncTimer = async () => {
    try {
      const response = await apiClient.get<{ remainingSeconds: number }>(
        `/student/attempts/${attemptId}/timer`
      );
      setRemainingSeconds(response.data.remainingSeconds);
      if (response.data.remainingSeconds <= 0) {
        onTimeoutRef.current();
      }
    } catch (e) {
      console.error("Failed to sync remaining time", e);
    }
  };

  useEffect(() => {
    syncTimer();

    // Fetch actual backend remaining time every 30 seconds to correct local drift
    const syncInterval = setInterval(syncTimer, 30000);

    return () => {
      clearInterval(syncInterval);
    };
  }, [attemptId]);

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    const tick = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(tick);
          onTimeoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(tick);
    };
  }, [remainingSeconds]);

  return remainingSeconds;
}
