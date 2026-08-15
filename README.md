# Beacon Share — Real-Time File, Text & Screen Sharing

Beacon Share is a full-stack real-time sharing web application inspired by AirForShare. It allows users to create or join a shared session using a short code and instantly exchange **text, links, and files** with other participants.
One person creates a session and gets a short code; everyone else enters that
code and instantly sees whatever the host shares — including their live screen.
This is an original project (name, visual identity, and code) inspired by
the general idea of tools like AirForShare. No branding, logos, or code from
any existing product were copied.

It also includes **live screen sharing using WebRTC**, allowing a user to share their screen with multiple participants directly through the browser.

## Live Demo
**Frontend:** https://beacon-share.netlify.app/
### ✨ Features

* 📤 Real-time text sharing
* 🔗 Link sharing
* 📁 File upload and download
* 🖥️ Live screen sharing with WebRTC
* 👥 Real-time participant presence
* 🔑 Session creation and joining with short codes
* ⚡ Real-time communication using Socket.IO
* 🗄️ MongoDB database integration
* 🔄 Automatic connection handling for users joining during an active screen share
* 📱 Responsive single-page interface

### 🛠️ Tech Stack

**Frontend:** React, Vite, CSS, TailwindCSS
**Backend:** Node.js, Express.js
**Database:** MongoDB Atlas
**Real-Time:** Socket.IO
**Screen Sharing:** WebRTC
**File Uploads:** Multer
**Deployment:** Frontend → Netlify, Backend → Render

### 🎯 Purpose

The project was built to provide a simple way for users to share content and screens in real time without requiring traditional file-sharing or screen-sharing software.
#


---

## Table of contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [Using the app](#using-the-app)
- [How screen sharing works (WebRTC)](#how-screen-sharing-works-webrtc)
- [Socket.IO signaling events](#socketio-signaling-events)
- [File sharing architecture](#file-sharing-architecture)
- [MongoDB setup](#mongodb-setup)
- [Security](#security)
- [STUN / TURN](#stun--turn)
- [Browser requirements](#browser-requirements)
- [Deployment](#deployment)
- [Testing scenario](#testing-scenario)
- [Future improvements](#future-improvements)

---

## Features

- Create a session and get a short, easy-to-read code (e.g. `AB3K9Q`)
- Join a session with that code
- Real-time text broadcasting to everyone in the session
- Real-time link sharing with URL validation
- File upload/download with progress, size limits, and type validation
- **Live WebRTC screen sharing** — the host shares their actual screen
  (not a video upload), and every connected viewer watches it live
- Automatic reconnection to an in-progress screen share for students who
  join after it's already started
- Real-time presence: join/leave notifications, participant count, teacher
  online/offline status
- Clear error handling for denied permissions, unsupported browsers, and
  dropped connections
- Responsive UI (desktop, tablet, mobile)

## Technology stack

**Frontend:** React, Vite, Tailwind CSS, Axios, React Router, Socket.IO
Client, native WebRTC APIs (`RTCPeerConnection`, `getDisplayMedia`).

**Backend:** Node.js, Express, Socket.IO, Multer (file uploads).

**Database:** MongoDB + Mongoose for session/content/file metadata. Actual
uploaded files are stored on local disk under `server/uploads/`, not in
MongoDB. If no MongoDB instance is available, the server automatically
falls back to an in-memory store so the app still runs for local testing —
see [MongoDB setup](#mongodb-setup).

## Architecture

Two data flows exist side by side:

**Normal sharing (text / link / files):**

```
Teacher/Student browser
        │ React UI
        ▼
  Axios (files)  or  Socket.IO (text/links)
        ▼
    Node.js / Express
        ▼
  MongoDB (metadata)  +  Local disk (file bytes)
        ▼
  Socket.IO broadcast to the session room
        ▼
Every other browser in the session
```

**Screen sharing:**

```
Teacher browser
        │ getDisplayMedia()
        ▼
    MediaStream
        │
        ▼
  RTCPeerConnection  ◄── one per connected student (mesh)
        │
        │  offer / answer / ICE candidates only
        ▼
   Socket.IO (signaling channel — Node.js relays these small
              JSON messages between browsers, nothing else)
        │
        ▼
  Student's RTCPeerConnection
        ▼
     <video> element (live)
```

**Why WebRTC instead of sending video through Express or Socket.IO?**
Express and Socket.IO are built for request/response and small message
passing — they're not designed to carry a continuous, high-bandwidth,
low-latency video stream, and doing so would route every frame through the
server, multiplying bandwidth costs and adding latency. WebRTC instead
negotiates a **direct peer-to-peer connection** between the two browsers
(with STUN helping them find each other through NAT); the server's only job
is to pass a handful of small signaling messages (the "offer", "answer",
and network candidates) so the two browsers know how to find each other.
Once that handshake is done, the video never touches the server at all.

## Project structure

```text
beacon/
  client/                      React frontend (Vite)
    src/
      components/              Header, SharePanel, ScreenShare, etc.
      pages/                   Landing, SessionRoom
      hooks/                   useSocket, useSession, useSessionRoom, useWebRTC
      services/                api.js (REST), socket.js (Socket.IO client)
      context/                 SessionContext (global session state)
      utils/                   formatBytes, timeAgo
      App.jsx
      main.jsx

  server/                      Node/Express backend
    controllers/                sessionController.js, fileController.js
    routes/                     sessionRoutes.js, fileRoutes.js
    models/                     Session.js, SharedFile.js, SharedContent.js
    middleware/                 upload.js (Multer config), errorHandler.js
    sockets/                    signaling.js (all Socket.IO/WebRTC events)
    utils/                      generateSessionId.js, store.js (in-memory fallback)
    uploads/                    uploaded files land here
    server.js

  package.json                 root convenience scripts (runs both together)
  README.md
```

## Installation

Requires **Node.js 18+**.

```bash
git clone <this-repo>
cd beacon
npm run install:all
```

That installs dependencies in both `server/` and `client/`. (You can also
`cd server && npm install` and `cd client && npm install` separately.)

## Environment variables

Copy the example files and adjust as needed:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/beacon-share
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE_MB=50
```

- `MONGO_URI` — leave it pointing at a local Mongo instance, point it at
  MongoDB Atlas, or leave it blank to run entirely on the in-memory
  fallback (data is lost on server restart in that mode).
- `CLIENT_URL` — used for CORS and Socket.IO origin checks.

**`client/.env`**

```env
VITE_SERVER_URL=
```

Leave this blank for local development — Vite's dev server proxies `/api`
and `/socket.io` to `http://localhost:5000` (see `client/vite.config.js`).
In production, set it to your deployed backend's URL.

## Running locally

Start both servers together from the project root:

```bash
npm run dev
```

Or run them separately in two terminals:

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

Open `http://localhost:5173`.

## Using the app

**Creating a session (teacher):**
1. Open the site, enter your name, click **Create session**.
2. Share the session code shown at the top with your class.
3. Use **Share screen** to start a live broadcast, or the Text/Files/Links
   tabs to share content.

**Joining a session (student):**
1. Open the site, enter the session code and your name, click **Join
   session**.
2. If the teacher is already sharing their screen, it connects
   automatically — no extra click needed.
3. Shared text, links, and files appear in their respective tabs.

## How screen sharing works (WebRTC)

1. The teacher clicks **Share screen**. The browser's native permission
   dialog appears (`navigator.mediaDevices.getDisplayMedia()`) — Beacon
   cannot start this without that explicit, browser-controlled prompt, and
   it never attempts to capture the screen silently.
2. Once granted, the client emits `screen-share-start` over Socket.IO.
3. The server marks the session as sharing and tells the teacher's client
   which students are already in the room.
4. For each student, the teacher's browser opens a new `RTCPeerConnection`,
   attaches the screen's `MediaStream`, creates an SDP offer, and sends it
   through the server to that student (`webrtc-offer`).
5. The student's browser answers (`webrtc-answer`), and both sides exchange
   ICE candidates (`webrtc-ice-candidate`) until a direct connection is
   established.
6. The student's `<video>` element receives the live stream via the
   connection's `ontrack` event.
7. If a student joins **after** sharing has already started, the server
   immediately tells the teacher's client to open a new connection for
   just that student — they connect automatically.
8. Clicking **Stop sharing** (or using the browser's own "Stop sharing"
   control) stops the tracks, closes every peer connection, and broadcasts
   `screen-share-ended` so every viewer sees a clear "Screen sharing has
   ended" state instead of a frozen frame.

This is a **mesh** topology: the teacher's browser has one direct
connection per viewer. That's simple and works well for a handful of
students. It does **not** scale well to large classes, because the
teacher's upload bandwidth is divided across every connection. For large
classrooms, the correct next step is a **Selective Forwarding Unit (SFU)**
such as [mediasoup](https://mediasoup.org/),
[LiveKit](https://livekit.io/), or [Janus](https://janus.conf.meetecho.com/)
— the teacher would send a single upstream connection to the SFU, and the
SFU fans the stream back out to every viewer server-side. The signaling
code here is isolated in `server/sockets/signaling.js` and the client's
`useWebRTC` hook specifically so that swap is localized to those two
places later.

## Socket.IO signaling events

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `join-session` | client → server | `{ sessionId, name, role }` | Join a session room |
| `participant-joined` / `participant-left` | server → room | `{ socketId, name, participantCount }` | Presence updates |
| `teacher-disconnected` | server → room | — | Host left the session |
| `text-share` / `text-shared` | client ↔ server | `{ sessionId, text, sender }` | Broadcast a text message |
| `link-share` / `link-shared` | client ↔ server | `{ sessionId, url, sender }` | Broadcast a validated link |
| `screen-share-start` / `screen-share-started` | client ↔ server | `{ sessionId }` | Begin a screen-share session |
| `screen-share-stop` / `screen-share-ended` | client ↔ server | `{ sessionId }` | End a screen-share session |
| `student-wants-stream` | server → teacher | `{ studentSocketId, name }` | Tells the host to open a new peer connection |
| `webrtc-offer` | client ↔ server ↔ client | `{ to, sdp }` | SDP offer relay |
| `webrtc-answer` | client ↔ server ↔ client | `{ to, sdp }` | SDP answer relay |
| `webrtc-ice-candidate` | client ↔ server ↔ client | `{ to, candidate }` | ICE candidate relay |

Note that file sharing does **not** go over Socket.IO for the upload
itself — it's a normal `multipart/form-data` POST to `/api/files/upload`.
The server then emits `file-shared` to the room so everyone sees it appear
without refreshing.

## File sharing architecture

- Client uploads via `POST /api/files/upload` (Multer, `multipart/form-data`).
- Multer validates file type against an allowlist and enforces a size limit
  (`MAX_FILE_SIZE_MB`, default 50MB).
- Files are written to `server/uploads/` under a server-generated unique
  name — the original filename is never trusted for storage, only for
  display and for the `Content-Disposition` header on download.
- Metadata (`SharedFile`) is saved to MongoDB (or the in-memory store) and
  broadcast to the room via Socket.IO.
- Downloads go through `GET /api/files/download/:storedName`, which
  validates the filename against a strict pattern before touching the
  filesystem.

## MongoDB setup

**Local:** install MongoDB Community Edition and run it on the default
port, then set `MONGO_URI=mongodb://127.0.0.1:27017/beacon-share`.

**Atlas (hosted):** create a free cluster at
[mongodb.com/atlas](https://www.mongodb.com/atlas), create a database user,
allow your IP (or `0.0.0.0/0` for quick testing), and copy the connection
string into `MONGO_URI`.

**No MongoDB at all:** leave `MONGO_URI` blank. The server logs
`[db] MONGO_URI not set - using in-memory store.` and runs normally —
useful for a quick local demo, but all sessions/content are lost on
restart and aren't shared across multiple server instances.

## Security

- Uploaded files are validated by MIME type and capped in size.
- Uploaded files are stored under server-generated names, never the
  client-supplied name, preventing overwrite/collision and any attempt at
  path traversal.
- Downloads validate the requested filename against a strict pattern
  before resolving it against the uploads directory.
- Shared URLs are parsed with the `URL` constructor and rejected if
  invalid.
- Session codes are validated against a strict pattern before any lookup.
- CORS is restricted to `CLIENT_URL`.
- Secrets and configuration live in `.env` (never committed — see
  `.gitignore`); `.env.example` documents what's required.
- Screen sharing can only ever be initiated by an explicit user click plus
  the browser's own native permission prompt.

## STUN / TURN

```js
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
```

- **STUN** helps two browsers behind NAT/firewalls discover a network path
  to reach each other directly.
- **TURN** relays media through a third-party server when a direct
  peer-to-peer path isn't possible (strict corporate firewalls, symmetric
  NAT). Google's public STUN server is enough for many home/office
  networks, but a production deployment serving varied networks should add
  a TURN server for reliability.
- Add TURN servers to the `iceServers` array in
  `client/src/hooks/useWebRTC.js` using environment-configured values —
  never hard-code TURN credentials into client source, since anything
  shipped to the browser is public.

## Browser requirements

- A modern Chromium-based browser (Chrome, Edge), Firefox, or Safari 13+.
- Screen sharing (`getDisplayMedia`) requires a **secure context**: either
  `localhost` (fine for local dev) or **HTTPS** in production. It will not
  work over plain HTTP on a non-localhost domain.
- Screen sharing always requires an explicit user gesture and browser
  permission prompt — this cannot be automated or bypassed, by design.

## Deployment

**Frontend:** deploy `client/` to Netlify or Vercel. Set `VITE_SERVER_URL`
to your backend's public URL as a build-time environment variable.

**Backend:** deploy `server/` to Render or Railway. Set `PORT`,
`MONGO_URI`, and `CLIENT_URL` (your deployed frontend's URL) as
environment variables there.

**Database:** MongoDB Atlas, connection string in `MONGO_URI`.

**Important:**
- The backend must be reachable over HTTPS/WSS in production for
  Socket.IO to work reliably and for the frontend (served over HTTPS) to
  be allowed to connect to it.
- `CLIENT_URL` on the backend must exactly match the frontend's deployed
  origin, or CORS/Socket.IO connections will be rejected.
- Screen sharing requires HTTPS on both ends (see Browser requirements).
- Consider adding a TURN server for production reliability across
  varied networks (see STUN / TURN above).

## Testing scenario

Open two browser windows (or two devices):

1. **Browser 1 (teacher):** create a session, note the code, click
   **Share screen**, choose "Entire Screen."
2. **Browser 2 (student):** join with that code. The screen should appear
   live within a couple seconds.
3. Send a text message from the teacher — it should appear instantly for
   the student.
4. Share a link — it should appear as a clickable link for the student.
5. Upload a file — the student should see it appear and be able to
   download it.
6. Click **Stop sharing** on the teacher's side — the student should see
   "Screen sharing has ended."
7. Close the student's tab — the teacher's participant count should drop.
8. Close the teacher's tab while still sharing — the student should see
   "Teacher disconnected."

## Future improvements

- Swap the mesh WebRTC topology for an SFU (mediasoup/LiveKit/Janus) to
  support large classes without taxing the teacher's upload bandwidth.
- Add authenticated teacher accounts and persistent class rosters.
- Add optional TURN server configuration out of the box for production.
- Add session expiry cleanup (a scheduled job removing `ended`/stale
  sessions and their uploaded files).
- Add chat-style read receipts / typing indicators.
