const express = require("express");
const { createSession, joinSession, getSession } = require("../controllers/sessionController");

const router = express.Router();

router.post("/create", createSession);
router.post("/join", joinSession);
router.get("/:id", getSession);

module.exports = router;
