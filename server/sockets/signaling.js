// All Socket.IO event handling lives here: session presence, text/link
// sharing, and WebRTC signaling relay for screen sharing.
//
// IMPORTANT: this file never touches video/screen data itself. It only
// passes small JSON signaling messages (SDP offers/answers and ICE
// candidates) between browsers so they can establish a *direct* WebRTC
// peer connection. The actual screen video always flows browser-to-browser.
const makeSessionStore = require("./sessionStore");

// socket.id -> { sessionId, role, name }
const socketMeta = new Map();

// `isUsingDb` is a function returning the current usingDb boolean (see
// server.js), not the boolean itself - the DB connection resolves async
// after this module is wired up.
function registerSignaling(io, isUsingDb) {
  const store = makeSessionStore(isUsingDb);

  io.on("connection", (socket) => {
    // ---- Session presence -------------------------------------------------

    socket.on("join-session", async ({ sessionId, name, role }, ack) => {
      try {
        sessionId = (sessionId || "").toString().trim().toUpperCase();
        const session = await store.getSession(sessionId);

        if (!session || session.status === "ended") {
          if (ack) ack({ error: "Session not found or has ended." });
          return;
        }

        socket.join(sessionId);
        socketMeta.set(socket.id, { sessionId, role, name: name || "Guest" });

        if (role === "teacher") {
          await store.setHostSocket(sessionId, socket.id);
        } else {
          await store.addParticipant(sessionId, {
            socketId: socket.id,
            name: name || "Guest",
            joinedAt: new Date(),
          });
        }

        const refreshed = await store.getSession(sessionId);

        if (ack) {
          ack({
            sessionId,
            screenSharing: !!refreshed.screenSharing,
            hostSocketId: refreshed.hostSocketId || null,
            participantCount: (refreshed.participants || []).length,
          });
        }

        socket.to(sessionId).emit("participant-joined", {
          socketId: socket.id,
          name: name || "Guest",
          role,
          participantCount: (refreshed.participants || []).length,
        });

        // If the teacher is already sharing their screen and a student joins
        // mid-class, ask the teacher to open a new peer connection just for
        // this student (mesh topology: one connection per viewer).
        if (role !== "teacher" && refreshed.screenSharing && refreshed.hostSocketId) {
          io.to(refreshed.hostSocketId).emit("student-wants-stream", {
            studentSocketId: socket.id,
            name: name || "Guest",
          });
        }
      } catch (err) {
        console.error("[socket] join-session error:", err.message);
        if (ack) ack({ error: "Could not join session." });
      }
    });

    // ---- Text / link sharing -----------------------------------------------

    socket.on("text-share", async ({ sessionId, text, sender }) => {
      if (!sessionId || !text || !text.toString().trim()) return;
      sessionId = sessionId.toString().trim().toUpperCase();
      const clean = text.toString().slice(0, 5000); // basic bound on payload size
      const saved = await store.saveContent(sessionId, "text", clean, sender || "Anonymous");
      io.to(sessionId).emit("text-shared", {
        id: saved._id,
        text: clean,
        sender: sender || "Anonymous",
        createdAt: saved.createdAt,
      });
    });

    socket.on("link-share", async ({ sessionId, url, sender }) => {
      if (!sessionId || !url) return;
      sessionId = sessionId.toString().trim().toUpperCase();

      let clean;
      try {
        clean = new URL(url.toString().trim()).toString();
      } catch {
        socket.emit("share-error", { message: "That doesn't look like a valid URL." });
        return;
      }

      const saved = await store.saveContent(sessionId, "link", clean, sender || "Anonymous");
      io.to(sessionId).emit("link-shared", {
        id: saved._id,
        url: clean,
        sender: sender || "Anonymous",
        createdAt: saved.createdAt,
      });
    });

    // ---- Screen sharing lifecycle -------------------------------------------

    socket.on("screen-share-start", async ({ sessionId }) => {
      sessionId = (sessionId || "").toString().trim().toUpperCase();
      const session = await store.setScreenSharing(sessionId, true);
      if (!session) return;

      io.to(sessionId).emit("screen-share-started", { hostSocketId: socket.id });

      // Prompt the teacher to create an offer for every student already in
      // the room (mesh: one RTCPeerConnection per viewer).
      const participants = session.participants || [];
      participants.forEach((p) => {
        socket.emit("student-wants-stream", { studentSocketId: p.socketId, name: p.name });
      });
    });

    socket.on("screen-share-stop", async ({ sessionId }) => {
      sessionId = (sessionId || "").toString().trim().toUpperCase();
      await store.setScreenSharing(sessionId, false);
      io.to(sessionId).emit("screen-share-ended");
    });

    // ---- WebRTC signaling relay (mesh: teacher <-> each student) -----------
    // Payloads only ever carry `to` (a socket id) so the server can route
    // point-to-point without needing to understand SDP/ICE contents.

    socket.on("webrtc-offer", ({ to, sdp }) => {
      if (!to) return;
      io.to(to).emit("webrtc-offer", { from: socket.id, sdp });
    });

    socket.on("webrtc-answer", ({ to, sdp }) => {
      if (!to) return;
      io.to(to).emit("webrtc-answer", { from: socket.id, sdp });
    });

    socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
      if (!to) return;
      io.to(to).emit("webrtc-ice-candidate", { from: socket.id, candidate });
    });

    // ---- Explicit leave + disconnect ----------------------------------------

    socket.on("leave-session", () => handleLeave(socket, io, store));
    socket.on("disconnect", () => handleLeave(socket, io, store));
  });
}

async function handleLeave(socket, io, store) {
  const meta = socketMeta.get(socket.id);
  if (!meta) return;
  socketMeta.delete(socket.id);

  const { sessionId, role, name } = meta;

  if (role === "teacher") {
    // Host left: end the screen share and let everyone know the teacher
    // disconnected. We intentionally do not delete the session so students
    // still see the shared history.
    await store.setScreenSharing(sessionId, false);
    await store.setHostSocket(sessionId, null);
    io.to(sessionId).emit("teacher-disconnected");
    io.to(sessionId).emit("screen-share-ended");
  } else {
    const session = await store.removeParticipant(sessionId, socket.id);
    io.to(sessionId).emit("participant-left", {
      socketId: socket.id,
      name,
      participantCount: session ? (session.participants || []).length : 0,
    });
  }
}

module.exports = registerSignaling;
