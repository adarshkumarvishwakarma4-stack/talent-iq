
import Problem from "../src/models/Problem.js";

export const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find()
      .select("-testCases -expectedOutput")
      .sort({ createdAt: -1 });

    res.status(200).json(problems);
  } catch (error) {
    console.error("Error in getAllProblems:", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .select("-testCases -expectedOutput");

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    // Only public examples are sent to candidates.
    res.status(200).json(problem);
  } catch (error) {
    console.error("Error in getProblemById:", error);

    res.status(400).json({
      message: "Invalid problem ID",
    });
  }
};

export const createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      category,
      examples,
      constraints,
      starterCode,
      expectedOutput,
      testCases = [],
    } = req.body;

    if (!title || !description || !difficulty) {
  return res.status(400).json({
    message: "Title, description, and difficulty are required",
  });
}

if (
  !Array.isArray(testCases) ||
  testCases.length === 0 ||
  testCases.some(
    (testCase) =>
      typeof testCase.expectedOutput !== "string" ||
      !testCase.expectedOutput.trim()
  )
) {
  return res.status(400).json({
    message: "At least one test case with expected output is required",
  });
}

    const problem = await Problem.create({
      title,
      description,
      difficulty,
      category,
      examples,
      constraints,
      starterCode,
      expectedOutput: expectedOutput || "",
      testCases,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Problem created successfully",
      problem,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A problem with this title already exists",
      });
    }

    console.error("Error in createProblem:", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
