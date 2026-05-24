const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const next = require("next");
const { Server } = require("socket.io");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const dev = !process.argv.includes("--prod") && process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const userSchema = new mongoose.Schema(
  {
    name: String,
    username: String,
    email: String,
    isVerified: Boolean,
    createdAt: Date,
  },
  { strict: false },
);

const User =
  mongoose.models.User || mongoose.model("User", userSchema, "users");

const onlineUsers = new Map();
const focusRooms = new Map();
let mongoPromise = null;

function connectToDatabase() {
  if (!mongoPromise) {
    mongoPromise = mongoose.connect(process.env.MONGODB_URI);
  }

  return mongoPromise;
}

function parseIceServers() {
  const servers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrls = String(process.env.TURN_URLS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (turnUrls.length > 0) {
    const turnServer = { urls: turnUrls };

    if (process.env.TURN_USERNAME) {
      turnServer.username = process.env.TURN_USERNAME;
    }

    if (process.env.TURN_CREDENTIAL) {
      turnServer.credential = process.env.TURN_CREDENTIAL;
    }

    servers.push(turnServer);
  }

  return servers;
}

function getCookieValue(cookieHeader, key) {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === key) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

function sanitizeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    email: user.email,
    isVerified: Boolean(user.isVerified),
    createdAt: user.createdAt,
  };
}

async function authenticateFromToken(token) {
  if (!token) {
    throw new Error("Authentication required.");
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  await connectToDatabase();
  const user = await User.findById(payload.userId);

  if (!user) {
    throw new Error("Invalid session.");
  }

  return user;
}

function serializePresence() {
  return Array.from(onlineUsers.values()).map((entry) => ({
    userId: entry.user.id,
    primarySocketId: Array.from(entry.socketIds)[0] || null,
    socketCount: entry.socketIds.size,
  }));
}

function emitPresence(io) {
  io.emit("presence:update", serializePresence());
}

function serializeRoomCounts() {
  return Array.from(focusRooms.entries()).map(([roomId, memberSocketIds]) => ({
    roomId,
    count: memberSocketIds.size,
  }));
}

function emitRoomsUpdate(io) {
  io.emit("rooms:update", serializeRoomCounts());
}

function listRoomParticipants(io, roomId, excludeSocketId = null) {
  const members = focusRooms.get(roomId) || new Set();
  const participants = [];

  for (const socketId of members) {
    if (excludeSocketId && socketId === excludeSocketId) continue;
    const memberSocket = io.sockets.sockets.get(socketId);
    if (!memberSocket?.user) continue;

    participants.push({
      userId: memberSocket.user.id,
      name: memberSocket.user.name,
      username: memberSocket.user.username,
      primarySocketId: memberSocket.id,
    });
  }

  return participants;
}

function leaveFocusRoom(io, socket, notifyPeers = true) {
  const roomId = socket.data?.focusRoomId;
  if (!roomId) return;

  const members = focusRooms.get(roomId);
  if (members) {
    members.delete(socket.id);
    if (members.size === 0) {
      focusRooms.delete(roomId);
    } else {
      focusRooms.set(roomId, members);
    }
  }

  socket.leave(`focus:${roomId}`);
  socket.data.focusRoomId = null;

  if (notifyPeers) {
    socket.to(`focus:${roomId}`).emit("room:user-left", {
      roomId,
      userId: socket.user.id,
      socketId: socket.id,
    });
  }

  emitRoomsUpdate(io);
}

app.prepare().then(() => {
  const server = http.createServer((req, res) => handle(req, res));
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, nextSocket) => {
    try {
      const token = getCookieValue(socket.handshake.headers.cookie, "token");
      const user = await authenticateFromToken(token);
      socket.user = sanitizeUser(user);
      nextSocket();
    } catch (error) {
      nextSocket(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    const existing = onlineUsers.get(userId) || {
      user: socket.user,
      socketIds: new Set(),
    };

    existing.user = socket.user;
    existing.socketIds.add(socket.id);
    onlineUsers.set(userId, existing);

    socket.emit("session:ready", {
      self: socket.user,
      onlineUsers: serializePresence(),
      rooms: serializeRoomCounts(),
      iceServers: parseIceServers(),
    });
    emitPresence(io);
    emitRoomsUpdate(io);

    socket.on("join:room", (payload) => {
      const roomId = String(payload?.roomId || "").trim();
      if (!roomId) return;

      leaveFocusRoom(io, socket, true);

      const roomChannel = `focus:${roomId}`;
      const members = focusRooms.get(roomId) || new Set();
      members.add(socket.id);
      focusRooms.set(roomId, members);

      socket.join(roomChannel);
      socket.data.focusRoomId = roomId;

      socket.emit("room:joined", {
        roomId,
        participants: listRoomParticipants(io, roomId, socket.id),
      });

      socket.to(roomChannel).emit("room:user-joined", {
        roomId,
        user: {
          userId: socket.user.id,
          name: socket.user.name,
          username: socket.user.username,
          primarySocketId: socket.id,
        },
      });

      emitRoomsUpdate(io);
    });

    socket.on("leave:room", () => {
      const previousRoomId = socket.data?.focusRoomId;
      leaveFocusRoom(io, socket, true);
      socket.emit("room:left", { roomId: previousRoomId || null });
    });

    socket.on("webrtc:offer", (payload) => {
      io.to(payload.targetSocketId).emit("webrtc:offer", {
        from: socket.user,
        fromSocketId: socket.id,
        description: payload.description,
      });
    });

    socket.on("webrtc:answer", (payload) => {
      io.to(payload.targetSocketId).emit("webrtc:answer", {
        from: socket.user,
        fromSocketId: socket.id,
        description: payload.description,
      });
    });

    socket.on("webrtc:ice-candidate", (payload) => {
      io.to(payload.targetSocketId).emit("webrtc:ice-candidate", {
        from: socket.user,
        fromSocketId: socket.id,
        candidate: payload.candidate,
      });
    });

    socket.on("disconnect", () => {
      leaveFocusRoom(io, socket, true);

      const record = onlineUsers.get(userId);
      if (!record) return;

      record.socketIds.delete(socket.id);
      if (record.socketIds.size === 0) {
        onlineUsers.delete(userId);
      } else {
        onlineUsers.set(userId, record);
      }

      emitPresence(io);
    });
  });

  server.listen(port, hostname, () => {
    console.log(`Gradee Next server running on http://${hostname}:${port}`);
  });
});
