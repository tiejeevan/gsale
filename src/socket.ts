import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL

// Create a single shared socket instance
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // we connect manually from NotificationsContext or Post context
  transports: ["websocket"], // more stable
});

// ✅ Utility to join a post room (for live comments)
export const joinPostRoom = (postId: number) => {
  if (socket.connected) {
    socket.emit("join", `post_${postId}`);
  }
};

// ✅ Utility to join a user room (for live notifications)
export const joinUserRoom = (userId: number) => {
  if (socket.connected) {
    const roomName = `user_${userId.toString()}`;
    socket.emit("join", roomName);
  }
};
