import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

// Owns the lifetime of the shared Socket.IO connection for the current
// browser tab. Connects once when a session becomes active and disconnects
// on unmount so we don't leak sockets between sessions.
export default function useSocket(active) {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (active && !socket.connected) {
      socket.connect();
    }
    return () => {
      if (!active) return;
      socket.disconnect();
    };
  }, [active]);

  return socketRef.current;
}
