import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __mongooseCache__: MongooseCache | undefined;
}

const cache = global.__mongooseCache__ ?? {
  conn: null,
  promise: null,
};

global.__mongooseCache__ = cache;

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
