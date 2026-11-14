import "dotenv/config";
import express from "express";
import executeRoutes from "../routes/executeRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./lib/db.js";
import problemRoutes from "../routes/problemRoutes.js";
import User from "./models/User.js";
import Problem from "./models/Problem.js";
import { protectRoute } from "./middleware/protectRoute.js";
import cors from "cors";
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(clerkMiddleware());
app.use("/api/problems", problemRoutes);
app.use("/api/execute", executeRoutes);
app.get("/api/test-problem-route", (req, res) => {
  res.json({ message: "Problem routes are reaching this server" });
});
app.get("/health", (req, res) => {
  res.json({ msg: "api is up and running" });
});

app.get("/api/check-route", (req, res) => {
  res.json({ message: "LATEST SERVER FILE IS RUNNING" });
});

app.get("/api/me", protectRoute, (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

const startServer = async () => {
  await connectDB();
  app.listen(3000, () => {
    console.log("Server is running on port: 3000");
  });
};

startServer();