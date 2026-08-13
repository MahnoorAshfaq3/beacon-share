import React from "react";
import { useSessionContext } from "../context/SessionContext";

export default function ParticipantList() {
  const { state } = useSessionContext();

  return (
    <div className="panel p-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2 w-2 rounded-full bg-signal" />
        <span className="text-ink/90 font-medium">{state.participantCount}</span>
        <span className="text-muted">connected {state.participantCount === 1 ? "student" : "students"}</span>
      </div>
    </div>
  );
}
