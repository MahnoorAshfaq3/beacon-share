import axios from "axios";

// In dev, VITE_SERVER_URL is empty and Vite's proxy (vite.config.js) forwards
// /api to the local backend. In production, set VITE_SERVER_URL to the
// deployed backend's origin.
const baseURL = import.meta.env.VITE_SERVER_URL || "";

const api = axios.create({ baseURL });

export async function createSession(hostName) {
  const { data } = await api.post("/api/session/create", { hostName });
  return data;
}

export async function joinSessionRequest(sessionId) {
  const { data } = await api.post("/api/session/join", { sessionId });
  return data;
}

export async function getSession(sessionId) {
  const { data } = await api.get(`/api/session/${sessionId}`);
  return data;
}

export async function uploadFile(sessionId, sender, file, onProgress) {
  const form = new FormData();
  form.append("sessionId", sessionId);
  form.append("sender", sender);
  form.append("file", file);

  const { data } = await api.post("/api/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return data;
}

export function downloadUrl(storedName) {
  return `${baseURL}/api/files/download/${storedName}`;
}

export default api;
