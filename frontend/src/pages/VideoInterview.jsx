import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { io } from "socket.io-client";

const API_URL = "http://localhost:3000";

function VideoInterview() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [role, setRole] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [callStatus, setCallStatus] = useState("Not connected");
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const roleRef = useRef("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;
    const loadRole = async () => {
      try {
        const token = await getToken();
        const response = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Could not verify your account.");
        const data = await response.json();
        if (!cancelled) {
          setRole(data.role);
          roleRef.current = data.role;
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };
    loadRole();
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  const createRoom = async () => {
    setError("");
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/interviews/rooms", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create room.");
      setCode(data.code);
      setCallStatus("Room created. Share the code with the candidate.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startOffer = async () => {
    const peer = peerRef.current;
    const socket = socketRef.current;
    if (!peer || !socket) return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("offer", offer);
  };

  const joinCall = async () => {
    if (!code.trim()) {
      setError("Enter the interview room code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const token = await getToken();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallStatus("Connected");
      };

      const socket = io(API_URL, {
        autoConnect: false,
        auth: { token },
      });
      socketRef.current = socket;

      peer.onicecandidate = (event) => {
        if (event.candidate) socket.emit("ice-candidate", event.candidate);
      };

      socket.on("connect_error", (err) => {
        setError(err.message || "Could not connect to interview server.");
        setCallStatus("Connection failed");
      });

      socket.on("peer-joined", async () => {
        if (roleRef.current === "admin") {
          try {
            await startOffer();
          } catch (err) {
            setError("Could not start the video connection.");
          }
        }
      });

      socket.on("offer", async (offer) => {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("answer", answer);
        } catch (err) {
          setError("Could not accept the interview call.");
        }
      });

      socket.on("answer", async (answer) => {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          setError("Could not complete the video connection.");
        }
      });

      socket.on("ice-candidate", async (candidate) => {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("ICE candidate error:", err);
        }
      });

      socket.on("peer-left", () => {
        setCallStatus("The other participant left the call.");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      });

      socket.on("connect", () => {
        socket.emit("join-room", { code }, async (result) => {
          if (!result?.ok) {
            setError(result?.message || "Could not join this room.");
            setLoading(false);
            return;
          }
          setJoined(true);
          setCallStatus(`Joined as ${result.role}. Waiting for the other participant...`);
          if (result.role === "interviewer" && result.peerPresent) {
            try {
              await startOffer();
            } catch (err) {
              setError("Could not start the video connection.");
            }
          }
        });
      });

      socket.connect();
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Please allow camera and microphone access."
          : err.message || "Could not start the interview."
      );
      setCallStatus("Not connected");
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const endCall = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setJoined(false);
    setCallStatus("Call ended");
    setMicOn(true);
    setCameraOn(true);
  };

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleMic = () => {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraOn(next);
  };

  if (!isLoaded) {
    return <div className="p-8 text-center text-slate-300">Loading...</div>;
  }

  if (!isSignedIn) {
    return <div className="p-8 text-center text-slate-300">Please sign in to use interviews.</div>;
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#080b18] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Video Interview</h1>
        <p className="mt-2 text-slate-400">Join a one-to-one interview using a room code.</p>

        {!joined ? (
          <section className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            {role === "admin" && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={createRoom}
                  disabled={loading}
                  className="rounded-lg bg-violet-600 px-4 py-2.5 font-medium hover:bg-violet-500 disabled:opacity-50"
                >
                  {loading ? "Please wait..." : "Create interview room"}
                </button>
                {code && (
                  <p className="mt-3 text-sm text-slate-300">
                    Share this room code with the candidate:{" "}
                    <strong className="text-xl tracking-widest text-violet-300">{code}</strong>
                  </p>
                )}
              </div>
            )}

            <label className="mb-2 block text-sm text-slate-300">Interview room code</label>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              maxLength={8}
              placeholder="Enter 8-character code"
              className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 uppercase tracking-widest outline-none focus:border-violet-400"
            />
            <button
              type="button"
              onClick={joinCall}
              disabled={loading || code.trim().length !== 8}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join interview"}
            </button>
          </section>
        ) : (
          <section className="mt-8">
            <p className="mb-4 text-sm text-slate-300">{callStatus}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                <video ref={remoteVideoRef} autoPlay playsInline className="aspect-video w-full object-cover" />
                <p className="px-3 py-2 text-sm text-slate-300">Interviewer / Candidate</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                <video ref={localVideoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
                <p className="px-3 py-2 text-sm text-slate-300">You</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={toggleMic} className="rounded-lg border border-white/20 px-4 py-2">
                {micOn ? "Mute microphone" : "Unmute microphone"}
              </button>
              <button onClick={toggleCamera} className="rounded-lg border border-white/20 px-4 py-2">
                {cameraOn ? "Turn camera off" : "Turn camera on"}
              </button>
              <button onClick={endCall} className="rounded-lg bg-red-600 px-4 py-2 font-medium hover:bg-red-500">
                End call
              </button>
            </div>
          </section>
        )}

        <p className="mt-5 text-sm text-slate-400">{callStatus}</p>
        {error && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}

export default VideoInterview;
