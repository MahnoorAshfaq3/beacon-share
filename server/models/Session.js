const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  hostSocketId: { type: String, default: null },
  hostName: { type: String, default: "Teacher" },
  participants: [
    {
      socketId: String,
      name: String,
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  screenSharing: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "ended"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
});

module.exports = mongoose.model("Session", SessionSchema);
