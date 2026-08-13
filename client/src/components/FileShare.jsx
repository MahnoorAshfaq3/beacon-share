import React, { useRef, useState } from "react";
import { useSessionContext } from "../context/SessionContext";
import { uploadFile, downloadUrl } from "../services/api";
import { formatBytes, timeAgo } from "../utils/format";

const MAX_MB = 50;

export default function FileShare() {
  const { state, notify } = useSessionContext();
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList) {
    const file = fileList[0];
    if (!file) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      notify(`"${file.name}" is larger than the ${MAX_MB}MB limit.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      await uploadFile(state.sessionId, state.name, file, setProgress);
      // The server also broadcasts "file-shared" over the socket, which is
      // what actually adds it to everyone's feed (including ours).
    } catch (err) {
      notify(err?.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl border-2 border-dashed border-border hover:border-signal/50 transition-colors px-4 py-8 text-center cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip,.txt,.csv"
        />
        {uploading ? (
          <div className="max-w-xs mx-auto">
            <p className="text-sm text-ink/80 mb-2">Uploading... {progress}%</p>
            <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
              <div className="h-full bg-signal transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink/80">Click to choose a file, or drag one here</p>
            <p className="text-xs text-muted mt-1">PDF, Office docs, images, ZIP, TXT — up to {MAX_MB}MB</p>
          </>
        )}
      </div>

      <div className="feed flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        {state.files.length === 0 && <p className="text-sm text-muted py-6 text-center">No files shared yet.</p>}
        {state.files
          .slice()
          .reverse()
          .map((f) => (
            <div key={f.id} className="rounded-xl bg-surface-alt border border-border px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-signal/15 border border-signal/30 flex items-center justify-center text-signal text-xs font-bold shrink-0">
                {(f.originalName.split(".").pop() || "").slice(0, 3).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink/90 truncate">{f.originalName}</p>
                <p className="text-xs text-muted">
                  {f.sender} · {formatBytes(f.size)} · {timeAgo(f.createdAt)}
                </p>
              </div>
              <a href={downloadUrl(f.storedName)} className="btn-secondary text-xs py-2 px-3 shrink-0" download>
                Download
              </a>
            </div>
          ))}
      </div>
    </div>
  );
}
