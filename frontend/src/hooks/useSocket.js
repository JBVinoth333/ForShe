import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function useSocket(token) {
  const socketRef              = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages]       = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setConnected(false);
    });

    // New message received
    socket.on('message:new', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Online / offline presence
    socket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Typing indicators
    socket.on('typing:start', ({ userId }) => {
      setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    socket.on('typing:stop', ({ userId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const sendMessage = useCallback((data) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        return reject(new Error('Not connected'));
      }
      socketRef.current.emit('message:send', data, (ack) => {
        if (ack?.error) reject(new Error(ack.error));
        else resolve(ack);
      });
    });
  }, []);

  const startTyping = useCallback(() => {
    socketRef.current?.emit('typing:start');
  }, []);

  const stopTyping = useCallback(() => {
    socketRef.current?.emit('typing:stop');
  }, []);

  return {
    connected,
    onlineUsers,
    messages,
    setMessages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
  };
}
