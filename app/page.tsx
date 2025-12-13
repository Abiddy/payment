'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Navbar from '@/components/Navbar';
import StreamerSidebar from '@/components/StreamerSidebar';
import StreamerView from '@/components/StreamerView';
import Toast from '@/components/Toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Streamer {
  id: string;
  name: string;
  description?: string;
}

export default function Home() {
  const [selectedStreamerId, setSelectedStreamerId] = useState<string | null>(null);
  const [selectedStreamer, setSelectedStreamer] = useState<Streamer | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load streamers and set first one as default
  useEffect(() => {
    fetch('/api/streamers')
      .then(res => res.json())
      .then((data: Streamer[]) => {
        if (data.length > 0) {
          setSelectedStreamerId(data[0].id);
          setSelectedStreamer(data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching streamers:', err);
        setLoading(false);
      });
  }, []);

  // Update selected streamer when ID changes
  useEffect(() => {
    if (selectedStreamerId) {
      fetch('/api/streamers')
        .then(res => res.json())
        .then((data: Streamer[]) => {
          const streamer = data.find(s => s.id === selectedStreamerId);
          if (streamer) {
            setSelectedStreamer(streamer);
          }
        })
        .catch(err => {
          console.error('Error fetching streamer:', err);
        });
    }
  }, [selectedStreamerId]);

  const handleStreamerSelect = (streamerId: string) => {
    setSelectedStreamerId(streamerId);
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-[#0e0e10] flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <StreamerSidebar
            selectedStreamerId={selectedStreamerId}
            onStreamerSelect={handleStreamerSelect}
          />
          {loading ? (
            <div className="flex-1 bg-[#0e0e10] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <StreamerView
              streamer={selectedStreamer}
              onPaymentSuccess={() => setShowSuccessToast(true)}
            />
          )}
        </div>
      </div>
      <Toast
        message="Your payment was successful!"
        type="success"
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
      />
    </Elements>
  );
}




