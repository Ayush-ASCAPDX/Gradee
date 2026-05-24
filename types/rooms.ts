export type PresenceEntry = {
  userId: string;
  primarySocketId: string | null;
  socketCount: number;
};

export type RoomCount = {
  roomId: string;
  count: number;
};

export type RoomParticipant = {
  userId: string;
  name: string;
  username: string;
  primarySocketId: string;
};
