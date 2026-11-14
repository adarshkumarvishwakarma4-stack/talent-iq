
import express from "express";
import {
  getAllProblems,
  getProblemById,
  createProblem,
} from "../controllers/problemController.js";
import { protectRoute, requireAdmin } from "../src/middleware/protectRoute.js";
const router = express.Router();
router.get("/", getAllProblems);
router.get("/:id", getProblemById);
router.post("/", protectRoute, requireAdmin, createProblem);

export default router;
