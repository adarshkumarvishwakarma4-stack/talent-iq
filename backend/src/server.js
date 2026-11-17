import "dotenv/config";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import executeRoutes from "../routes/executeRoutes.js";
import assessmentRoutes from "../routes/assessmentRoutes.js";
import interviewRoutes from "../routes/interviewRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./lib/db.js";
import problemRoutes from "../routes/problemRoutes.js";
import { protectRoute } from "./middleware/protectRoute.js";
import { configureSocket } from "./socket.js";
import cors from "cors";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(clerkMiddleware());
app.use("/api/problems", problemRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/interviews", interviewRoutes);

app.get("/health", (req, res) => {
  res.json({ msg: "api is up and running" });
});
app.get("/api/me", protectRoute, (req, res) => {
  res.json({ name: req.user.name, email: req.user.email, role: req.user.role });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
configureSocket(io);

const startServer = async () => {
  await connectDB();
  const port = process.env.PORT || 3000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port: ${port}`);
  });
};
startServer();
