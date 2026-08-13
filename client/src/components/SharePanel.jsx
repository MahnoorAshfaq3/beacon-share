import React, { useState } from "react";
import { useSessionContext } from "../context/SessionContext";
import TextShare from "./TextShare";
import LinkShare from "./LinkShare";
import FileShare from "./FileShare";
import ScreenShare from "./ScreenShare";
import ScreenViewer from "./ScreenViewer";

const TABS = [
  { key: "text", label: "Text" },
  { key: "files", label: "Files" },
  { key: "links", label: "Links" },
  { key: "screen", label: "Screen" },
];

export default function SharePanel({ webrtc }) {
  const { state } = useSessionContext();
  const [tab, setTab] = useState("text");

  return (
    <div className="panel p-4 sm:p-6 flex flex-col gap-5">
      <div className="flex gap-1.5 border-b border-border pb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`tab-btn ${tab === t.key ? "tab-btn-active" : "tab-btn-inactive"} relative`}
          >
            {t.label}
            {t.key === "screen" && state.screenSharing && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warn animate-pulse-dot" />
            )}
          </button>
        ))}
      </div>

      <div>
        {tab === "text" && <TextShare />}
        {tab === "links" && <LinkShare />}
        {tab === "files" && <FileShare />}
        {tab === "screen" && (state.role === "teacher" ? <ScreenShare webrtc={webrtc} /> : <ScreenViewer webrtc={webrtc} />)}
      </div>
    </div>
  );
}
