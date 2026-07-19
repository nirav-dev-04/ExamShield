import { useEffect, useRef, useState } from "react";
import { apiClient } from "../config/axios";
import type { ViolationReportResponseDTO } from "../types/proctor";

export function useSecurityTracker(attemptId: number, onSuspended: () => void) {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  const lastViolationTimeRef = useRef<number>(0);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  const reportViolation = async (type: string) => {
    if (attemptId === 0) return;
    // Debounce to prevent duplicate logs (1s cooldown)
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1000) return;
    lastViolationTimeRef.current = now;

    try {
      const response = await apiClient.post<ViolationReportResponseDTO>(
        `/student/attempts/${attemptId}/violation`,
        { type }
      );
      if (response.data.status === "SUSPENDED") {
        cleanupStreams();
        onSuspended();
      }
    } catch (error) {
      console.error("Failed to report violation", error);
    }
  };

  const cleanupStreams = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };

  const requestPermissions = async () => {
    try {
      // 1. Request Webcam
      const cam = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false // only need video for proctoring
      });
      cameraStreamRef.current = cam;
      setCameraStream(cam);

      // 2. Request Screen Sharing
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      screenStreamRef.current = screen;
      setScreenStream(screen);

      setPermissionsGranted(true);

      // Setup ended listeners
      screen.getVideoTracks()[0].addEventListener("ended", () => {
        reportViolation("SCREEN_SHARE_STOP");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nYou stopped screen sharing. Screen sharing is mandatory.");
      });

      cam.getVideoTracks()[0].addEventListener("ended", () => {
        reportViolation("WEBCAM_DISCONNECT");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nWebcam feed was disconnected.");
      });

    } catch (err) {
      console.error("Permission request failed", err);
      cleanupStreams();
      alert("❌ Permission Denied: You must grant both Webcam and Screen Share permissions to start the exam.");
      throw err;
    }
  };

  // VM Detection Check
  const checkVM = () => {
    const ua = navigator.userAgent.toLowerCase();
    const isVmUa = ua.includes("virtualbox") || ua.includes("vmware") || ua.includes("parallels") || ua.includes("hyper-v");
    
    let isVmGpu = false;
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL).toLowerCase();
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          if (
            vendor.includes("swiftshader") ||
            vendor.includes("virtualbox") ||
            vendor.includes("vmware") ||
            renderer.includes("virtualbox") ||
            renderer.includes("vmware") ||
            renderer.includes("software rasterizer") ||
            renderer.includes("llvmpipe")
          ) {
            isVmGpu = true;
          }
        }
      }
    } catch (e) {}

    if (isVmUa || isVmGpu) {
      reportViolation("VM_DETECTION");
      alert("⚠️ SECURITY INFRACTION DETECTED:\n\nVirtual Machine environment detected. ExamShield must run on a physical computer.");
    }
  };

  // Multiple Monitor Check
  const checkMultipleScreens = () => {
    try {
      if ("isExtended" in window.screen && (window.screen as any).isExtended) {
        reportViolation("MULTI_MONITOR");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nMultiple monitors detected. Please disconnect external screens.");
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (attemptId === 0 || !permissionsGranted) return;

    // Run VM and screen checks once proctoring is enabled
    checkVM();
    checkMultipleScreens();

    // Run VM and screen checks once proctoring is enabled
    checkVM();
    checkMultipleScreens();

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        reportViolation("TAB_SWITCH");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nYou switched tabs or minimized the browser.");
      }
    };
    
    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        reportViolation("TAB_SWITCH");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nYou exited fullscreen mode. Fullscreen is mandatory.");
      }
    };
    
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation(e.type === "copy" ? "COPY" : "PASTE");
      alert(`⚠️ SECURITY INFRACTION DETECTED:\n\nClipboard actions (${e.type.toUpperCase()}) are strictly prohibited.`);
    };

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      alert("⚠️ SECURITY WARN:\n\nRight-click menu is disabled during this exam.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key (Screenshot attempt)
      if (e.key === "PrintScreen") {
        e.preventDefault();
        reportViolation("SCREENSHOT_ATTEMPT");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nScreenshot attempt detected.");
      }
      // Meta+Shift+S or Ctrl+Shift+S (Snipping Tool / Screenshot capture shortcut)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["S", "s"].includes(e.key)) {
        e.preventDefault();
        reportViolation("SCREENSHOT_ATTEMPT");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nScreen capture shortcut prohibited.");
      }
      // F12 key
      if (e.key === "F12") {
        e.preventDefault();
        reportViolation("DEVTOOLS_OPEN");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nF12 developer tools access is prohibited.");
      }
      // Ctrl+Shift+I, J, C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) {
        e.preventDefault();
        reportViolation("DEVTOOLS_OPEN");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nDeveloper tools shortcut prohibited.");
      }
      // Alt+Tab (if Alt and Tab are pressed together)
      if (e.key === "Tab" && e.altKey) {
        e.preventDefault();
        reportViolation("KEYBOARD_SHORTCUT");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nAlt+Tab application switching is prohibited.");
      }
      // Meta (Windows) key
      if (e.key === "Meta" || e.key === "OS") {
        reportViolation("KEYBOARD_SHORTCUT");
        alert("⚠️ SECURITY INFRACTION DETECTED:\n\nWindows / Meta key is prohibited.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("contextmenu", handleRightClick);
    window.addEventListener("keydown", handleKeyDown);
    
    if (window.screen && "onchange" in window.screen) {
      window.screen.addEventListener("change", checkMultipleScreens);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("contextmenu", handleRightClick);
      window.removeEventListener("keydown", handleKeyDown);
      cleanupStreams();
      
      if (window.screen && "onchange" in window.screen) {
        window.screen.removeEventListener("change", checkMultipleScreens);
      }
    };
  }, [attemptId, permissionsGranted]);

  // Real-time AI Object Detection for Mobile Phones
  useEffect(() => {
    if (!permissionsGranted || attemptId === 0) return;

    let active = true;
    let detectionInterval: any = null;

    const initAI = async () => {
      try {
        console.log("ExamShield AI: Initializing Object Detection...");
        
        // 1. Dynamically Load TensorFlow.js
        if (!(window as any).tf) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load TensorFlow.js"));
            document.body.appendChild(script);
          });
        }

        // 2. Dynamically Load COCO-SSD Object Detector
        if (!(window as any).cocoSsd) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load COCO-SSD"));
            document.body.appendChild(script);
          });
        }

        if (!active) return;

        // 3. Load COCO-SSD Model
        console.log("ExamShield AI: Loading COCO-SSD model weights...");
        const model = await (window as any).cocoSsd.load();
        modelRef.current = model;
        setModelLoaded(true);
        console.log("ExamShield AI: Model loaded successfully. Real-time webcam proctoring active.");

        // 4. Start analysis loop (check frame every 4 seconds)
        detectionInterval = setInterval(async () => {
          const videoElement = document.querySelector("video");
          if (!videoElement || !modelRef.current) return;

          // Check if video element is actually playing and ready
          if (videoElement.readyState === 4) {
            try {
              const predictions = await modelRef.current.detect(videoElement);
              const cellPhone = predictions.find(
                (p: any) => p.class === "cell phone" && p.score > 0.45
              );

              if (cellPhone) {
                console.warn("ExamShield AI Warning: Mobile device detected!", cellPhone);
                reportViolation("MOBILE_PHONE_DETECTED");
                alert("⚠️ SECURITY INFRACTION DETECTED:\n\nA mobile phone was detected in your camera feed. Mobile devices are strictly prohibited during the exam.");
              }
            } catch (err) {
              console.error("AI frame prediction error", err);
            }
          }
        }, 4000);

      } catch (err) {
        console.warn("Could not load AI detection models. Falling back to manual & sandbox proctoring.", err);
      }
    };

    initAI();

    return () => {
      active = false;
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [permissionsGranted, attemptId]);

  return {
    cameraStream,
    screenStream,
    permissionsGranted,
    requestPermissions,
    reportViolation
  };
}
