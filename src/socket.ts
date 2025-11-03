import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001"; // Replace with your backend URL

// Create a single socket instance
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // connect manually later
});

// Join a specific post room to receive comments in real-time
export const joinPostRoom = (postId: number) => {
  socket.emit("join", `post_${postId}`);
};

// Join personal user room to receive notifications
export const joinUserRoom = (userId: number) => {
  socket.emit("join", `user_${userId}`);
};
