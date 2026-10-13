import "dotenv/config";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./lib/db.js";
import problemRoutes from "./routes/problemRoutes.js";
import User from "./models/User.js";
import Problem from "./models/Problem.js";
import { protectRoute } from "./middleware/protectRoute.js";

const app = express();

app.use(express.json());
app.use(clerkMiddleware());
app.use("/api/problems", problemRoutes);

app.get("/health", (req, res) => {
  res.json({ msg: "api is up and running" });
});

app.get("/api/me", protectRoute, (req, res) => {
  res.json(req.user);
});

const startServer = async () => {
  await connectDB();
  app.listen(3000, () => {
    console.log("Server is running on port: 3000");
  });
};

startServer();