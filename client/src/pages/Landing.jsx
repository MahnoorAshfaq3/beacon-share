import React from "react";
import Header from "../components/Header";
import SessionCreator from "../components/SessionCreator";
import SessionJoiner from "../components/SessionJoiner";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-signal bg-signal/10 border border-signal/30 rounded-full px-3 py-1 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse-dot" />
            LIVE SCREEN SHARING BUILT IN
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Share your screen, text, files and links — instantly.
          </h1>
          <p className="text-muted text-base sm:text-lg">
            Start a session, hand out the code, and your class sees everything you share the moment you share it.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <SessionCreator />
          <SessionJoiner />
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm text-muted">
          <div className="panel p-4">
            <p className="text-ink/90 font-semibold mb-1">1. Create or join</p>
            One person starts a session, everyone else enters the code.
          </div>
          <div className="panel p-4">
            <p className="text-ink/90 font-semibold mb-1">2. Share anything</p>
            Text, links and files land instantly for everyone in the room.
          </div>
          <div className="panel p-4">
            <p className="text-ink/90 font-semibold mb-1">3. Go live</p>
            The teacher shares their screen and students watch in real time.
          </div>
        </div>
      </main>
    </div>
  );
}
