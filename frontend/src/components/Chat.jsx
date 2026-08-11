import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import ConnectionStatus from './ConnectionStatus.jsx';

const API_BASE = import.meta.env.VITE_API_URL || '';

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

function Avatar({ username, size = 'md', online }) {
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';
  const colors = {
    vinoth: 'from-brand-600 to-brand-400',
    ishwarya: 'from-accent-500 to-pink-400',
  };
  const gradient = colors[username?.toLowerCase()] || 'from-dark-500 to-dark-400';
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-semibold text-white shadow-md`}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-dark-800 ${online ? 'bg-green-400' : 'bg-dark-500'}`}
        />
      )}
    </div>
  );
}

export default function Chat() {
  const { user, token, logout } = useAuth();
  const { connected, onlineUsers, messages, setMessages, typingUsers, sendMessage, startTyping, stopTyping } =
    useSocket(token);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const OTHER_USERNAME = user?.username === 'vinoth' ? 'ishwarya' : 'vinoth';
  const otherUserOnline = onlineUsers.some((id) => id !== user?.id);

  // Load message history
  useEffect(() => {
    if (!token || historyLoaded) return;
    axios
      .get(`${API_BASE}/api/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setMessages(res.data.messages || []);
        setHistoryLoaded(true);
      })
      .catch((err) => console.error('Failed to load history:', err));
  }, [token, historyLoaded, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Typing management
  const handleStopTyping = useCallback(() => {
    if (isTyping) {
      stopTyping();
      setIsTyping(false);
    }
  }, [isTyping, stopTyping]);

  const debouncedStop = useDebounce(handleStopTyping, 1500);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isTyping) {
      startTyping();
      setIsTyping(true);
    }
    debouncedStop();
  };

  // Send text message
  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !connected) return;
    setInput('');
    setSending(true);
    setError('');
    handleStopTyping();
    try {
      await sendMessage({ content: text, type: 'text' });
    } catch (err) {
      setError(err.message || 'Failed to send message');
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  // Upload & send image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Max 10MB.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post(`${API_BASE}/api/messages/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      await sendMessage({ type: 'image', imageUrl: res.data.imageUrl });
    } catch (err) {
      setError(err?.response?.data?.error || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Enter = send, Shift+Enter = newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Group messages for avatar display
  const groupedMessages = messages.map((msg, idx) => {
    const prev = messages[idx - 1];
    return { ...msg, showAvatar: !prev || prev.sender_id !== msg.sender_id };
  });

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col" style={{ maxHeight: '100dvh', overflow: 'hidden' }}>
      <ConnectionStatus connected={connected} />

      {/* Header */}
      <header className="flex-shrink-0 bg-dark-900 border-b border-dark-700 px-4 py-3 flex items-center justify-between shadow-xl z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💜</span>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">ForShe</h1>
            <p className="text-dark-400 text-xs">Private chat</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar username={OTHER_USERNAME} size="sm" online={otherUserOnline} />
            <div className="hidden sm:block">
              <p className="text-white text-sm font-medium capitalize">{OTHER_USERNAME}</p>
              <p className={`text-xs ${otherUserOnline ? 'text-green-400' : 'text-dark-400'}`}>
                {otherUserOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />

          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {messages.length === 0 && historyLoaded && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20 animate-fade-in">
            <div className="text-6xl">💜</div>
            <p className="text-dark-400 text-center text-sm">No messages yet. Say hi to {OTHER_USERNAME}!</p>
          </div>
        )}

        {groupedMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.sender_id === user?.id}
            showAvatar={msg.showAvatar}
          />
        ))}

        <TypingIndicator
          typingUsers={typingUsers}
          allUsers={[
            { id: user?.id, username: user?.username },
            { id: null, username: OTHER_USERNAME },
          ]}
          currentUserId={user?.id}
        />

        <div ref={messagesEndRef} />
      </main>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 bg-red-900/40 border-t border-red-800 px-4 py-2 flex items-center justify-between animate-fade-in">
          <p className="text-red-400 text-xs">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 text-xs ml-4">✕</button>
        </div>
      )}

      {/* Input area */}
      <footer className="flex-shrink-0 bg-dark-900 border-t border-dark-700 px-4 py-3">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* Image upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !connected}
            title="Send image"
            className="flex-shrink-0 p-2.5 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          {/* Text input */}
          <div className="flex-1">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={connected ? `Message ${OTHER_USERNAME}…` : 'Connecting…'}
              disabled={!connected || sending}
              rows={1}
              className={[
                'w-full bg-dark-700 border border-dark-500 rounded-2xl px-4 py-3',
                'text-white placeholder-dark-400 focus:outline-none resize-none',
                'focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
                'transition-colors disabled:opacity-50 max-h-32 overflow-y-auto text-sm',
              ].join(' ')}
              style={{ minHeight: '46px' }}
            />
          </div>

          {/* Send */}
          <button
            type="submit"
            disabled={!input.trim() || sending || !connected}
            className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-xs text-dark-500 capitalize">
            You: <span className="text-dark-400 font-medium">{user?.username}</span>
          </span>
          <span className="text-xs text-dark-600">Enter to send</span>
        </div>
      </footer>
    </div>
  );
}
