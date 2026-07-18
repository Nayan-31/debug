import { io } from 'socket.io-client';

const socketUrl = "https://debug-kd8c.onrender.com"

// Single production-grade socket instance
export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export default socket;
