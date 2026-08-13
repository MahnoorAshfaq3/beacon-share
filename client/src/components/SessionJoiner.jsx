import React, { useState } from "react";
import useSessionActions from "../hooks/useSession";

export default function SessionJoiner() {
  const { joinAsStudent } = useSessionActions();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleJoin(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await joinAsStudent(code, name.trim() || "Guest");
    } catch (err) {
      setError(err?.response?.data?.error || "Could not join that session.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className="panel p-6 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-bold text-lg">Join a session</h2>
        <p className="text-sm text-muted mt-1">Enter the session code your teacher gave you.</p>
      </div>
      <input
        className="input uppercase tracking-widest text-center font-display font-semibold"
        placeholder="ABC123"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={8}
      />
      <input
        className="input"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading || !code.trim()}>
        {loading ? "Joining..." : "Join session"}
      </button>
    </form>
  );
}
