import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001", {
      transports: ["websocket"],
    });
  }
  return socketInstance;
}

// Export socket for direct usage (initializes if not already)
export const socket = getSocket();


