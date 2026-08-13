import React, { useState } from "react";
import { useSessionContext } from "../context/SessionContext";
import { getSocket } from "../services/socket";

function timeAgo(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function LinkShare() {
  const { state, notify } = useSessionContext();
  const [url, setUrl] = useState("");
  const socket = getSocket();

  const items = state.content.filter((c) => c.kind === "link");

  function send() {
    const value = url.trim();
    if (!value) return;
    if (!isValidUrl(value)) {
      notify("Enter a valid link starting with http:// or https://");
      return;
    }
    socket.emit("link-share", { sessionId: state.sessionId, url: value, sender: state.name });
    setUrl("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="input flex-1"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn-primary shrink-0" onClick={send} disabled={!url.trim()}>
          Share link
        </button>
      </div>

      <div className="feed flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        {items.length === 0 && <p className="text-sm text-muted py-6 text-center">No links shared yet.</p>}
        {items
          .slice()
          .reverse()
          .map((item) => (
            <div key={item.id} className="rounded-xl bg-surface-alt border border-border px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-signal">{item.sender}</span>
                <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
              </div>
              <a
                href={item.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink underline decoration-signal/40 underline-offset-2 hover:text-signal break-all"
              >
                {item.value}
              </a>
            </div>
          ))}
      </div>
    </div>
  );
}
