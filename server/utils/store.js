// In-memory fallback store.
//
// The app is designed to run against MongoDB (see models/), but it should
// also work out-of-the-box for local testing without a database. When
// MONGO_URI is not set or the connection fails, server.js flips
// `usingMemoryStore` to true and the controllers read/write through the
// simple in-memory maps below instead of Mongoose.
//
// This keeps the request-handling code in the controllers mostly agnostic
// of which backend is active.
const sessions = new Map(); // sessionId -> session object
const content = new Map(); // sessionId -> array of shared content items
const files = new Map(); // sessionId -> array of file metadata items

module.exports = { sessions, content, files };
