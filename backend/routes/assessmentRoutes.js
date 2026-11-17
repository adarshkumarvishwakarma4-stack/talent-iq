import express from "express";
import { randomBytes } from "node:crypto";
import Assessment from "../src/models/Assessment.js";
import AssessmentAttempt from "../src/models/AssessmentAttempt.js";
import Problem from "../src/models/Problem.js";
import { protectRoute, requireAdmin } from "../src/middleware/protectRoute.js";

const router = express.Router();

const publicProblem = (problem) => ({
  _id: problem._id,
  title: problem.title,
  difficulty: problem.difficulty,
  category: problem.category,
  description: problem.description,
  examples: problem.examples,
  constraints: problem.constraints,
  starterCode: problem.starterCode,
});

const getAttemptScore = (attempt, assessment) => {
  const latestByProblem = new Map();
  for (const submission of attempt.submissions) {
    latestByProblem.set(String(submission.problem), submission);
  }

  const totalTestCases = (assessment.problems || []).reduce(
    (sum, problem) => sum + (problem.testCases?.length || 0),
    0
  );
  const passedCount = [...latestByProblem.values()].reduce(
    (sum, submission) => sum + submission.passedCount,
    0
  );

  return {
    questionsTotal: assessment.problems?.length || 0,
    questionsAttempted: latestByProblem.size,
    passedCount,
    totalTestCases,
    scorePercent: totalTestCases
      ? Math.round((passedCount / totalTestCases) * 100)
      : 0,
  };
};

// Admin: create an assessment with questions selected beforehand.
router.post("/", protectRoute, requireAdmin, async (req, res) => {
  try {
    const { title, problemIds, durationMinutes } = req.body;
    const duration = Number(durationMinutes);

    if (!title?.trim()) {
      return res.status(400).json({ message: "Assessment title is required." });
    }
    if (!Array.isArray(problemIds) || problemIds.length === 0 || problemIds.length > 20) {
      return res.status(400).json({ message: "Select between 1 and 20 questions." });
    }
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
      return res.status(400).json({ message: "Duration must be between 5 and 240 minutes." });
    }

    const problems = await Problem.find({ _id: { $in: problemIds } }).select("_id");
    if (problems.length !== new Set(problemIds.map(String)).size) {
      return res.status(400).json({ message: "One or more selected questions are invalid." });
    }

    const assessment = await Assessment.create({
      title: title.trim(),
      code: randomBytes(4).toString("hex").toUpperCase(),
      createdBy: req.user._id,
      problems: problems.map((problem) => problem._id),
      durationMinutes: duration,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      message: "Assessment created successfully.",
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        code: assessment.code,
        durationMinutes: assessment.durationMinutes,
        expiresAt: assessment.expiresAt,
        questionCount: problems.length,
      },
    });
  } catch (error) {
    console.error("Create assessment error:", error);
    res.status(500).json({ message: "Could not create assessment." });
  }
});

// Admin: list assessments created by the signed-in admin.
router.get("/admin", protectRoute, requireAdmin, async (req, res) => {
  try {
    const assessments = await Assessment.find({ createdBy: req.user._id })
      .populate("problems", "title difficulty")
      .sort({ createdAt: -1 })
      .lean();

    const withCounts = await Promise.all(
      assessments.map(async (assessment) => ({
        ...assessment,
        attemptCount: await AssessmentAttempt.countDocuments({
          assessment: assessment._id,
        }),
      }))
    );

    res.json(withCounts);
  } catch (error) {
    console.error("List assessments error:", error);
    res.status(500).json({ message: "Could not load assessments." });
  }
});

// Admin: candidate-wise performance report.
router.get("/admin/:assessmentId/report", protectRoute, requireAdmin, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.assessmentId,
      createdBy: req.user._id,
    }).populate("problems", "title difficulty testCases");

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    const attempts = await AssessmentAttempt.find({ assessment: assessment._id })
      .populate("candidate", "name email")
      .populate("submissions.problem", "title difficulty")
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    const reports = attempts.map((attempt) => {
      const latest = new Map();
      for (const submission of attempt.submissions || []) {
        const id = String(submission.problem?._id || submission.problem);
        latest.set(id, submission);
      }

      const questionResults = assessment.problems.map((problem) => {
        const submission = latest.get(String(problem._id));
        return {
          problemId: problem._id,
          title: problem.title,
          difficulty: problem.difficulty,
          verdict: submission?.verdict || "Not attempted",
          passedCount: submission?.passedCount || 0,
          totalTestCases: submission?.totalTestCases || problem.testCases.length,
          submittedAt: submission?.submittedAt || null,
          code: submission?.code || "",
        };
      });

      const score = getAttemptScore(attempt, assessment);
      return {
        _id: attempt._id,
        candidate: attempt.candidate,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        deadlineAt: attempt.deadlineAt,
        ...score,
        questionResults,
      };
    });

    res.json({
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        code: assessment.code,
        durationMinutes: assessment.durationMinutes,
        questionsTotal: assessment.problems.length,
      },
      attempts: reports,
    });
  } catch (error) {
    console.error("Assessment report error:", error);
    res.status(500).json({ message: "Could not load assessment report." });
  }
});

// Candidate: join by assessment code. One attempt is allowed per candidate.
router.post("/join", protectRoute, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot take candidate assessments." });
    }

    const code = String(req.body.code || "").trim().toUpperCase();
    if (!/^[A-F0-9]{8}$/.test(code)) {
      return res.status(400).json({ message: "Enter a valid 8-character assessment code." });
    }

    const assessment = await Assessment.findOne({
      code,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).populate("problems");

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found, closed, or expired." });
    }

    let attempt = await AssessmentAttempt.findOne({
      assessment: assessment._id,
      candidate: req.user._id,
    });

    if (attempt?.status === "submitted") {
      return res.status(409).json({ message: "You have already submitted this assessment." });
    }

    if (!attempt) {
      const now = new Date();
      attempt = await AssessmentAttempt.create({
        assessment: assessment._id,
        candidate: req.user._id,
        startedAt: now,
        deadlineAt: new Date(Math.min(
          now.getTime() + assessment.durationMinutes * 60 * 1000,
          assessment.expiresAt.getTime()
        )),
      });
    }

    if (attempt.deadlineAt <= new Date()) {
      attempt.status = "expired";
      await attempt.save();
      return res.status(410).json({ message: "Your assessment time has expired." });
    }

    res.json({
      attemptId: attempt._id,
      status: attempt.status,
      deadlineAt: attempt.deadlineAt,
      assessment: {
        title: assessment.title,
        durationMinutes: assessment.durationMinutes,
        problems: assessment.problems.map(publicProblem),
      },
      previousSubmissions: attempt.submissions.map((submission) => ({
        problemId: String(submission.problem),
        verdict: submission.verdict,
        passedCount: submission.passedCount,
        totalTestCases: submission.totalTestCases,
      })),
    });
  } catch (error) {
    console.error("Join assessment error:", error);
    res.status(500).json({ message: "Could not join assessment." });
  }
});

// Candidate: evaluate and save code for one assigned question.
router.post("/attempt/:attemptId/submit-code", protectRoute, async (req, res) => {
  try {
    const { problemId, code } = req.body;
    if (typeof code !== "string" || !code.trim() || !problemId) {
      return res.status(400).json({ message: "Problem and code are required." });
    }

    const attempt = await AssessmentAttempt.findOne({
      _id: req.params.attemptId,
      candidate: req.user._id,
    }).populate({
      path: "assessment",
      populate: { path: "problems" },
    });

    if (!attempt) return res.status(404).json({ message: "Assessment attempt not found." });
    if (attempt.status !== "in-progress") {
      return res.status(409).json({ message: "This assessment is no longer accepting submissions." });
    }
    if (attempt.deadlineAt <= new Date()) {
      attempt.status = "expired";
      await attempt.save();
      return res.status(410).json({ message: "Assessment time has expired." });
    }

    const problem = attempt.assessment.problems.find(
      (item) => String(item._id) === String(problemId)
    );
    if (!problem) return res.status(403).json({ message: "This question is not assigned to your assessment." });
    if (!problem.testCases?.length) {
      return res.status(400).json({ message: "This question has no test cases configured." });
    }
    if (problem.testCases.length > 30) {
      return res.status(400).json({ message: "This question exceeds the 30 test-case limit." });
    }

    const apiKey = process.env.ONLINECOMPILER_API_KEY;
    if (!apiKey) return res.status(500).json({ message: "Code execution service is not configured." });

    let passedCount = 0;
    const visibleResults = [];

    for (let index = 0; index < problem.testCases.length; index++) {
      const testCase = problem.testCases[index];
      const response = await fetch("https://api.onlinecompiler.io/api/run-code-sync/", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          compiler: "openjdk-25",
          code,
          input: testCase.input || "",
        }),
        signal: AbortSignal.timeout(35000),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || result.error || "Code execution service failed.");
      }

      const actualOutput = (result.output || "").trim();
      const expectedOutput = (testCase.expectedOutput || "").trim();
      const failed =
        Boolean(result.error) ||
        (result.exit_code !== undefined && result.exit_code !== 0) ||
        result.status === "error";
      const passed = !failed && actualOutput === expectedOutput;
      if (passed) passedCount++;

      if (!testCase.isHidden) {
        visibleResults.push({
          testCaseNumber: index + 1,
          passed,
          expectedOutput: testCase.expectedOutput,
          actualOutput,
          error: result.error || "",
        });
      }
    }

    // A compiler request can take time; reject the result if the assessment
    // deadline passed while the candidate's code was being evaluated.
    if (attempt.deadlineAt <= new Date()) {
      attempt.status = "expired";
      await attempt.save();
      return res.status(410).json({ message: "Assessment time expired before this submission completed." });
    }

    const totalTestCases = problem.testCases.length;
    const verdict = passedCount === totalTestCases ? "Accepted" : "Wrong Answer";

    attempt.submissions.push({
      problem: problem._id,
      code,
      verdict,
      passedCount,
      totalTestCases,
      submittedAt: new Date(),
    });
    await attempt.save();

    res.json({ verdict, passedCount, totalTestCases, visibleResults });
  } catch (error) {
    console.error("Assessment code submission error:", error);
    res.status(error.name === "TimeoutError" ? 504 : 502).json({
      message: error.name === "TimeoutError"
        ? "Code execution timed out. Please try again."
        : error.message || "Code evaluation failed.",
    });
  }
});

// Candidate: finish assessment and calculate score from latest submission per question.
router.post("/attempt/:attemptId/finish", protectRoute, async (req, res) => {
  try {
    const attempt = await AssessmentAttempt.findOne({
      _id: req.params.attemptId,
      candidate: req.user._id,
    }).populate({
      path: "assessment",
      populate: { path: "problems" },
    });

    if (!attempt) return res.status(404).json({ message: "Assessment attempt not found." });

    if (attempt.status === "in-progress") {
      attempt.status = attempt.deadlineAt <= new Date() ? "expired" : "submitted";
      attempt.submittedAt = new Date();
      await attempt.save();
    }

    const score = getAttemptScore(attempt, attempt.assessment);
    res.json({ message: "Assessment submitted.", status: attempt.status, ...score });
  } catch (error) {
    console.error("Finish assessment error:", error);
    res.status(500).json({ message: "Could not submit assessment." });
  }
});

export default router;
