import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Maximize2, 
  Camera as CameraIcon, 
  Video, 
  Circle, 
  Crosshair,
  Sparkles,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { Camera, DetectionBox } from '../../types';
import { mockDetectionsByCamera } from '../../services/mockData';

interface LiveMonitorProps {
  selectedCamera: Camera;
  onSelectCamera: (camId: string) => void;
  availableCameras: Camera[];
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({
  selectedCamera,
  onSelectCamera,
  availableCameras,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  // Default to the live AI detection stream so the frontend shows real detections immediately.
  const [streamMode, setStreamMode] = useState<'LIVE_WEBCAM' | 'LIVE_SCREEN' | 'BACKEND_STREAM' | 'SIMULATED_CCTV'>('BACKEND_STREAM');
  const [showAiBoxes, setShowAiBoxes] = useState<boolean>(true);
  const [showTacticalGrid, setShowTacticalGrid] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Time ticker
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toISOString().replace('T', ' ').substring(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Request & Start Laptop Live Camera Stream Immediately On Mount
  const startCamera = async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('[RAKSHAK] Local camera access error:', err);
      setWebcamError(
        err.name === 'NotAllowedError'
          ? 'Camera access was not permitted. Click "Grant Permission" below.'
          : 'Could not connect to laptop camera hardware.'
      );
      setIsCameraActive(false);
    }
  };

  // Request & Start Laptop Screen Share
  const startScreenShare = async () => {
    try {
      setWebcamError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setIsCameraActive(true);
      // If user stops sharing via browser UI, switch back
      stream.getVideoTracks()[0].onended = () => {
        setStreamMode('LIVE_WEBCAM');
      };
    } catch (err) {
      console.warn('[RAKSHAK] Screen share cancelled:', err);
      setStreamMode('LIVE_WEBCAM');
    }
  };

  // Lifecycle effect to manage video source based on streamMode
  useEffect(() => {
    const stopTracks = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    };

    if (streamMode === 'LIVE_WEBCAM' && isPlaying) {
      startCamera();
    } else if (streamMode === 'LIVE_SCREEN' && isPlaying) {
      startScreenShare();
    } else {
      stopTracks();
    }

    return () => {
      stopTracks();
    };
  }, [streamMode, isPlaying]);

  const activeDetections: DetectionBox[] = mockDetectionsByCamera[selectedCamera.id] || mockDetectionsByCamera['cam-01'];

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => alert(err.message));
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleSnapshot = () => {
    alert(`[RAKSHAK Forensics] Live video evidence snapshot captured at ${currentTime}.`);
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg bg-[#0a0f18] border border-[#1e2a3e] overflow-hidden flex flex-col shadow-2xl"
    >
      {/* CCTV Top Header Bar */}
      <div className="h-10 bg-[#0d1422] border-b border-[#1c273b] px-4 flex items-center justify-between z-10 text-xs">
        <div className="flex items-center gap-3">
          {/* Camera Selection Dropdown */}
          <select
            value={selectedCamera.id}
            onChange={(e) => onSelectCamera(e.target.value)}
            className="bg-[#141e30] border border-[#23354d] text-cyan-300 font-bold rounded px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-400 font-mono"
          >
            {availableCameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.code} - {cam.name}
              </option>
            ))}
          </select>

          <span className="hidden sm:inline-block text-slate-400 font-mono text-[11px]">
            {selectedCamera.location}
          </span>
        </div>

        {/* Stream Source Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="flex rounded bg-[#131d2e] p-0.5 border border-[#23354d]">
            {/* Laptop Camera (Default immediately) */}
            <button
              onClick={() => setStreamMode('LIVE_WEBCAM')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                streamMode === 'LIVE_WEBCAM'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Laptop Live Camera Feed"
            >
              <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400 animate-pulse" />
              <span>Laptop Camera</span>
            </button>

            {/* Laptop Screen Share */}
            <button
              onClick={() => setStreamMode('LIVE_SCREEN')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                streamMode === 'LIVE_SCREEN'
                  ? 'bg-sky-950 text-sky-300 border border-sky-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live Laptop Screen Capture"
            >
              <Monitor className="w-3 h-3" />
              <span>Live Screen</span>
            </button>

            {/* Python Backend AI Stream */}
            <button
              onClick={() => setStreamMode('BACKEND_STREAM')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                streamMode === 'BACKEND_STREAM'
                  ? 'bg-purple-950 text-purple-300 border border-purple-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Python YOLO Stream (/api/stream/live)"
            >
              AI Stream
            </button>

            {/* Simulated Demo Feed */}
            <button
              onClick={() => setStreamMode('SIMULATED_CCTV')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                streamMode === 'SIMULATED_CCTV'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Simulated CCTV Gate"
            >
              CCTV Sim
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main Video Display Area */}
      <div className="relative w-full aspect-video bg-[#05080e] overflow-hidden flex items-center justify-center select-none">
        {/* Mode 1 & 2: Live Laptop Camera / Laptop Screen Share */}
        {streamMode === 'LIVE_WEBCAM' || streamMode === 'LIVE_SCREEN' ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {webcamError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center bg-[#0a0f18]">
                <Video className="w-12 h-12 text-amber-400/80" />
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-200 block">
                    Laptop Camera Authorization Required
                  </span>
                  <span className="text-xs max-w-sm text-slate-400 block">{webcamError}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold transition-colors shadow-lg"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Grant Camera Access</span>
                  </button>
                  <button
                    onClick={() => setStreamMode('SIMULATED_CCTV')}
                    className="px-3 py-1.5 bg-[#141e30] border border-[#22334c] text-slate-300 rounded text-xs font-medium"
                  >
                    Switch to Simulation
                  </button>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]" // mirror laptop camera for natural feel
              />
            )}
          </div>
        ) : streamMode === 'BACKEND_STREAM' ? (
          /* Mode 3: Live AI MJPEG Stream from Python Backend */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src="/api/stream/live"
              alt="Rakshak Live AI Stream"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1.5 rounded border border-purple-800/60 text-purple-300 text-[11px] font-mono">
              [RAKSHAK ENGINE] Backend MJPEG Stream Active
            </div>
          </div>
        ) : (
          /* Mode 4: Simulated Realistic CCTV Atmosphere */
          <div className="relative w-full h-full bg-[#0b121e] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-0" />
            <div className="absolute inset-0 surveillance-grid opacity-30" />
            <div className="relative z-0 opacity-40 flex flex-col items-center justify-center text-center">
              <Crosshair className="w-24 h-24 text-cyan-800/40 animate-spin" style={{ animationDuration: '60s' }} />
              <span className="text-xs font-mono text-cyan-700/60 mt-2 tracking-widest">
                SURVEILLANCE FEED // {selectedCamera.name.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Tactical Crosshair Center & Corner Brackets */}
        {showTacticalGrid && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-500/70" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-500/70" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-500/70" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-500/70" />

            <div className="absolute inset-0 flex items-center justify-center opacity-25">
              <div className="w-16 h-16 border border-cyan-400 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* AI Computer Vision Bounding Boxes Overlay */}
        {showAiBoxes && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {activeDetections.map((box) => {
              const isWeapon = box.category === 'WEAPON';
              const isNormal = box.category === 'NORMAL_OBJECT';

              const borderColor = isWeapon ? 'border-rose-500' : isNormal ? 'border-emerald-400' : 'border-cyan-400';
              const badgeBg = isWeapon
                ? 'bg-rose-950/90 text-rose-300 border-rose-700'
                : isNormal
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                : 'bg-cyan-950/90 text-cyan-300 border-cyan-700';

              return (
                <div
                  key={box.id}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                  className={`absolute border-2 ${borderColor} transition-all duration-300 ${
                    isWeapon ? 'shadow-lg shadow-rose-900/50 animate-pulse' : ''
                  }`}
                >
                  {/* Tag Header */}
                  <div
                    className={`absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border shadow-md whitespace-nowrap ${badgeBg}`}
                  >
                    <span>{box.label}</span>
                    <span className="opacity-80">{(box.confidence * 100).toFixed(0)}%</span>
                  </div>

                  {box.statusTag && (
                    <div className="absolute -bottom-5 right-0 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold bg-black/80 text-slate-200 border border-slate-700">
                      {box.statusTag}
                    </div>
                  )}

                  <span className={`w-1.5 h-1.5 rounded-full absolute -top-1 -left-1 ${isWeapon ? 'bg-rose-400' : isNormal ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full absolute -top-1 -right-1 ${isWeapon ? 'bg-rose-400' : isNormal ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full absolute -bottom-1 -left-1 ${isWeapon ? 'bg-rose-400' : isNormal ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full absolute -bottom-1 -right-1 ${isWeapon ? 'bg-rose-400' : isNormal ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                </div>
              );
            })}
          </div>
        )}

        {/* Live Telemetry Overlay in Corners */}
        <div className="absolute top-3 left-3 z-20 flex flex-col font-mono text-[11px] text-slate-300 bg-black/60 px-2.5 py-1.5 rounded border border-white/10 backdrop-blur-sm pointer-events-none">
          <div className="font-bold text-cyan-400">
            {streamMode === 'LIVE_WEBCAM'
              ? 'LOCAL // LAPTOP CAMERA'
              : streamMode === 'LIVE_SCREEN'
              ? 'LOCAL // LAPTOP LIVE SCREEN'
              : `${selectedCamera.code} // ${selectedCamera.name}`}
          </div>
          <div className="text-[10px] text-slate-400">
            FPS: {selectedCamera.fps} | 1920x1080 | RECV: ACTIVE
          </div>
        </div>

        <div className="absolute bottom-3 right-3 z-20 font-mono text-[11px] text-slate-300 bg-black/60 px-2.5 py-1.5 rounded border border-white/10 backdrop-blur-sm pointer-events-none">
          {currentTime}
        </div>
      </div>

      {/* CCTV Bottom Control Toolbar (Silent Ops - No loud alarm sound) */}
      <div className="h-11 bg-[#0b111c] border-t border-[#1c273b] px-4 flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded bg-[#131d2e] border border-[#22334c] text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            title={isPlaying ? 'Pause Feed' : 'Resume Feed'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Snapshot Button */}
          <button
            onClick={handleSnapshot}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#131d2e] border border-[#22334c] text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            title="Capture Evidence Snapshot"
          >
            <CameraIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Snapshot</span>
          </button>

          <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 hidden sm:inline-block">
            SILENT OPS MODE (Alarm Audio Suppressed)
          </span>
        </div>

        {/* Right Toggle Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle AI Bounding Boxes */}
          <button
            onClick={() => setShowAiBoxes(!showAiBoxes)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
              showAiBoxes
                ? 'bg-cyan-950/70 border-cyan-800/60 text-cyan-300'
                : 'bg-[#131d2e] border-[#22334c] text-slate-400'
            }`}
            title="Toggle Neural Bounding Boxes"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Vision</span>
          </button>

          {/* Toggle Tactical Grid */}
          <button
            onClick={() => setShowTacticalGrid(!showTacticalGrid)}
            className={`p-1.5 rounded border transition-colors ${
              showTacticalGrid
                ? 'bg-cyan-950/70 border-cyan-800/60 text-cyan-300'
                : 'bg-[#131d2e] border-[#22334c] text-slate-400'
            }`}
            title="Toggle Reticle Overlay"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded bg-[#131d2e] border border-[#22334c] text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            title="Fullscreen Monitor"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
