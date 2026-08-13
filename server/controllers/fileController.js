const path = require("path");
const fs = require("fs");
const SharedFile = require("../models/SharedFile");
const memory = require("../utils/store");
const { UPLOAD_DIR } = require("../middleware/upload");

function usingDb(req) {
  return req.app.locals.usingDb === true;
}

// Store metadata for an uploaded file and notify the session room over
// Socket.IO so everyone sees it appear instantly. The actual bytes were
// already written to disk by multer before this handler runs.
async function uploadFile(req, res, next) {
  try {
    const sessionId = (req.body.sessionId || "").toString().trim().toUpperCase();
    const sender = (req.body.sender || "Anonymous").toString().slice(0, 60);

    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }
    if (!sessionId) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "sessionId is required." });
    }

    const record = {
      sessionId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      sender,
      createdAt: new Date(),
    };

    let saved;
    if (usingDb(req)) {
      saved = await SharedFile.create(record);
    } else {
      saved = { _id: `${Date.now()}`, ...record };
      const list = memory.files.get(sessionId) || [];
      list.push(saved);
      memory.files.set(sessionId, list);
    }

    const io = req.app.locals.io;
    if (io) {
      io.to(sessionId).emit("file-shared", {
        id: saved._id,
        originalName: saved.originalName,
        storedName: saved.storedName,
        mimeType: saved.mimeType,
        size: saved.size,
        sender: saved.sender,
        createdAt: saved.createdAt,
      });
    }

    return res.status(201).json({ file: saved });
  } catch (err) {
    next(err);
  }
}

// Stream a previously uploaded file back down for download, keyed by its
// stored (server-generated) filename so the original name can never be used
// to escape the uploads directory.
async function downloadFile(req, res, next) {
  try {
    const { storedName } = req.params;

    // Guard against path traversal - only allow the exact filename pattern
    // multer generates.
    if (!/^[0-9a-zA-Z\-_.]+$/.test(storedName)) {
      return res.status(400).json({ error: "Invalid file reference." });
    }

    const filePath = path.join(UPLOAD_DIR, storedName);
    if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found." });
    }

    let originalName = storedName;
    if (usingDb(req)) {
      const record = await SharedFile.findOne({ storedName });
      if (record) originalName = record.originalName;
    } else {
      for (const list of memory.files.values()) {
        const match = list.find((f) => f.storedName === storedName);
        if (match) {
          originalName = match.originalName;
          break;
        }
      }
    }

    return res.download(filePath, originalName);
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFile, downloadFile };
