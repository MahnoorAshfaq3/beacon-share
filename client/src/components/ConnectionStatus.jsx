import React from "react";

const CONFIG = {
  connected: { color: "bg-signal", label: "Connected" },
  connecting: { color: "bg-warn", label: "Connecting..." },
  disconnected: { color: "bg-danger", label: "Disconnected" },
};

export default function ConnectionStatus({ status }) {
  const cfg = CONFIG[status] || CONFIG.disconnected;
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${cfg.color} ${status === "connected" ? "animate-pulse-dot" : ""}`} />
      {cfg.label}
    </div>
  );
}
