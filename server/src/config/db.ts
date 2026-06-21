import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | null = null;
let _uri = "";

export function getMongoUri(): string {
  return _uri;
}

export async function connectDB(): Promise<void> {
  const extUri = process.env.MONGODB_URI;

  if (extUri) {
    try {
      await mongoose.connect(extUri);
      _uri = extUri;
      console.log("MongoDB connected successfully to external URI");
      return;
    } catch (error) {
      console.error("External MongoDB connection failed, falling back to in-memory:", error);
    }
  }

  console.log("Starting in-memory MongoDB...");
  mongod = await MongoMemoryServer.create();
  _uri = mongod.getUri();
  await mongoose.connect(_uri);
  console.log(`In-memory MongoDB started at ${_uri}`);
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

export async function stopMongoDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}
