import React, { useState } from "react";
import { useSessionContext } from "../context/SessionContext";
import ConnectionStatus from "./ConnectionStatus";

export default function SessionInfo() {
  const { state } = useSessionContext();
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(state.sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted mb-1">Session code</p>
        <button
          onClick={copyCode}
          className="font-display text-2xl sm:text-3xl font-bold tracking-[0.2em] text-signal hover:text-signal/80 transition-colors"
          title="Click to copy"
        >
          {state.sessionId}
        </button>
        {copied && <span className="ml-2 text-xs text-signal">Copied!</span>}
      </div>

      <div className="flex flex-col items-start sm:items-end gap-1.5">
        <ConnectionStatus status={state.connectionStatus} />
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${state.screenSharing ? "bg-warn animate-pulse-dot" : "bg-border"}`} />
          {state.screenSharing ? "Screen sharing active" : "Screen sharing off"}
        </div>
        <div className="text-xs text-muted">
          {state.role === "teacher" ? `${state.participantCount} participant${state.participantCount === 1 ? "" : "s"}` : `Teacher: ${state.teacherOnline ? "Online" : "Offline"}`}
        </div>
      </div>
    </div>
  );
}
