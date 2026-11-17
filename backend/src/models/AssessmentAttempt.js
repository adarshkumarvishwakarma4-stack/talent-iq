import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    code: { type: String, required: true },
    verdict: { type: String, required: true },
    passedCount: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: { type: Date, default: Date.now },
    deadlineAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["in-progress", "submitted", "expired"],
      default: "in-progress",
    },
    submissions: { type: [submissionSchema], default: [] },
  },
  { timestamps: true }
);

assessmentAttemptSchema.index(
  { assessment: 1, candidate: 1 },
  { unique: true }
);

const AssessmentAttempt = mongoose.model(
  "AssessmentAttempt",
  assessmentAttemptSchema
);

export default AssessmentAttempt;
