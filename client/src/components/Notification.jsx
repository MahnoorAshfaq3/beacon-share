import React, { useEffect } from "react";
import { useSessionContext } from "../context/SessionContext";

function Toast({ item, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), 4500);
    return () => clearTimeout(t);
  }, [item.id, onDismiss]);

  return (
    <div className="panel px-4 py-3 text-sm flex items-start gap-3 animate-[fadeIn_.15s_ease-out]">
      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-signal shrink-0" />
      <span className="text-ink/90">{item.message}</span>
      <button
        onClick={() => onDismiss(item.id)}
        className="ml-auto text-muted hover:text-ink"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export default function Notification() {
  const { state, dispatch } = useSessionContext();
  const dismiss = (id) => dispatch({ type: "DISMISS_NOTIFY", id });

  if (state.notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {state.notifications.map((n) => (
        <Toast key={n.id} item={n} onDismiss={dismiss} />
      ))}
    </div>
  );
}
