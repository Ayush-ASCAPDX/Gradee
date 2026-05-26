"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui";
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
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }

  useEffect(() => {
    apiFetch<{ iceServers: RTCIceServer[] }>("/api/rtc-config")
      .then((data) => setIceServers(data.iceServers))
      .catch(() => setIceServers([{ urls: "stun:stun.l.google.com:19302" }]));
  }, []);

  useEffect(() => {
    let mounted = true;

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
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
        <div className="soft-ui-nav mx-auto flex max-w-[100vw] items-center justify-between p-2 shadow-float">
          <Link href="/rooms" className="flex h-12 w-12 items-center justify-center rounded-full bg-plum/10 text-plum transition-all active:scale-90">
            <span className="material-symbols-outlined">videocam</span>
          </Link>
          <Link href="/messages" className="flex h-12 w-12 items-center justify-center rounded-full text-ink/40 transition-all active:scale-90">
            <span className="material-symbols-outlined">chat_bubble</span>
          </Link>
          <div className="relative -mt-8">
            <Link
              href="/ai-assistant"
              className="flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-[#8aa1d1] bg-plum text-white shadow-soft transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-3xl">smart_toy</span>
            </Link>
          </div>
          <Link href="/home" className="flex h-12 w-12 items-center justify-center rounded-full text-ink/40 transition-all active:scale-90">
            <span className="material-symbols-outlined">home</span>
          </Link>
          <Link href="/profile" className="flex h-12 w-12 items-center justify-center rounded-full text-ink/40 transition-all active:scale-90">
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      </nav>

      <section className="h-screen overflow-auto bg-[#242734] pb-28 text-white">
        <div className="border-b border-white/10 bg-[#242734] px-3 py-2.5 lg:px-4">
          <div className="grid gap-3 xl:grid-cols-[auto_minmax(240px,1fr)_auto_auto] xl:items-center">
            <button
              onClick={activeRoomId ? leaveRoom : undefined}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#5a7bf9_0%,#6a6dff_55%,#ff8a54_100%)] px-4 text-sm font-semibold text-white"
            >
              <span className="material-symbols-outlined text-base">bolt</span>
              {activeRoomId ? "Finish session" : "Ready to join"}
            </button>
            <label className="flex min-h-[44px] items-center gap-2 rounded-[0.9rem] border border-white/10 bg-[#252938] px-4 text-sm text-[#98a3d0]">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search app users..."
                className="w-full border-none bg-transparent text-[#dbe2ff] outline-none"
              />
            </label>
            <div className="text-sm font-semibold text-[#8ea3ff]">Status: {status}</div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button onClick={() => void ensureLocalMedia()} className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-white/10 bg-[#202533] px-4 text-sm font-semibold text-white">
                Preview
              </button>
              <button onClick={() => void shareRoomLink()} className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/10 bg-[#1d2230] text-[#91a0d1]">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/10 bg-[#1d2230] text-[#91a0d1]">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 lg:px-4">
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  {ROOM_PRESETS.map((room) => {
                    const active = activeRoomId === room.id;
                    return (
                      <button
                        key={room.id}
                        onClick={() => void joinRoom(room.id)}
                        className={`flex items-center gap-3 rounded-[1.2rem] border px-3 py-2.5 text-left transition ${
                          active
                            ? "border-[#7490ff] bg-[rgba(89,116,255,0.22)] shadow-[0_12px_26px_rgba(29,42,116,0.35)]"
                            : "border-white/10 bg-[#2a2d3b] hover:bg-[#313647]"
                        }`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{room.title}</p>
                          <p className="text-[11px] text-white/55">
                            {room.topic} • {roomCountMap.get(room.id) || 0} online
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="rounded-[1.2rem] border border-white/10 bg-[#2a2d3b] p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Live status</p>
                        <p className="mt-1 text-base font-semibold">
                          {activeRoomId ? ROOM_PRESETS.find((room) => room.id === activeRoomId)?.title : "Not connected"}
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          {activeRoomId ? `${participants.length + 1} people in room` : `${presenceCount} online across Gradee`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={toggleMic} className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#1d2230] px-4 text-sm font-semibold text-white">
                          {micEnabled ? "Mute" : "Unmute"}
                        </button>
                        <button onClick={toggleCam} className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#1d2230] px-4 text-sm font-semibold text-white">
                          {camEnabled ? "Hide Cam" : "Show Cam"}
                        </button>
                        <button onClick={() => void toggleScreenShare()} className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#1d2230] px-4 text-sm font-semibold text-white">
                          {sharingScreen ? "Stop Share" : "Share"}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="relative overflow-hidden rounded-[0.85rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(86,104,198,0.18),transparent_36%),linear-gradient(180deg,#232632_0%,#171b25_100%)] min-h-[176px]">
                        <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover [transform:scaleX(-1)]" />
                        <div className="absolute left-2 right-2 top-2 z-10 flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-[rgba(25,29,42,0.76)] px-2 py-1 text-[11px] font-semibold text-white">
                              you
                            </span>
                            <span className="rounded-full bg-[rgba(255,185,36,0.92)] px-2 py-1 text-[11px] font-semibold text-[#281300]">
                              host
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-[rgba(69,138,255,0.9)] px-2 py-1 text-[11px] font-semibold text-white">
                              {sharingScreen ? "sharing" : camEnabled ? "camera on" : "camera off"}
                            </span>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 z-10 rounded-[0.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,20,33,0.1)_0%,rgba(47,57,90,0.92)_100%)] px-4 py-3">
                          <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                          <p className="mt-1 text-xs text-white/70">@{currentUser.username}</p>
                        </div>
                      </div>

                      {remoteTiles.map((tile) => (
                        <RemoteVideoTile key={tile.primarySocketId} tile={tile} />
                      ))}

                      {activeRoomId && remoteTiles.length === 0 ? (
                        <div className="flex min-h-[176px] items-center justify-center rounded-[0.85rem] border border-dashed border-white/10 bg-[#232632] px-6 text-center text-sm text-white/55">
                          Waiting for other participants to join this room.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] border border-white/10 bg-[#2a2d3b] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">People in room</p>
                        <p className="mt-1 text-base font-semibold text-white">Presence</p>
                      </div>
                      <span className="inline-flex min-h-[38px] items-center rounded-full bg-[#171c28] px-3 text-sm font-semibold text-white">
                        {activeRoomId ? participants.length + 1 : 0} connected
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="rounded-[1rem] bg-[#1f2432] px-4 py-3">
                        <p className="text-sm font-semibold text-white">{currentUser.name} (you)</p>
                        <p className="mt-1 text-xs text-white/60">{sharingScreen ? "Sharing screen" : camEnabled ? "Camera on" : "Camera off"}</p>
                      </div>
                      {participants.map((participant) => (
                        <div key={participant.primarySocketId} className="rounded-[1rem] bg-[#1f2432] px-4 py-3">
                          <p className="text-sm font-semibold text-white">{participant.name}</p>
                          <p className="mt-1 text-xs text-white/60">@{participant.username}</p>
                        </div>
                      ))}
                      {!activeRoomId ? (
                        <div className="rounded-[1rem] bg-[#1f2432] px-4 py-3 text-sm text-white/60">
                          Nobody is in this room yet.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-white/10 bg-[#2a2d3b] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Room controls</p>
                <div className="mt-3 grid gap-2">
                  <button onClick={() => void ensureLocalMedia()} className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#313647] px-4 text-sm font-semibold text-white">
                    Start preview
                  </button>
                  <button onClick={() => activeRoomId ? leaveRoom() : void joinRoom(ROOM_PRESETS[0].id)} className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#313647] px-4 text-sm font-semibold text-white">
                    {activeRoomId ? "Leave room" : "Join first room"}
                  </button>
                  <button onClick={() => void shareRoomLink()} className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-[#313647] px-4 text-sm font-semibold text-white">
                    Copy room link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
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
