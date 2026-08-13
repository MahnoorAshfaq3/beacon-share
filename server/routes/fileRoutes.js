const express = require("express");
const { upload } = require("../middleware/upload");
const { uploadFile, downloadFile } = require("../controllers/fileController");

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFile);
router.get("/download/:storedName", downloadFile);

module.exports = router;
