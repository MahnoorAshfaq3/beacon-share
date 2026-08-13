import React, { useState } from "react";
import { useSessionContext } from "../context/SessionContext";
import { getSocket } from "../services/socket";

function timeAgo(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TextShare() {
  const { state } = useSessionContext();
  const [text, setText] = useState("");
  const socket = getSocket();

  const items = state.content.filter((c) => c.kind === "text");

  function send() {
    const value = text.trim();
    if (!value) return;
    socket.emit("text-share", { sessionId: state.sessionId, text: value, sender: state.name });
    setText("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          className="input min-h-[44px] resize-y flex-1"
          rows={2}
          placeholder="Type a message to broadcast to everyone in this session..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="btn-primary shrink-0" onClick={send} disabled={!text.trim()}>
          Send
        </button>
      </div>

      <div className="feed flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        {items.length === 0 && <p className="text-sm text-muted py-6 text-center">No messages yet. Say something!</p>}
        {items
          .slice()
          .reverse()
          .map((item) => (
            <div key={item.id} className="rounded-xl bg-surface-alt border border-border px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-signal">{item.sender}</span>
                <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
              </div>
              <p className="text-sm text-ink/90 whitespace-pre-wrap break-words">{item.value}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
