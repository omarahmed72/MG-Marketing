import { io } from "../index.js";

export function emitToUser(userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToAdmin(event: string, data: unknown) {
  io.to("admin").emit(event, data);
}

export function emitToAll(event: string, data: unknown) {
  io.emit(event, data);
}
