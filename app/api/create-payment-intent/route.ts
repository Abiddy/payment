import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamerId, amount } = body;

    if (!streamerId || !amount) {
      return NextResponse.json(
        { error: 'Missing streamerId or amount' },
        { status: 400 }
      );
    }

    // Validate amount (must be positive and in cents)
    if (amount <= 0 || amount < 50) {
      return NextResponse.json(
        { error: 'Amount must be at least $0.50' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const streamer = db.getStreamerById(streamerId);

    if (!streamer) {
      return NextResponse.json(
        { error: 'Streamer not found' },
        { status: 404 }
      );
    }

    // Stripe fee constants
    const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
    const STRIPE_FIXED_FEE = 30; // $0.30 in cents

    // Calculate estimated Stripe fee
    const stripeFeeEstimated = Math.round((amount * STRIPE_PERCENTAGE_FEE) + STRIPE_FIXED_FEE);
    
    // Calculate estimated net amount (after Stripe fees)
    const netAmountEstimated = amount - stripeFeeEstimated;
    
    // Calculate estimated splits (20% platform, 80% streamer) based on NET amount
    const platformFeeEstimated = Math.round(netAmountEstimated * 0.20);
    const streamerAmountEstimated = netAmountEstimated - platformFeeEstimated;
    
    // Legacy fields for backward compatibility (using estimated values)
    const platformFee = platformFeeEstimated;
    const streamerAmount = streamerAmountEstimated;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: {
        streamer_id: streamerId,
        streamer_name: streamer.name,
        stripe_fee_estimated: stripeFeeEstimated.toString(),
        net_amount_estimated: netAmountEstimated.toString(),
        platform_fee_estimated: platformFeeEstimated.toString(),
        streamer_amount_estimated: streamerAmountEstimated.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store transaction in database with pending status
    const transaction = db.createTransaction({
      streamer_id: streamerId,
      streamer_name: streamer.name,
      amount: amount,
      stripe_fee_estimated: stripeFeeEstimated,
      net_amount_estimated: netAmountEstimated,
      platform_fee_estimated: platformFeeEstimated,
      streamer_amount_estimated: streamerAmountEstimated,
      // Legacy fields for backward compatibility
      platform_fee: platformFee,
      streamer_amount: streamerAmount,
      payment_id: paymentIntent.id,
      status: 'pending',
      currency: 'usd',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}




