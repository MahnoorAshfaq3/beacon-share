import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, joinSessionRequest } from "../services/api";
import { useSessionContext } from "../context/SessionContext";

// Landing-page actions: create a brand new session (teacher) or validate +
// enter an existing one (student). Both just prep context state and route
// into the room - the actual socket join happens in useSessionRoom once the
// room page mounts.
export default function useSessionActions() {
  const { dispatch, notify } = useSessionContext();
  const navigate = useNavigate();

  const startAsTeacher = useCallback(
    async (name) => {
      const data = await createSession(name || "Teacher");
      dispatch({
        type: "ENTER_SESSION",
        sessionId: data.sessionId,
        role: "teacher",
        name: name || "Teacher",
        hostName: data.hostName,
      });
      navigate(`/session/${data.sessionId}`);
    },
    [dispatch, navigate]
  );

  const joinAsStudent = useCallback(
    async (sessionId, name) => {
      const code = sessionId.trim().toUpperCase();
      const data = await joinSessionRequest(code);
      dispatch({
        type: "ENTER_SESSION",
        sessionId: data.sessionId,
        role: "student",
        name: name || "Guest",
        hostName: data.hostName,
      });
      navigate(`/session/${data.sessionId}`);
    },
    [dispatch, navigate]
  );

  return { startAsTeacher, joinAsStudent, notify };
}
