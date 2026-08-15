import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "../services/socket";
import { useSessionContext } from "../context/SessionContext";

// STUN helps two browsers behind NAT discover a direct network path to each
// other. When a direct path isn't possible (strict corporate firewalls,
// symmetric NAT), only a TURN relay server can bridge them - add one here
// via env-configured values for production deployments, e.g.
//   { urls: "turn:your-turn-host:3478", username: "...", credential: "..." }
// Never hard-code TURN credentials in client source.
const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302",
},
 {
      urls: import.meta.env.VITE_TURN_URL,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
  ],
};

// Mesh WebRTC: the teacher opens one RTCPeerConnection per connected
// student and sends the same local screen-capture MediaStream down each of
// them. This is simple and works well for small classes. For large
// classrooms this Map-of-peer-connections approach is the seam to swap in
// an SFU (mediasoup / LiveKit / Janus) - the teacher would instead open a
// single connection to the SFU, which fans the stream out server-side.
export default function useWebRTC() {
  const { state, dispatch } = useSessionContext();
  const { sessionId, role } = state;
  const socket = getSocket();

  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // remote socket id -> RTCPeerConnection

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [peerState, setPeerState] = useState("new"); // student-side connection state
  const [screenError, setScreenError] = useState(null);

  const closeAllPeers = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    setViewerCount(0);
  }, []);

  // ---- Teacher: build a fresh peer connection + offer for one student ----
  const createPeerForStudent = useCallback(
    (studentSocketId) => {
      if (!localStreamRef.current || peersRef.current.has(studentSocketId)) return;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("webrtc-ice-candidate", { to: studentSocketId, candidate: e.candidate });
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
          peersRef.current.delete(studentSocketId);
          setViewerCount(peersRef.current.size);
        }
      };

      peersRef.current.set(studentSocketId, pc);
      setViewerCount(peersRef.current.size);

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer).then(() => offer))
        .then((offer) => socket.emit("webrtc-offer", { to: studentSocketId, sdp: offer }))
        .catch(() => setScreenError("Unable to connect to a student's browser."));
    },
    [socket]
  );

  const startSharing = useCallback(async () => {
    setScreenError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setScreenError("Your browser does not support screen sharing.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsSharing(true);
      dispatch({ type: "SET_SCREEN_SHARING", value: true });
      socket.emit("screen-share-start", { sessionId });

      // If the user stops sharing via the browser's own "Stop sharing" bar
      // (rather than our button), react the same way as clicking Stop here.
      const [track] = stream.getVideoTracks();
      track.addEventListener("ended", () => stopSharingRef.current());
    } catch (err) {
      if (err && err.name === "NotAllowedError") {
        setScreenError("Screen sharing permission was denied.");
      } else {
        setScreenError("Unable to start screen sharing.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, socket, dispatch]);

  const stopSharing = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    localStreamRef.current = null;
    setLocalStream(null);
    setIsSharing(false);
    closeAllPeers();
    dispatch({ type: "SET_SCREEN_SHARING", value: false });
    socket.emit("screen-share-stop", { sessionId });
  }, [sessionId, socket, dispatch, closeAllPeers]);

  // Kept in a ref so the "track ended" listener registered inside
  // startSharing always calls the latest stopSharing implementation.
  const stopSharingRef = useRef(stopSharing);
  useEffect(() => {
    stopSharingRef.current = stopSharing;
  }, [stopSharing]);

  // ---- Student: respond to an incoming offer from the teacher ----
  const handleOffer = useCallback(
    async ({ from, sdp }) => {
      let pc = peersRef.current.get(from);
      if (!pc) {
        pc = new RTCPeerConnection(ICE_SERVERS);
        peersRef.current.set(from, pc);

        pc.ontrack = (e) => setRemoteStream(e.streams[0]);
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit("webrtc-ice-candidate", { to: from, candidate: e.candidate });
        };
        pc.onconnectionstatechange = () => {
          setPeerState(pc.connectionState);
          if (pc.connectionState === "failed") {
            setScreenError("Unable to connect to the teacher's screen.");
          }
        };
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, sdp: answer });
      } catch {
        setScreenError("Unable to connect to the teacher's screen.");
      }
    },
    [socket]
  );

  // ---- Shared signaling listeners ----
  useEffect(() => {
    function onAnswer({ from, sdp }) {
      const pc = peersRef.current.get(from);
      if (pc) pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(() => {});
    }

    function onIceCandidate({ from, candidate }) {
      const pc = peersRef.current.get(from);
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    }

    function onStudentWantsStream({ studentSocketId }) {
      if (role === "teacher") createPeerForStudent(studentSocketId);
    }

    function onScreenShareEnded() {
      if (role !== "teacher") {
        peersRef.current.forEach((pc) => pc.close());
        peersRef.current.clear();
        setRemoteStream(null);
        setPeerState("new");
      }
    }

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("webrtc-ice-candidate", onIceCandidate);
    socket.on("student-wants-stream", onStudentWantsStream);
    socket.on("screen-share-ended", onScreenShareEnded);
    socket.on("teacher-disconnected", onScreenShareEnded);

    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("webrtc-ice-candidate", onIceCandidate);
      socket.off("student-wants-stream", onStudentWantsStream);
      socket.off("screen-share-ended", onScreenShareEnded);
      socket.off("teacher-disconnected", onScreenShareEnded);
    };
  }, [socket, role, createPeerForStudent, handleOffer]);

  // Clean up all media + connections when the room unmounts.
  useEffect(() => {
    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
  }, []);

  return { localStream, remoteStream, isSharing, viewerCount, peerState, screenError, startSharing, stopSharing };
}
