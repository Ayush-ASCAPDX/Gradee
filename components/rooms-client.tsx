"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, Card, Pill } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import { getSocket } from "@/lib/socket";
import type { User } from "@/types/auth";
import type { PresenceEntry, RoomCount, RoomParticipant } from "@/types/rooms";

type RemoteTile = RoomParticipant & {
  stream?: MediaStream;
};

const ROOM_PRESETS = [
  { id: "math-lab", title: "Math Lab", topic: "Problem solving" },
  { id: "exam-focus", title: "Exam Focus", topic: "Revision sprint" },
  { id: "quiet-study", title: "Quiet Study", topic: "Deep work" },
  { id: "project-room", title: "Project Room", topic: "Group collaboration" },
];

export function RoomsClient({ currentUser }: { currentUser: User }) {
  const socketRef = useRef(getSocket());
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([]);
  const [presence, setPresence] = useState<PresenceEntry[]>([]);
  const [roomCounts, setRoomCounts] = useState<RoomCount[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [remoteTiles, setRemoteTiles] = useState<RemoteTile[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [status, setStatus] = useState("Connecting...");

  const presenceCount = presence.reduce((sum, item) => sum + item.socketCount, 0);

  const roomCountMap = useMemo(
    () => new Map(roomCounts.map((room) => [room.roomId, room.count])),
    [roomCounts],
  );

  useEffect(() => {
    apiFetch<{ iceServers: RTCIceServer[] }>("/api/rtc-config")
      .then((data) => setIceServers(data.iceServers))
      .catch(() => setIceServers([{ urls: "stun:stun.l.google.com:19302" }]));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function ensureLocalMedia() {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      if (mounted && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    }

    const socket = socketRef.current;
    socket.connect();

    socket.on("session:ready", async (payload) => {
      if (!mounted) return;
      setPresence(payload.onlineUsers || []);
      setRoomCounts(payload.rooms || []);
      setStatus("Ready");
      if (payload.iceServers?.length) {
        setIceServers(payload.iceServers);
      }
      await ensureLocalMedia().catch(() => {
        setStatus("Connected without local camera access.");
      });
    });

    socket.on("presence:update", (entries) => mounted && setPresence(entries));
    socket.on("rooms:update", (entries) => mounted && setRoomCounts(entries));
    socket.on("room:joined", async ({
      roomId,
      participants: nextParticipants,
    }: {
      roomId: string;
      participants: RoomParticipant[];
    }) => {
      if (!mounted) return;
      setActiveRoomId(roomId);
      setParticipants(nextParticipants);
      setStatus(`Joined ${roomId}`);

      const stream = await ensureLocalMedia();
      await Promise.all(nextParticipants.map((participant) => createOfferForParticipant(participant, stream)));
    });

    socket.on("room:user-joined", ({ user }) => {
      if (!mounted) return;
      setParticipants((current) => {
        const filtered = current.filter((item) => item.primarySocketId !== user.primarySocketId);
        return [...filtered, user];
      });
    });

    socket.on("room:user-left", ({ socketId }) => {
      cleanupPeer(socketId);
      setParticipants((current) => current.filter((item) => item.primarySocketId !== socketId));
      setRemoteTiles((current) => current.filter((item) => item.primarySocketId !== socketId));
    });

    socket.on("room:left", () => {
      setActiveRoomId(null);
      setParticipants([]);
      setRemoteTiles([]);
      cleanupAllPeers();
      setStatus("Left room");
    });

    socket.on("webrtc:offer", async ({ from, fromSocketId, description }) => {
      const stream = await ensureLocalMedia();
      const connection = createPeerConnection(fromSocketId, {
        userId: from.id,
        name: from.name,
        username: from.username,
        primarySocketId: fromSocketId,
      });
      addLocalTracks(connection, stream);
      await connection.setRemoteDescription(description);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      socket.emit("webrtc:answer", {
        targetSocketId: fromSocketId,
        description: answer,
      });
    });

    socket.on("webrtc:answer", async ({ fromSocketId, description }) => {
      const connection = peerConnectionsRef.current.get(fromSocketId);
      if (connection) {
        await connection.setRemoteDescription(description);
      }
    });

    socket.on("webrtc:ice-candidate", async ({ fromSocketId, candidate }) => {
      const connection = peerConnectionsRef.current.get(fromSocketId);
      if (connection && candidate) {
        await connection.addIceCandidate(candidate);
      }
    });

    socket.on("connect_error", () => {
      if (mounted) {
        setStatus("Realtime connection failed.");
      }
    });

    return () => {
      mounted = false;
      socket.off();
      socket.disconnect();
      cleanupAllPeers();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
    // The socket lifecycle is intentionally attached once per page mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function createPeerConnection(socketId: string, participant: RoomParticipant) {
    const existing = peerConnectionsRef.current.get(socketId);
    if (existing) {
      return existing;
    }

    const connection = new RTCPeerConnection({
      iceServers: iceServers.length ? iceServers : [{ urls: "stun:stun.l.google.com:19302" }],
    });

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("webrtc:ice-candidate", {
          targetSocketId: socketId,
          candidate: event.candidate,
        });
      }
    };

    connection.ontrack = (event) => {
      setRemoteTiles((current) => {
        const filtered = current.filter((item) => item.primarySocketId !== socketId);
        return [...filtered, { ...participant, stream: event.streams[0] }];
      });
    };

    connection.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(connection.connectionState)) {
        cleanupPeer(socketId);
      }
    };

    peerConnectionsRef.current.set(socketId, connection);
    return connection;
  }

  function addLocalTracks(connection: RTCPeerConnection, stream: MediaStream) {
    const senders = connection.getSenders();

    for (const track of stream.getTracks()) {
      const existingSender = senders.find((sender) => sender.track?.kind === track.kind);
      if (existingSender) {
        void existingSender.replaceTrack(track);
      } else {
        connection.addTrack(track, stream);
      }
    }
  }

  async function createOfferForParticipant(participant: RoomParticipant, stream: MediaStream) {
    const connection = createPeerConnection(participant.primarySocketId, participant);
    addLocalTracks(connection, stream);
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    socketRef.current.emit("webrtc:offer", {
      targetSocketId: participant.primarySocketId,
      description: offer,
    });
  }

  function cleanupPeer(socketId: string) {
    const connection = peerConnectionsRef.current.get(socketId);
    if (connection) {
      connection.close();
      peerConnectionsRef.current.delete(socketId);
    }
  }

  function cleanupAllPeers() {
    for (const socketId of peerConnectionsRef.current.keys()) {
      cleanupPeer(socketId);
    }
  }

  async function joinRoom(roomId: string) {
    const stream =
      localStreamRef.current ||
      (await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));
    localStreamRef.current = stream;
    cameraTrackRef.current = stream.getVideoTracks()[0] || null;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    socketRef.current.emit("join:room", { roomId });
  }

  function leaveRoom() {
    socketRef.current.emit("leave:room");
  }

  function toggleMic() {
    const enabled = !micEnabled;
    setMicEnabled(enabled);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  function toggleCam() {
    const enabled = !camEnabled;
    setCamEnabled(enabled);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  async function toggleScreenShare() {
    if (!sharingScreen) {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      replaceVideoTrack(screenTrack);
      setSharingScreen(true);
      screenTrack.onended = () => {
        void stopScreenShare();
      };
      return;
    }

    await stopScreenShare();
  }

  async function stopScreenShare() {
    const cameraTrack = cameraTrackRef.current;
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    if (cameraTrack) {
      replaceVideoTrack(cameraTrack);
    }
    setSharingScreen(false);
  }

  function replaceVideoTrack(track: MediaStreamTrack) {
    for (const connection of peerConnectionsRef.current.values()) {
      const sender = connection.getSenders().find((item) => item.track?.kind === "video");
      if (sender) {
        void sender.replaceTrack(track);
      }
    }

    const stream = localStreamRef.current;
    if (!stream) return;
    const nextStream = new MediaStream([track, ...stream.getAudioTracks()]);
    localStreamRef.current = nextStream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = nextStream;
    }
  }

  async function shareRoomLink() {
    const roomId = activeRoomId || ROOM_PRESETS[0].id;
    await navigator.clipboard.writeText(`${window.location.origin}/rooms?room=${roomId}`);
    setStatus("Room link copied.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="p-5">
          <Pill>Focus Rooms</Pill>
          <h1 className="mt-4 text-2xl font-bold text-white">Live study spaces</h1>
          <p className="mt-2 text-sm text-white/54">
            Presence, room counts, WebRTC calls, mic/cam control, and room sharing are all wired to the migrated realtime layer.
          </p>
          <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/68">
            <div>Status: {status}</div>
            <div className="mt-1">Online sockets: {presenceCount}</div>
            <div className="mt-1">Signed in as @{currentUser.username}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Available rooms</h2>
            <Pill>{ROOM_PRESETS.length} rooms</Pill>
          </div>
          <div className="space-y-3">
            {ROOM_PRESETS.map((room) => (
              <button
                key={room.id}
                className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                  activeRoomId === room.id
                    ? "border-white/30 bg-white text-slate-950"
                    : "border-white/8 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                }`}
                onClick={() => void joinRoom(room.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold">{room.title}</div>
                    <div className={`text-sm ${activeRoomId === room.id ? "text-slate-500" : "text-white/46"}`}>
                      {room.topic}
                    </div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs ${activeRoomId === room.id ? "bg-slate-200 text-slate-700" : "bg-white/8 text-white/70"}`}>
                    {roomCountMap.get(room.id) || 0} inside
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <Card className="flex min-h-[78vh] flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div>
            <div className="text-lg font-semibold text-white">
              {activeRoomId ? activeRoomId.replace("-", " ") : "Select a room"}
            </div>
            <div className="text-sm text-white/45">
              {activeRoomId ? `${participants.length + 1} participant view` : "Join a room to start"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={toggleMic}>{micEnabled ? "Mute Mic" : "Unmute Mic"}</Button>
            <Button onClick={toggleCam}>{camEnabled ? "Hide Cam" : "Show Cam"}</Button>
            <Button onClick={() => void toggleScreenShare()}>
              {sharingScreen ? "Stop Share" : "Share Screen"}
            </Button>
            <Button onClick={() => void shareRoomLink()}>Share Link</Button>
            {activeRoomId ? <Button onClick={leaveRoom}>Leave Room</Button> : null}
          </div>
        </div>
        <div className="mt-4 grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,#1f2937,#020617)]">
            <video ref={localVideoRef} autoPlay muted playsInline className="h-full min-h-[260px] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-4">
              <div>
                <div className="text-sm font-semibold text-white">You</div>
                <div className="text-xs text-white/55">@{currentUser.username}</div>
              </div>
              <Pill>{sharingScreen ? "Sharing" : "Live"}</Pill>
            </div>
          </div>
          {remoteTiles.map((tile) => (
            <RemoteVideoTile key={tile.primarySocketId} tile={tile} />
          ))}
          {activeRoomId && remoteTiles.length === 0 ? (
            <div className="grid min-h-[260px] place-items-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] text-center text-white/44">
              Waiting for other participants to join this room.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function RemoteVideoTile({ tile }: { tile: RemoteTile }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && tile.stream) {
      videoRef.current.srcObject = tile.stream;
    }
  }, [tile.stream]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,#172033,#030712)]">
      <video ref={videoRef} autoPlay playsInline className="h-full min-h-[260px] w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 py-4">
        <Avatar name={tile.name} seed={tile.userId} className="h-10 w-10" />
        <div>
          <div className="text-sm font-semibold text-white">{tile.name}</div>
          <div className="text-xs text-white/55">@{tile.username}</div>
        </div>
      </div>
    </div>
  );
}
