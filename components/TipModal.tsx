'use client';

import { useState, useEffect, useRef } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';

interface TipModalProps {
  streamerId: string;
  streamerName: string;
  amount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function PaymentForm({
  clientSecret,
  streamerName,
  amount,
  onClose,
  onPaymentSuccess,
}: {
  clientSecret: string;
  streamerName: string;
  amount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setIsProcessing(false);
    } else {
      // Payment succeeded
      onPaymentSuccess();
      router.refresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium text-gray-800">
            Tip {streamerName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
          <p className="text-sm text-gray-600 mb-1 font-light">Amount</p>
          <p className="text-3xl font-medium text-green-600">${amount}.00</p>
        </div>

        <form onSubmit={handleSubmit}>
          <PaymentElement />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !stripe}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {isProcessing ? 'Processing...' : `Pay $${amount}.00`}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center font-light">
          <p>Test Card: 4242 4242 4242 4242</p>
          <p>Use any future expiry date and any CVC</p>
        </div>
      </div>
    </div>
  );
}

export default function TipModal({
  streamerId,
  streamerName,
  amount,
  onClose,
  onPaymentSuccess,
}: TipModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Fetch payment intent when modal opens (with guard to prevent duplicate calls)
  useEffect(() => {
    // Prevent multiple calls (e.g., from React Strict Mode)
    if (hasInitialized.current || clientSecret) {
      return;
    }

    hasInitialized.current = true;
    let isCancelled = false;

    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        streamerId,
        amount: amount * 100, // Convert to cents
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (isCancelled) return;
        
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch(err => {
        if (isCancelled) return;
        setError('Failed to initialize payment');
        console.error(err);
      });

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [streamerId, amount, clientSecret]);

  if (!clientSecret) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-700 font-light">Initializing payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            <p className="text-red-600 mb-4 font-light">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        clientSecret={clientSecret}
        streamerName={streamerName}
        amount={amount}
        onClose={onClose}
        onPaymentSuccess={onPaymentSuccess}
      />
    </Elements>
  );
}
