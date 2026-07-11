import { useEffect } from "react";
import { apiClient } from "../config/axios";
import type { ViolationReportResponseDTO } from "../types/proctor";

export function useSecurityTracker(attemptId: number, onSuspended: () => void) {
  useEffect(() => {
    const reportViolation = async (type: string) => {
      try {
        const response = await apiClient.post<ViolationReportResponseDTO>(
          `/student/attempts/${attemptId}/violation`,
          { type }
        );
        
        // Immediately act upon the status returned from the backend (dual fallback to websocket status changes)
        if (response.data.status === "SUSPENDED") {
          onSuspended();
        }
      } catch (error) {
        console.error("Failed to report violation", error);
      }
    };

    const handleBlur = () => reportViolation("WINDOW_BLUR");
    
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        reportViolation("TAB_SWITCH");
      }
    };
    
    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        reportViolation("FULLSCREEN_EXIT");
      }
    };
    
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation(e.type === "copy" ? "COPY" : "PASTE");
    };

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault(); // Lock right-click context menu (Doc 3 requirement)
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("contextmenu", handleRightClick);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("contextmenu", handleRightClick);
    };
  }, [attemptId, onSuspended]);
}
