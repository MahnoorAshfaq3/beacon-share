import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SessionInfo from "../components/SessionInfo";
import ParticipantList from "../components/ParticipantList";
import TeacherControls from "../components/TeacherControls";
import SharePanel from "../components/SharePanel";
import Notification from "../components/Notification";
import { useSessionContext } from "../context/SessionContext";
import useSessionActions from "../hooks/useSession";
import useSessionRoom from "../hooks/useSessionRoom";
import useWebRTC from "../hooks/useWebRTC";

// Shown when the room is opened without an active session in context, e.g.
// a hard refresh in a browser that isn't persisting sessionStorage, or a
// direct link. Lets the visitor join as a student without losing the code
// that's already in the URL.
function RejoinPrompt({ sessionId }) {
  const { joinAsStudent } = useSessionActions();
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await joinAsStudent(sessionId, name.trim() || "Guest");
    } catch (err) {
      setError(err?.response?.data?.error || "Could not join that session.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-16">
        <form onSubmit={handleJoin} className="panel p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-display font-bold text-lg">Rejoin session {sessionId}</h2>
            <p className="text-sm text-muted mt-1">Your connection was reset. Enter your name to rejoin.</p>
          </div>
          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Joining..." : "Rejoin"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function SessionRoom() {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const { state } = useSessionContext();
  const code = (urlSessionId || "").toUpperCase();

  const active = state.sessionId === code;

  useSessionRoom(active);
  const webrtc = useWebRTC();

  useEffect(() => {
    if (!code) navigate("/");
  }, [code, navigate]);

  if (!active) {
    return <RejoinPrompt sessionId={code} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <span className="text-sm text-muted hidden sm:inline">
          {state.role === "teacher" ? "Teaching as" : "Viewing as"} <span className="text-ink/90 font-medium">{state.name}</span>
        </span>
      </Header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">
        <SessionInfo />
        {state.role === "teacher" ? <TeacherControls webrtc={webrtc} /> : <ParticipantList />}
        <SharePanel webrtc={webrtc} />
      </main>

      <Notification />
    </div>
  );
}
