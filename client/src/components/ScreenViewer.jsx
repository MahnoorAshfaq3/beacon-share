import React, { useEffect, useRef, useState } from "react";
import { useSessionContext } from "../context/SessionContext";

// Student-side live viewer for the teacher's shared screen.
export default function ScreenViewer({ webrtc }) {
  const { state } = useSessionContext();
  const { remoteStream, peerState, screenError } = webrtc;
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }

  if (!state.screenSharing) {
    return (
      <div className="rounded-xl border border-border bg-surface-alt aspect-video flex items-center justify-center">
        <p className="text-sm text-muted px-4 text-center">
          {state.teacherOnline ? "No one is sharing their screen right now." : "Teacher disconnected."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {screenError && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{screenError}</p>
      )}

      <div ref={containerRef} className="relative rounded-xl overflow-hidden bg-black border border-border aspect-video">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />

        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-sm text-ink/80">Connecting to the teacher's screen...</p>
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          className="absolute bottom-3 right-3 btn-secondary text-xs py-1.5 px-3 bg-black/50 backdrop-blur border-white/20"
        >
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>

      <p className="text-xs text-muted">
        Connection: {peerState === "connected" ? "live" : peerState === "new" ? "connecting" : peerState}
      </p>
    </div>
  );
}
