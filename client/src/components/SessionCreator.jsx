import React, { useState } from "react";
import useSessionActions from "../hooks/useSession";

export default function SessionCreator() {
  const { startAsTeacher } = useSessionActions();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await startAsTeacher(name.trim() || "Teacher");
    } catch {
      setError("Could not create a session. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="panel p-6 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-bold text-lg">Start a session</h2>
        <p className="text-sm text-muted mt-1">Create a session and share the code with your class.</p>
      </div>
      <input
        className="input"
        placeholder="Your name (e.g. Ms. Alvarez)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Creating..." : "Create session"}
      </button>
    </form>
  );
}
