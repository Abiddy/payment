'use client';

import { useState, useEffect } from 'react';

interface Streamer {
  id: string;
  name: string;
  description?: string;
}

interface StreamerSidebarProps {
  selectedStreamerId: string | null;
  onStreamerSelect: (streamerId: string) => void;
}

export default function StreamerSidebar({
  selectedStreamerId,
  onStreamerSelect,
}: StreamerSidebarProps) {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/streamers')
      .then(res => res.json())
      .then(data => {
        setStreamers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching streamers:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-64 bg-transparent flex flex-col items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-transparent flex flex-col">
      <div className="flex flex-col py-4 gap-2">
      {streamers.map((streamer) => (
        <button
          key={streamer.id}
          onClick={() => onStreamerSelect(streamer.id)}
          className={`relative group w-full flex items-center gap-3 px-4 py-2 hover:bg-[#26262c] transition-colors rounded-lg ${
            selectedStreamerId === streamer.id ? 'bg-[#26262c]' : ''
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-base flex-shrink-0 transition-all ${
              selectedStreamerId === streamer.id ? '' : ''
            }`}
            style={{
              background: selectedStreamerId === streamer.id
                ? '#22c55e'
                : '#16a34a',
            }}
          >
            {streamer.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className={`text-white font-medium text-sm truncate text-left ${
              selectedStreamerId === streamer.id ? 'text-green-500' : ''
            }`}>
              {streamer.name}
            </p>
            {streamer.description && (
              <p className="text-[#adadb8] text-xs truncate font-light text-left">{streamer.description}</p>
            )}
          </div>
          {selectedStreamerId === streamer.id && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r"></div>
          )}
        </button>
          ))}
      </div>
    </div>
  );
}

