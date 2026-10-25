import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : window.location.origin;

class SocketService {
  socket = null;

  connect(token) {
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('[SOCKET] Connected to gateway');
    });

    this.socket.on('connect_error', (err) => {
      console.error('[SOCKET] Connection Error:', err.message);
    });

    return this.socket;
  }

  joinSession(sessionId) {
    if (this.socket) {
      this.socket.emit('join_exam_session', sessionId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();
