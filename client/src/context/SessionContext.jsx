import React, { createContext, useCallback, useContext, useReducer } from "react";

const SessionContext = createContext(null);

const initialState = {
  sessionId: null,
  role: null, // "teacher" | "student"
  name: "",
  hostName: "",
  connectionStatus: "disconnected", // disconnected | connecting | connected
  teacherOnline: true,
  participantCount: 0,
  screenSharing: false,
  content: [], // { id, kind: "text"|"link", value, sender, createdAt }
  files: [], // { id, originalName, storedName, mimeType, size, sender, createdAt }
  notifications: [], // { id, message }
};

function reducer(state, action) {
  switch (action.type) {
    case "ENTER_SESSION":
      return {
        ...initialState,
        sessionId: action.sessionId,
        role: action.role,
        name: action.name,
        hostName: action.hostName || "",
        connectionStatus: "connecting",
      };
    case "SET_CONNECTION_STATUS":
      return { ...state, connectionStatus: action.status };
    case "SET_SCREEN_SHARING":
      return { ...state, screenSharing: action.value };
    case "SET_PARTICIPANT_COUNT":
      return { ...state, participantCount: action.count };
    case "SET_TEACHER_ONLINE":
      return { ...state, teacherOnline: action.value };
    case "HYDRATE_HISTORY":
      return { ...state, content: action.content, files: action.files };
    case "ADD_CONTENT":
      return { ...state, content: [...state.content, action.item] };
    case "ADD_FILE":
      return { ...state, files: [...state.files, action.item] };
    case "NOTIFY": {
      const item = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, message: action.message };
      return { ...state, notifications: [...state.notifications.slice(-4), item] };
    }
    case "DISMISS_NOTIFY":
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const STORAGE_KEY = "beacon:session";

// Reads a previously entered session (sessionId/role/name) back out of
// sessionStorage so a page refresh on /session/:id doesn't lose who you are.
// Cleared automatically once the browser tab closes.
function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const persisted = loadPersisted();
    if (!persisted) return init;
    return { ...init, ...persisted, connectionStatus: "connecting" };
  });

  const notify = useCallback((message) => dispatch({ type: "NOTIFY", message }), []);

  React.useEffect(() => {
    if (state.sessionId && state.role) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sessionId: state.sessionId, role: state.role, name: state.name, hostName: state.hostName })
      );
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [state.sessionId, state.role, state.name, state.hostName]);

  return (
    <SessionContext.Provider value={{ state, dispatch, notify }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessionContext must be used within SessionProvider");
  return ctx;
}
