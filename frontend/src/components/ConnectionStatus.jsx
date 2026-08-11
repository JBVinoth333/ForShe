import React from 'react';

export default function ConnectionStatus({ connected }) {
  if (connected) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-red-900/80 border border-red-700 backdrop-blur-sm text-red-300
                      text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        Reconnecting…
      </div>
    </div>
  );
}