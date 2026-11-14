import express from "express";
import { randomBytes } from "node:crypto";
import InterviewRoom from "../src/models/InterviewRoom.js";
import { protectRoute, requireAdmin } from "../src/middleware/protectRoute.js";

const router = express.Router();

router.post("/rooms", protectRoute, requireAdmin, async (req, res) => {
  try {
    const code = randomBytes(4).toString("hex").toUpperCase();
    const room = await InterviewRoom.create({
      code,
      createdBy: req.user._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    res.status(201).json({ code: room.code, expiresAt: room.expiresAt });
  } catch (error) {
    console.error("Create interview room error:", error);
    res.status(500).json({ message: "Could not create interview room." });
  }
});

router.get("/rooms/:code", protectRoute, async (req, res) => {
  try {
    const code = String(req.params.code || "").toUpperCase();
    const room = await InterviewRoom.findOne({ code, status: "open", expiresAt: { $gt: new Date() } }).select("code");
    if (!room) return res.status(404).json({ message: "Interview room not found or expired." });
    res.json({ code: room.code });
  } catch (error) {
    console.error("Find interview room error:", error);
    res.status(500).json({ message: "Could not check interview room." });
  }
});

export default router;
