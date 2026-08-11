import React from 'react';

export default function TypingIndicator({ typingUsers, allUsers, currentUserId }) {
  // Only show typing indicator for the OTHER user
  const others = typingUsers.filter((id) => id !== currentUserId);
  if (others.length === 0) return null;

  const typingName = allUsers.find((u) => others.includes(u.id))?.username || 'Someone';

  return (
    <div className="flex items-end gap-2 mb-2 animate-fade-in">
      {/* Spacer matching avatar width */}
      <div className="w-8 flex-shrink-0" />

      <div className="bg-dark-700 border border-dark-600 rounded-2xl rounded-bl-md px-4 py-3 shadow-md">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-dark-300 animate-bounce-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
          <span className="text-xs text-dark-400 ml-1">{typingName} is typing…</span>
        </div>
      </div>
    </div>
  );
}