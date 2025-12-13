'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (paymentIntent) {
      // Check payment status
      fetch(`/api/check-payment?payment_intent=${paymentIntent}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'succeeded') {
            setStatus('success');
          } else {
            setStatus('error');
          }
        })
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [paymentIntent]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-normal">Processing payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-normal text-gray-800 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6 font-normal">
            There was an issue processing your payment. Please try again.
          </p>
          <Link
            href="/"
            className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg font-normal hover:bg-green-600 transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-normal text-gray-800 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6 font-normal">
          Thank you for your tip! The streamer will receive 80% of your payment.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-normal hover:bg-green-600 transition-colors"
          >
            Tip Another Streamer
          </Link>
          <Link
            href="/dashboard"
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-normal hover:bg-green-600 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-normal">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

