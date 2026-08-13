import React from "react";
import { Link } from "react-router-dom";

export default function Header({ children }) {
  return (
    <header className="border-b border-border/70 bg-bg/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-signal/15 border border-signal/30">
            <span className="h-2.5 w-2.5 rounded-full bg-signal group-hover:animate-pulse-dot" />
          </span>
          <span className="font-display font-bold text-lg tracking-tight">Beacon</span>
        </Link>
        <div className="flex items-center gap-4">{children}</div>
      </div>
    </header>
  );
}
