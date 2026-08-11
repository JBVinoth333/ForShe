import React, { useState } from 'react';

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Avatar({ username, size = 'sm' }) {
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';
  const colors = {
    vinoth:   'from-brand-600 to-brand-400',
    ishwarya: 'from-accent-500 to-pink-400',
  };
  const gradient = colors[username?.toLowerCase()] || 'from-dark-500 to-dark-400';
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center
                  font-semibold text-white flex-shrink-0 shadow-md`}
    >
      {initials}
    </div>
  );
}

export default function MessageBubble({ message, isMine, showAvatar }) {
  const [imgError, setImgError] = useState(false);

  const bubbleBase = `max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl
                      rounded-2xl px-4 py-2.5 shadow-md animate-slide-up`;

  const mineBubble  = `${bubbleBase} bg-gradient-to-br from-brand-600 to-brand-500 text-white
                        rounded-br-md`;
  const theirBubble = `${bubbleBase} bg-dark-700 text-white border border-dark-600 rounded-bl-md`;

  return (
    <div className={`flex items-end gap-2 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (only on the other person's side) */}
      <div className="w-8 flex-shrink-0">
        {!isMine && showAvatar && <Avatar username={message.sender_username} />}
      </div>

      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-full`}>
        {/* Sender name (only for other person, only when avatar shown) */}
        {!isMine && showAvatar && (
          <span className="text-xs text-dark-300 mb-1 ml-1 font-medium">
            {message.sender_username}
          </span>
        )}

        {/* Bubble */}
        <div className={isMine ? mineBubble : theirBubble}>
          {message.type === 'image' && message.image_url && !imgError ? (
            <div className="overflow-hidden rounded-xl">
              <img
                src={message.image_url}
                alt="Shared image"
                className="max-w-full rounded-xl object-contain cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: '300px' }}
                onError={() => setImgError(true)}
                onClick={() => window.open(message.image_url, '_blank')}
              />
              {message.content && (
                <p className="mt-2 text-sm leading-relaxed">{message.content}</p>
              )}
            </div>
          ) : message.type === 'image' && imgError ? (
            <p className="text-sm text-dark-300 italic">Image unavailable</p>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-dark-400 mt-1 mx-1">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}