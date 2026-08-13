const mongoose = require("mongoose");

const SharedContentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  type: { type: String, enum: ["text", "link"], required: true },
  content: { type: String, required: true },
  sender: { type: String, default: "Anonymous" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SharedContent", SharedContentSchema);
