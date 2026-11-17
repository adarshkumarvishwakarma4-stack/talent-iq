import mongoose from "mongoose";

const interviewRoomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

const InterviewRoom = mongoose.model("InterviewRoom", interviewRoomSchema);
export default InterviewRoom;
