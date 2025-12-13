'use client';

import { useState } from 'react';
import TipModal from './TipModal';

interface Streamer {
  id: string;
  name: string;
  description?: string;
}

interface StreamerViewProps {
  streamer: Streamer | null;
  onPaymentSuccess: () => void;
}

export default function StreamerView({ streamer, onPaymentSuccess }: StreamerViewProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!streamer) {
    return (
      <div className="flex-1 bg-[#0e0e10] flex items-center justify-center">
        <div className="text-center text-[#efeff1]">
          <p className="text-xl">Select a streamer to view their stream</p>
        </div>
      </div>
    );
  }

  const handleTipClick = (amount: number) => {
    setSelectedAmount(amount);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAmount(null);
  };

  return (
    <div className="flex-1 bg-[#0e0e10] flex flex-col p-4">
      {/* Stream Area */}
      <div className="flex-1 relative bg-[#1f1f23] flex items-center justify-center rounded-xl overflow-hidden">
        {/* Live Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className="bg-red-600 text-white px-3 py-1 rounded font-medium text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </div>
          <div className="bg-black/60 text-white px-3 py-1 rounded text-sm font-light">
            1.2K viewers
          </div>
        </div>

        {/* Stub Stream Content */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-[#efeff1]">
            <div className="mb-4">
              <svg
                className="w-24 h-24 mx-auto text-green-500 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-2xl font-medium mb-2">Streaming Live</p>
            <p className="text-[#adadb8] font-light">{streamer.name} is currently live</p>
          </div>
        </div>
      </div>

      {/* Streamer Profile Section */}
      <div className="flex items-center gap-4 px-4 py-3 mt-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-medium text-xl flex-shrink-0"
          style={{
            background: '#22c55e',
          }}
        >
          {streamer.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-medium text-lg">{streamer.name}</h2>
          </div>
          {streamer.description && (
            <p className="text-[#adadb8] text-sm font-light mt-1">{streamer.description}</p>
          )}
        </div>
      </div>

      {/* Tip Buttons Section */}
      <div className="bg-transparent rounded-xl p-6 mt-4">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-white font-medium mb-4 text-center">Support {streamer.name}</h3>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleTipClick(5)}
              className="bg-green-500 text-white font-medium px-8 py-3 rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
            >
              Tip $5
            </button>
            <button
              onClick={() => handleTipClick(10)}
              className="bg-green-500 text-white font-medium px-8 py-3 rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
            >
              Tip $10
            </button>
            <button
              onClick={() => handleTipClick(25)}
              className="bg-green-500 text-white font-medium px-8 py-3 rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
            >
              Tip $25
            </button>
          </div>
        </div>
      </div>

      {/* Tip Modal */}
      {isModalOpen && selectedAmount && (
        <TipModal
          streamerId={streamer.id}
          streamerName={streamer.name}
          amount={selectedAmount}
          onClose={handleCloseModal}
          onPaymentSuccess={() => {
            onPaymentSuccess();
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
}

