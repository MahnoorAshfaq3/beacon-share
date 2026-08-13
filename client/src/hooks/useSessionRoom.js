import { useEffect, useRef } from "react";
import useSocket from "./useSocket";
import { useSessionContext } from "../context/SessionContext";
import { getSession } from "../services/api";

// Wires the shared socket to the SessionContext for whichever session/role
// is currently active. Mount this exactly once, at the top of the room page.
export default function useSessionRoom(active) {
  const { state, dispatch, notify } = useSessionContext();
  const { sessionId, role, name } = state;
  const socket = useSocket(!!sessionId && active);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!active || !sessionId || !socket) return;
    joinedRef.current = false;

    // Load prior shared content/files so a student who joins mid-class sees
    // what already happened.
    getSession(sessionId)
      .then((data) => {
        dispatch({
          type: "HYDRATE_HISTORY",
          content: (data.content || []).map((c) => ({
            id: c._id || c.id,
            kind: c.type,
            value: c.content,
            sender: c.sender,
            createdAt: c.createdAt,
          })),
          files: (data.files || []).map((f) => ({
            id: f._id || f.id,
            originalName: f.originalName,
            storedName: f.storedName,
            mimeType: f.mimeType,
            size: f.size,
            sender: f.sender,
            createdAt: f.createdAt,
          })),
        });
        dispatch({ type: "SET_SCREEN_SHARING", value: !!data.screenSharing });
        dispatch({ type: "SET_PARTICIPANT_COUNT", count: data.participantCount || 0 });
      })
      .catch(() => {
        /* Non-fatal: the socket join below will still surface a clear error. */
      });

    function doJoin() {
      socket.emit("join-session", { sessionId, name, role }, (res) => {
        if (res && res.error) {
          dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
          notify(res.error);
          return;
        }
        joinedRef.current = true;
        dispatch({ type: "SET_CONNECTION_STATUS", status: "connected" });
        if (res) {
          dispatch({ type: "SET_SCREEN_SHARING", value: !!res.screenSharing });
          dispatch({ type: "SET_PARTICIPANT_COUNT", count: res.participantCount || 0 });
        }
      });
    }

    if (socket.connected) doJoin();
    socket.on("connect", doJoin);

    socket.on("disconnect", () => {
      dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
    });

    socket.on("participant-joined", (p) => {
      dispatch({ type: "SET_PARTICIPANT_COUNT", count: p.participantCount });
      if (p.role !== "teacher") notify(`${p.name} joined the session.`);
    });

    socket.on("participant-left", (p) => {
      dispatch({ type: "SET_PARTICIPANT_COUNT", count: p.participantCount });
      notify(`${p.name} left the session.`);
    });

    socket.on("teacher-disconnected", () => {
      dispatch({ type: "SET_TEACHER_ONLINE", value: false });
      notify("Teacher disconnected.");
    });

    socket.on("text-shared", (item) => {
      dispatch({
        type: "ADD_CONTENT",
        item: { id: item.id, kind: "text", value: item.text, sender: item.sender, createdAt: item.createdAt },
      });
    });

    socket.on("link-shared", (item) => {
      dispatch({
        type: "ADD_CONTENT",
        item: { id: item.id, kind: "link", value: item.url, sender: item.sender, createdAt: item.createdAt },
      });
    });

    socket.on("file-shared", (item) => {
      dispatch({ type: "ADD_FILE", item });
    });

    socket.on("share-error", (err) => notify(err.message));

    socket.on("screen-share-started", () => {
      dispatch({ type: "SET_SCREEN_SHARING", value: true });
      if (role !== "teacher") notify("Teacher is sharing their screen.");
    });

    socket.on("screen-share-ended", () => {
      dispatch({ type: "SET_SCREEN_SHARING", value: false });
      if (role !== "teacher") notify("Screen sharing has ended.");
    });

    return () => {
      socket.off("connect", doJoin);
      socket.off("disconnect");
      socket.off("participant-joined");
      socket.off("participant-left");
      socket.off("teacher-disconnected");
      socket.off("text-shared");
      socket.off("link-shared");
      socket.off("file-shared");
      socket.off("share-error");
      socket.off("screen-share-started");
      socket.off("screen-share-ended");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, active]);

  return { socket };
}
