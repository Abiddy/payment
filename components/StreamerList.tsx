'use client';

import { useState, useEffect } from 'react';

interface Streamer {
  id: string;
  name: string;
  description?: string;
}

interface StreamerListProps {
  onTipClick: (streamerId: string, streamerName: string, amount: number) => void;
}

const TIP_AMOUNTS = [5, 10, 25];

export default function StreamerList({ onTipClick }: StreamerListProps) {
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
      <div className="flex justify-center items-center py-20">
        <div className="text-xl text-gray-600">Loading streamers...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {streamers.map((streamer) => (
        <div
          key={streamer.id}
          className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
        >
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white">
              {streamer.name.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{streamer.name}</h2>
            {streamer.description && (
              <p className="text-gray-600 text-sm">{streamer.description}</p>
            )}
          </div>

          <div className="space-y-3">
            {TIP_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => onTipClick(streamer.id, streamer.name, amount)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
              >
                Tip ${amount}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}




