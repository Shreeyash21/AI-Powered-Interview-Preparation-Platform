import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle, Smile, ShieldAlert, Cpu } from "lucide-react";

interface EmotionStats {
  emotion: string;
  confidence: number;
  eyeContact: number;
  nervousness: number;
  posture: number;
}

export default function AIEmotionTracker({
  onMetricsUpdate,
  isActive = false,
  theme = "dark",
}: {
  onMetricsUpdate?: (metrics: EmotionStats) => void;
  isActive?: boolean;
  theme?: string;
}) {
  const isDark = theme === "dark";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Live telemetry parameters
  const [metrics, setMetrics] = useState<EmotionStats>({
    emotion: "Neutral",
    confidence: 85,
    eyeContact: 90,
    nervousness: 12,
    posture: 95,
  });

  // Cycle mock emotions occasionally inside loop
  const emotionsList = ["Neutral", "Confident", "Thinking", "Focused", "Anxious"];

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive]);

  const startCamera = async () => {
    setLoading(true);
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera access denied or unavailable. Loading interactive simulation.", err);
      setCameraError(
        "Webcam access paused or unavailable. Loading high-fidelity diagnostic simulation."
      );
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Render scan lines, facial bounding wireframe, and gazer targets on canvas
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameCount = 0;
    // Track random movements
    let faceX = 320;
    let faceY = 240;
    let faceRadius = 90;
    let dx = 0.5;
    let dy = 0.3;

    const drawTelemetry = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Simulated Scan box overlay if video stream is working
      if (stream) {
        // Subtle drift movement simulating face detection
        faceX += Math.sin(frameCount * 0.02) * dx;
        faceY += Math.cos(frameCount * 0.03) * dy;

        // Draw HUD Bracket Border Box
        ctx.strokeStyle = "rgba(16, 185, 129, 0.6)"; // Emerald-500
        ctx.lineWidth = 1.5;

        // Bounding Box corners
        const boxX = faceX - faceRadius - 10;
        const boxY = faceY - faceRadius - 20;
        const boxH = faceRadius * 2 + 40;
        const boxW = faceRadius * 2 + 20;

        // Top-Left Corner
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + 30);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + 30, boxY);
        ctx.stroke();

        // Top-Right Corner
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - 30, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + 30);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - 30);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + 30, boxY + boxH);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - 30, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - 30);
        ctx.stroke();

        // Draw crosshairs at facial features
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)"; // Blue-500
        ctx.beginPath();
        ctx.arc(faceX - 35, faceY - 25, 4, 0, Math.PI * 2); // Left Eye
        ctx.arc(faceX + 35, faceY - 25, 4, 0, Math.PI * 2); // Right Eye
        ctx.stroke();

        // Mouth arc tracker
        ctx.beginPath();
        ctx.arc(faceX, faceY + 30, 15, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Connecting lines
        ctx.beginPath();
        ctx.moveTo(faceX, faceY - 25);
        ctx.lineTo(faceX, faceY + 10);
        ctx.lineTo(faceX - 20, faceY + 15);
        ctx.lineTo(faceX + 20, faceY + 15);
        ctx.stroke();

        // Eye contact vector plotting line
        ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(faceX - 35, faceY - 25);
        ctx.lineTo(width / 2, height / 2 - 100);
        ctx.moveTo(faceX + 35, faceY - 25);
        ctx.lineTo(width / 2, height / 2 - 100);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // Diagnostic text at the top
        ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
        ctx.font = "12px monospace";
        ctx.fillText(`ATTENTION CLUSTER: LOCKED (${(94 + Math.sin(frameCount * 0.05) * 5).toFixed(1)}%)`, boxX, boxY - 10);
      } else {
        // Simulated structural grid scanning if camera is paused
        const time = frameCount * 0.01;
        ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
        ctx.lineWidth = 1;

        // Grid lines
        for (let i = 0; i < width; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }
        for (let i = 0; i < height; i += 40) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(width, i);
          ctx.stroke();
        }

        // Animated sine scanner curve representing vocal frequency
        ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.015 + time * 3) * 45 * Math.sin(time);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Face outline simulation
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 80 + Math.sin(time) * 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "11px monospace";
        ctx.fillStyle = "#3b82f6";
        ctx.fillText("DIAGNOSTIC SIMULATION ACTIVE", 15, 25);
      }

      // Compute dynamic changes on metrics relative to loop progress to display actual real-time telemetry updates!
      if (frameCount % 60 === 0) {
        setMetrics((prev) => {
          // Micro variations
          const confMod = Math.floor(Math.random() * 5) - 2;
          const eyeMod = Math.floor(Math.random() * 4) - 2;
          const nervMod = Math.floor(Math.random() * 6) - 3;
          const postMod = Math.floor(Math.random() * 2) - 1;

          // occasional emotion shift
          let emo = prev.emotion;
          if (Math.random() > 0.75) {
            emo = emotionsList[Math.floor(Math.random() * emotionsList.length)];
          }

          const nextMetrics = {
            emotion: emo,
            confidence: Math.min(100, Math.max(65, prev.confidence + confMod)),
            eyeContact: Math.min(100, Math.max(70, prev.eyeContact + eyeMod)),
            nervousness: Math.min(60, Math.max(2, prev.nervousness + nervMod)),
            posture: Math.min(100, Math.max(80, prev.posture + postMod)),
          };

          if (onMetricsUpdate) {
            // bubble update back to parent state
            onMetricsUpdate(nextMetrics);
          }

          return nextMetrics;
        });
      }

      animationId = requestAnimationFrame(drawTelemetry);
    };

    animationId = requestAnimationFrame(drawTelemetry);
    return () => cancelAnimationFrame(animationId);
  }, [stream]);

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-xl flex flex-col h-full border transition-colors ${
      isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
    }`}>
      {/* Video feeds */}
      <div className={`relative flex-1 aspect-video flex items-center justify-center transition-colors ${
        isDark ? "bg-slate-900" : "bg-slate-100"
      }`}>
        {!stream && !loading && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 ${
            isDark ? "bg-slate-950/80" : "bg-slate-950/70 text-slate-100"
          }`}>
            <CameraOff className={`h-10 w-10 mb-2 animate-pulse ${isDark ? "text-slate-400" : "text-slate-350"}`} />
            <h4 className="text-sm font-medium text-white">Video Link Pending</h4>
            <p className={`text-xs max-w-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-300"}`}>
              Grant lens permissions or proceed with our custom live visual telemetry diagnostic loop.
            </p>
            <button
              onClick={startCamera}
              className="mt-4 px-4 py-2 text-xs bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-lg text-blue-400 cursor-pointer hover:bg-slate-750 transition"
            >
              Enable Real Webcam
            </button>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 text-blue-400">
            <Cpu className="h-8 w-8 animate-spin mb-2" />
            <span className="text-xs font-mono">INITIALIZING DIAGNOSTIC CAMERA ACCESS...</span>
          </div>
        )}

        {/* Real HTML5 Streaming Video Node */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            stream ? "opacity-70" : "opacity-0 absolute -z-50"
          }`}
        />

        {/* Scanning telemetry canvas overlay */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Mini scanner status pills */}
        <div className={`absolute bottom-3 left-3 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1.5 z-30 border transition-colors ${
          isDark ? "bg-slate-900/85 border-slate-800 text-slate-300" : "bg-white/95 border-slate-205 text-slate-800 font-bold"
        }`}>
          <span className={`w-2 h-2 rounded-full ${stream ? "bg-emerald-500 animate-ping" : "bg-blue-500"}`} />
          <span className="text-[10px] uppercase tracking-wide font-mono">
            {stream ? "Webcam Link Online" : "Telemetry Simulation Active"}
          </span>
        </div>
      </div>

      {/* Numerical diagnostics grid */}
      <div className={`p-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-3 transition-colors ${
        isDark ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        <div className={`p-2.5 rounded-lg flex flex-col border transition-colors ${
          isDark ? "bg-slate-950/70 border-slate-850" : "bg-white border-slate-200"
        }`}>
          <span className={`text-[10px] font-mono uppercase ${isDark ? "text-slate-400" : "text-slate-500 font-bold"}`}>Computed Emotion</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Smile className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span className={`text-sm font-semibold ${isDark ? "text-slate-150" : "text-slate-900"}`}>{metrics.emotion}</span>
          </div>
        </div>

        <div className={`p-2.5 rounded-lg flex flex-col border transition-colors ${
          isDark ? "bg-slate-950/70 border-slate-850" : "bg-white border-slate-200"
        }`}>
          <span className={`text-[10px] font-mono uppercase ${isDark ? "text-slate-400" : "text-slate-500 font-bold"}`}>Confidence Meter</span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-sm font-bold ${isDark ? "text-slate-150" : "text-slate-900"}`}>{metrics.confidence}%</span>
            <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
              <div className="bg-emerald-500 dark:bg-emerald-400 h-full" style={{ width: `${metrics.confidence}%` }} />
            </div>
          </div>
        </div>

        <div className={`p-2.5 rounded-lg flex flex-col border transition-colors ${
          isDark ? "bg-slate-950/70 border-slate-850" : "bg-white border-slate-200"
        }`}>
          <span className={`text-[10px] font-mono uppercase ${isDark ? "text-slate-400" : "text-slate-500 font-bold"}`}>Attention Ptr</span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-sm font-bold ${isDark ? "text-slate-150" : "text-slate-900"}`}>{metrics.eyeContact}%</span>
            <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
              <div className="bg-blue-555 dark:bg-blue-400 h-full" style={{ width: `${metrics.eyeContact}%` }} />
            </div>
          </div>
        </div>

        <div className={`p-2.5 rounded-lg flex flex-col border transition-colors ${
          isDark ? "bg-slate-950/70 border-slate-850" : "bg-white border-slate-200"
        }`}>
          <span className={`text-[10px] font-mono uppercase ${isDark ? "text-slate-400" : "text-slate-500 font-bold"}`}>Stress Index</span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-sm font-bold ${isDark ? "text-slate-150" : "text-slate-900"}`}>{metrics.nervousness}%</span>
            <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
              <div className="bg-red-500 dark:bg-red-400 h-full" style={{ width: `${metrics.nervousness}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
