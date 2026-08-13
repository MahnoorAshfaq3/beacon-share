// Thin data-access layer shared by the Socket.IO handlers. Mirrors the same
// dual-mode (MongoDB / in-memory) approach used by the REST controllers so
// the realtime code doesn't need to know which one is active.
const Session = require("../models/Session");
const SharedContent = require("../models/SharedContent");
const memory = require("../utils/store");

// `isUsingDb` is a function (not a boolean) so the store always reflects the
// current state of app.locals.usingDb, even though it's constructed once at
// server startup before the async MongoDB connection attempt resolves.
function makeSessionStore(isUsingDb) {
  return {
    async getSession(sessionId) {
      if (isUsingDb()) return Session.findOne({ sessionId });
      return memory.sessions.get(sessionId) || null;
    },

    async addParticipant(sessionId, participant) {
      if (isUsingDb()) {
        return Session.findOneAndUpdate(
          { sessionId },
          { $push: { participants: participant } },
          { new: true }
        );
      }
      const session = memory.sessions.get(sessionId);
      if (!session) return null;
      session.participants.push(participant);
      return session;
    },

    async removeParticipant(sessionId, socketId) {
      if (isUsingDb()) {
        return Session.findOneAndUpdate(
          { sessionId },
          { $pull: { participants: { socketId } } },
          { new: true }
        );
      }
      const session = memory.sessions.get(sessionId);
      if (!session) return null;
      session.participants = session.participants.filter((p) => p.socketId !== socketId);
      return session;
    },

    async setHostSocket(sessionId, socketId) {
      if (isUsingDb()) {
        return Session.findOneAndUpdate({ sessionId }, { hostSocketId: socketId }, { new: true });
      }
      const session = memory.sessions.get(sessionId);
      if (!session) return null;
      session.hostSocketId = socketId;
      return session;
    },

    async setScreenSharing(sessionId, value) {
      if (isUsingDb()) {
        return Session.findOneAndUpdate({ sessionId }, { screenSharing: value }, { new: true });
      }
      const session = memory.sessions.get(sessionId);
      if (!session) return null;
      session.screenSharing = value;
      return session;
    },

    async endSession(sessionId) {
      if (isUsingDb()) {
        return Session.findOneAndUpdate({ sessionId }, { status: "ended", screenSharing: false }, { new: true });
      }
      const session = memory.sessions.get(sessionId);
      if (!session) return null;
      session.status = "ended";
      session.screenSharing = false;
      return session;
    },

    async saveContent(sessionId, type, content, sender) {
      const record = { sessionId, type, content, sender, createdAt: new Date() };
      if (isUsingDb()) return SharedContent.create(record);
      const list = memory.content.get(sessionId) || [];
      const saved = { _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...record };
      list.push(saved);
      memory.content.set(sessionId, list);
      return saved;
    },
  };
}

module.exports = makeSessionStore;
