
import express from "express";
import Problem from "../src/models/Problem.js";

const router = express.Router();

const runJavaCode = async (code, input) => {
  const apiKey = process.env.ONLINECOMPILER_API_KEY;

  if (!apiKey) {
    throw new Error("ONLINECOMPILER_API_KEY is missing from backend .env");
  }

  const response = await fetch(
    "https://api.onlinecompiler.io/api/run-code-sync/",
    {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        compiler: "openjdk-25",
        code,
        input,
      }),
      signal: AbortSignal.timeout(35000),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Code execution service failed."
    );
  }

  return data;
};

// POST /api/execute
router.post("/", async (req, res) => {
  try {
    const { code, input = "", problemId } = req.body;

    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        message: "Please provide code.",
      });
    }

    // MODE 1: Normal code execution
    if (!problemId) {
      const data = await runJavaCode(code, input);

      return res.json({
        output: data.output || "",
        error: data.error || "",
        exit_code: data.exit_code,
        status: data.status,
        time: data.time,
      });
    }

    // MODE 2: Automatic test-case evaluation
    const problem = await Problem.findById(problemId).select("testCases");

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found.",
      });
    }

    const testCases = problem.testCases || [];

    if (testCases.length === 0) {
      return res.status(400).json({
        message: "No test cases found for this problem.",
      });
    }

    if (testCases.length > 30) {
      return res.status(400).json({
        message: "Maximum 30 test cases are allowed.",
      });
    }

    let passedCount = 0;
    const visibleResults = [];

    // Run test cases one by one
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];

      const result = await runJavaCode(code, testCase.input || "");

      const actualOutput = (result.output || "").trim();
      const expectedOutput = (testCase.expectedOutput || "").trim();

      const executionFailed =
        Boolean(result.error) ||
        (result.exit_code !== undefined && result.exit_code !== 0) ||
        result.status === "error";

      const passed =
        !executionFailed && actualOutput === expectedOutput;

      if (passed) {
        passedCount++;
      }

      // Never send hidden test case details to the frontend
      if (!testCase.isHidden) {
        visibleResults.push({
          testCaseNumber: i + 1,
          passed,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput,
          error: result.error || "",
        });
      }
    }

    const totalTestCases = testCases.length;

    return res.json({
      verdict:
        passedCount === totalTestCases
          ? "Accepted"
          : "Wrong Answer",
      passedCount,
      totalTestCases,
      visibleResults,
    });

  } catch (error) {
    console.error("Code evaluation error:", error);

    return res.status(502).json({
      message:
        error.name === "TimeoutError"
          ? "Code execution timed out."
          : error.message || "Code evaluation failed.",
    });
  }
});

export default router;

