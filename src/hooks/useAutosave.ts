import { useCallback, useRef, useState } from "react";
import { apiClient } from "../config/axios";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave(attemptId: number) {
  const activeTimers = useRef<{ [key: number]: number }>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const saveAnswer = useCallback((questionId: number, studentAnswer: string) => {
    setSaveStatus("saving");
    if (activeTimers.current[questionId]) {
      window.clearTimeout(activeTimers.current[questionId]);
    }

    activeTimers.current[questionId] = window.setTimeout(async () => {
      try {
        await apiClient.post(`/student/attempts/${attemptId}/answer`, {
          questionId,
          studentAnswer,
        });
        setSaveStatus("saved");
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveStatus((current) => current === "saved" ? "idle" : current);
        }, 2000);
      } catch (error) {
        console.error("Autosave request failed", error);
        setSaveStatus("error");
      }
    }, 1000); // 1-second debounce to limit request frequency
  }, [attemptId]);

  return { saveAnswer, saveStatus };
}
