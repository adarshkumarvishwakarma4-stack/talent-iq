import { verifyToken } from "@clerk/backend";
import User from "./models/User.js";
import InterviewRoom from "./models/InterviewRoom.js";

export const configureSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || !process.env.CLERK_SECRET_KEY) {
        return next(new Error("Authentication required"));
      }

      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
      const user = await User.findOne({ clerkId: payload.sub });
      if (!user) return next(new Error("User account not found"));

      socket.data.user = {
        id: String(user._id),
        clerkId: user.clerkId,
        role: user.role,
      };
      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      next(new Error("Invalid or expired session"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-room", async ({ code } = {}, callback = () => {}) => {
      try {
        const roomCode = String(code || "").trim().toUpperCase();
        if (!/^[A-F0-9]{8}$/.test(roomCode)) {
          return callback({ ok: false, message: "Enter a valid room code." });
        }

        const room = await InterviewRoom.findOne({
          code: roomCode,
          status: "open",
          expiresAt: { $gt: new Date() },
        });

        if (!room) return callback({ ok: false, message: "Room not found or expired." });

        const isOwnerAdmin =
          socket.data.user.role === "admin" &&
          String(room.createdBy) === socket.data.user.id;
        const isCandidate = socket.data.user.role === "user";

        if (!isOwnerAdmin && !isCandidate) {
          return callback({ ok: false, message: "You are not allowed to join this interview." });
        }

        const existingSockets = await io.in(roomCode).fetchSockets();
        if (existingSockets.length >= 2) {
          return callback({ ok: false, message: "This interview room is full." });
        }

        const expectedRole = isOwnerAdmin ? "interviewer" : "candidate";
        if (existingSockets.some((item) => item.data.roomRole === expectedRole)) {
          return callback({ ok: false, message: "A participant with your role has already joined." });
        }

        socket.data.roomCode = roomCode;
        socket.data.roomRole = expectedRole;
        await socket.join(roomCode);

        callback({ ok: true, role: expectedRole, peerPresent: existingSockets.length > 0 });
        socket.to(roomCode).emit("peer-joined", { role: expectedRole });
      } catch (error) {
        console.error("Join interview room error:", error);
        callback({ ok: false, message: "Could not join the interview room." });
      }
    });

    for (const eventName of ["offer", "answer", "ice-candidate"]) {
      socket.on(eventName, (payload) => {
        if (!socket.data.roomCode) return;
        socket.to(socket.data.roomCode).emit(eventName, payload);
      });
    }

    socket.on("disconnect", () => {
      if (socket.data.roomCode) {
        socket.to(socket.data.roomCode).emit("peer-left");
      }
    });
  });
};
