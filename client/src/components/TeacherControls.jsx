import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionContext } from "../context/SessionContext";
import { getSocket } from "../services/socket";

export default function TeacherControls({ webrtc }) {
  const { state } = useSessionContext();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(state.sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function endSession() {
    if (!window.confirm("End this session for everyone? Students will be disconnected.")) return;
    if (webrtc.isSharing) webrtc.stopSharing();
    getSocket().emit("leave-session");
    navigate("/");
  }

  return (
    <div className="panel p-4 sm:p-5 flex flex-col gap-3">
      <p className="text-xs uppercase tracking-wider text-muted">Teacher controls</p>
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary text-sm" onClick={copyCode}>
          {copied ? "Copied!" : "Copy session ID"}
        </button>
        {!webrtc.isSharing ? (
          <button className="btn-primary text-sm" onClick={webrtc.startSharing}>
            Share screen
          </button>
        ) : (
          <button className="btn-danger text-sm" onClick={webrtc.stopSharing}>
            Stop sharing
          </button>
        )}
        <button className="btn-danger text-sm ml-auto" onClick={endSession}>
          End session
        </button>
      </div>
      <p className="text-xs text-muted">
        Participants: <span className="text-ink/90 font-medium">{state.participantCount}</span>
      </p>
    </div>
  );
}
