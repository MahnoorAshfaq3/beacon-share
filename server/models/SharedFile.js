const mongoose = require("mongoose");

const SharedFileSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  sender: { type: String, default: "Anonymous" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SharedFile", SharedFileSchema);
