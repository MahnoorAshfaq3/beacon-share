import React, { useEffect, useRef } from "react";

// Teacher-side screen sharing panel: start/stop controls plus a local
// preview of exactly what students are currently seeing.
export default function ScreenShare({ webrtc }) {
  const { localStream, isSharing, viewerCount, screenError, startSharing, stopSharing } = webrtc;
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = localStream || null;
  }, [localStream]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {!isSharing ? (
          <button className="btn-primary" onClick={startSharing}>
            <span className="h-2 w-2 rounded-full bg-bg" />
            Share screen
          </button>
        ) : (
          <button className="btn-danger" onClick={stopSharing}>
            Stop sharing
          </button>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${isSharing ? "bg-warn animate-pulse-dot" : "bg-border"}`} />
          <span className="text-muted">{isSharing ? "Screen sharing active" : "Screen sharing off"}</span>
        </div>

        {isSharing && (
          <span className="text-xs text-muted ml-auto">
            {viewerCount} {viewerCount === 1 ? "student" : "students"} watching
          </span>
        )}
      </div>

      {screenError && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{screenError}</p>
      )}

      <div className="rounded-xl overflow-hidden bg-black border border-border aspect-video flex items-center justify-center">
        {isSharing ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
        ) : (
          <p className="text-sm text-muted px-4 text-center">
            Your shared screen preview will appear here once you start sharing.
          </p>
        )}
      </div>
    </div>
  );
}
