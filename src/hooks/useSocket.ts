import { io, Socket } from "socket.io-client";
import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:user", user.id);
      if (user.role === "admin") {
        socket.emit("join:admin");
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return socketRef;
}
