require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const sessionRoutes = require("./routes/sessionRoutes");
const fileRoutes = require("./routes/fileRoutes");
const errorHandler = require("./middleware/errorHandler");
const registerSignaling = require("./sockets");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const MONGO_URI = process.env.MONGO_URI;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.locals.io = io;
// Flipped to true below only if a real MongoDB connection succeeds.
// Everything else (controllers, socket handlers) reads this flag to decide
// whether to use Mongoose or the in-memory fallback store.
app.locals.usingDb = false;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: app.locals.usingDb ? "mongodb" : "in-memory" });
});

app.use("/api/session", sessionRoutes);
app.use("/api/files", fileRoutes);

// Basic 404 for unknown API routes
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

app.use(errorHandler);

// Pass a getter, not the boolean value, since MongoDB connects
// asynchronously below and app.locals.usingDb may flip after this call.
registerSignaling(io, () => app.locals.usingDb);

async function start() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      app.locals.usingDb = true;
      console.log("[db] Connected to MongoDB.");
    } catch (err) {
      console.warn("[db] Could not connect to MongoDB, falling back to in-memory store:", err.message);
      app.locals.usingDb = false;
    }
  } else {
    console.log("[db] MONGO_URI not set - using in-memory store.");
  }

  server.listen(PORT, () => {
    console.log(`[server] Beacon backend listening on port ${PORT}`);
    console.log(`[server] Accepting requests from ${CLIENT_URL}`);
  });
}

start();

module.exports = { app, server, io };
