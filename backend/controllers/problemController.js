import Problem from "../models/Problem.js";

export const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find().sort({ createdAt: -1 });
    res.json(problems);
  } catch (error) {
    console.error("Error in getAllProblems", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};