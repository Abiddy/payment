import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDatabase } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const db = getDatabase();

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent succeeded:', paymentIntentSucceeded.id);
      
      try {
        // Fetch the actual Stripe fee from the charge/balance transaction
        let actualStripeFee = 0;
        
        const chargeId = typeof paymentIntentSucceeded.latest_charge === 'string' 
          ? paymentIntentSucceeded.latest_charge 
          : paymentIntentSucceeded.latest_charge?.id;
        
        if (chargeId) {
          // Get the charge to find the balance transaction
          const charge = await stripe.charges.retrieve(chargeId);
          
          const balanceTransactionId = typeof charge.balance_transaction === 'string'
            ? charge.balance_transaction
            : charge.balance_transaction?.id;
          
          if (balanceTransactionId) {
            // Get the balance transaction which contains the actual fee
            const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId);
            actualStripeFee = balanceTransaction.fee;
            console.log('Actual Stripe fee:', actualStripeFee, 'cents');
          }
        }
        
        // Update transaction with actual fees if we got them, otherwise just update status
        if (actualStripeFee > 0) {
          db.updateTransactionWithActualFees(paymentIntentSucceeded.id, actualStripeFee);
        } else {
          // Fallback: just update status if we couldn't fetch the fee
          console.warn('Could not fetch actual Stripe fee, using estimated values');
          db.updateTransaction(paymentIntentSucceeded.id, 'succeeded');
        }
      } catch (error: any) {
        console.error('Error fetching Stripe fee:', error.message);
        // Fallback: just update status
        db.updateTransaction(paymentIntentSucceeded.id, 'succeeded');
      }
      break;

    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent failed:', paymentIntentFailed.id);
      
      // Update transaction status to failed
      db.updateTransaction(paymentIntentFailed.id, 'failed');
      break;

    case 'payment_intent.canceled':
      const paymentIntentCanceled = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent canceled:', paymentIntentCanceled.id);
      
      // Update transaction status to canceled
      db.updateTransaction(paymentIntentCanceled.id, 'canceled');
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}




