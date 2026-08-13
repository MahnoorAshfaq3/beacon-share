const Session = require("../models/Session");
const SharedContent = require("../models/SharedContent");
const SharedFile = require("../models/SharedFile");
const generateSessionId = require("../utils/generateSessionId");
const memory = require("../utils/store");

const SESSION_ID_PATTERN = /^[A-Z0-9]{4,8}$/;

function usingDb(req) {
  return req.app.locals.usingDb === true;
}

// Create a new session and return its short code.
async function createSession(req, res, next) {
  try {
    const hostName = (req.body.hostName || "Teacher").toString().slice(0, 60);

    let sessionId = generateSessionId();

    if (usingDb(req)) {
      // Regenerate on the rare collision instead of trusting randomness blindly.
      while (await Session.exists({ sessionId })) {
        sessionId = generateSessionId();
      }
      const session = await Session.create({ sessionId, hostName });
      return res.status(201).json({ sessionId: session.sessionId, hostName: session.hostName });
    }

    while (memory.sessions.has(sessionId)) sessionId = generateSessionId();
    const session = {
      sessionId,
      hostName,
      hostSocketId: null,
      participants: [],
      screenSharing: false,
      status: "active",
      createdAt: new Date(),
    };
    memory.sessions.set(sessionId, session);
    memory.content.set(sessionId, []);
    memory.files.set(sessionId, []);
    return res.status(201).json({ sessionId, hostName });
  } catch (err) {
    next(err);
  }
}

// Validate that a session code exists and is still active before a student
// tries to join via Socket.IO.
async function joinSession(req, res, next) {
  try {
    const sessionId = (req.body.sessionId || "").toString().trim().toUpperCase();

    if (!SESSION_ID_PATTERN.test(sessionId)) {
      return res.status(400).json({ error: "Enter a valid session code." });
    }

    if (usingDb(req)) {
      const session = await Session.findOne({ sessionId });
      if (!session || session.status !== "active") {
        return res.status(404).json({ error: "Session not found or has ended." });
      }
      return res.json({ sessionId: session.sessionId, hostName: session.hostName, screenSharing: session.screenSharing });
    }

    const session = memory.sessions.get(sessionId);
    if (!session || session.status !== "active") {
      return res.status(404).json({ error: "Session not found or has ended." });
    }
    return res.json({ sessionId: session.sessionId, hostName: session.hostName, screenSharing: session.screenSharing });
  } catch (err) {
    next(err);
  }
}

// Fetch a session's current state plus its shared content/file history, so a
// student who joins mid-class sees what was already shared.
async function getSession(req, res, next) {
  try {
    const sessionId = (req.params.id || "").toString().trim().toUpperCase();

    if (usingDb(req)) {
      const session = await Session.findOne({ sessionId });
      if (!session) return res.status(404).json({ error: "Session not found." });
      const [content, files] = await Promise.all([
        SharedContent.find({ sessionId }).sort({ createdAt: 1 }).limit(200),
        SharedFile.find({ sessionId }).sort({ createdAt: 1 }).limit(200),
      ]);
      return res.json({
        sessionId: session.sessionId,
        hostName: session.hostName,
        screenSharing: session.screenSharing,
        status: session.status,
        participantCount: session.participants.length,
        content,
        files,
      });
    }

    const session = memory.sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found." });
    return res.json({
      sessionId: session.sessionId,
      hostName: session.hostName,
      screenSharing: session.screenSharing,
      status: session.status,
      participantCount: session.participants.length,
      content: memory.content.get(sessionId) || [],
      files: memory.files.get(sessionId) || [],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSession, joinSession, getSession };
