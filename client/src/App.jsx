import React from "react";
import { Routes, Route } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import Landing from "./pages/Landing";
import SessionRoom from "./pages/SessionRoom";

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/session/:sessionId" element={<SessionRoom />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </SessionProvider>
  );
}
