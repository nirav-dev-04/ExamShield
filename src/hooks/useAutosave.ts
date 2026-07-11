import { useCallback, useRef } from "react";
import { apiClient } from "../config/axios";

export function useAutosave(attemptId: number) {
  const activeTimers = useRef<{ [key: number]: number }>({});

  const saveAnswer = useCallback((questionId: number, studentAnswer: string) => {
    if (activeTimers.current[questionId]) {
      window.clearTimeout(activeTimers.current[questionId]);
    }

    activeTimers.current[questionId] = window.setTimeout(async () => {
      try {
        await apiClient.post(`/student/attempts/${attemptId}/answer`, {
          questionId,
          studentAnswer,
        });
      } catch (error) {
        console.error("Autosave request failed", error);
      }
    }, 1000); // 1-second debounce to limit request frequency
  }, [attemptId]);

  return { saveAnswer };
}
