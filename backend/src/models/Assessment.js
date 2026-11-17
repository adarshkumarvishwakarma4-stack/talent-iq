import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    }],
    durationMinutes: { type: Number, required: true, default: 60 },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

const Assessment = mongoose.model("Assessment", assessmentSchema);
export default Assessment;
