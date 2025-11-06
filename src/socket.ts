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
    console.log("📝 Joining post room:", `post_${postId}`);
    socket.emit("join", `post_${postId}`);
  } else {
    console.warn("⚠️ Cannot join post room - socket not connected");
  }
};

// ✅ Utility to join a user room (for live notifications)
export const joinUserRoom = (userId: number) => {
  if (socket.connected) {
    const roomName = `user_${userId.toString()}`;
    console.log("🏠 Joining user room:", roomName);
    socket.emit("join", roomName);
    
    // Add confirmation listener
    socket.once("room_joined", (data: any) => {
      console.log("✅ Room join confirmed:", data);
    });
    
    // Also listen for generic join confirmation
    socket.once("joined", (room: string) => {
      console.log("✅ Generic join confirmation for room:", room);
    });
  } else {
    console.warn("⚠️ Cannot join user room - socket not connected");
  }
};
