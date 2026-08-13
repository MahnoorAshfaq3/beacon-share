import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined;

// A single shared socket instance for the whole app. Created lazily
// (autoConnect: false) so we only open the connection once the user has
// actually created or joined a session.
let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
