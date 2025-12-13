import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentIntent = searchParams.get('payment_intent');

  if (!paymentIntent) {
    return NextResponse.json(
      { error: 'Missing payment_intent parameter' },
      { status: 400 }
    );
  }

  try {
    const db = getDatabase();
    const transaction = db.getTransactionByPaymentId(paymentIntent);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: transaction.status,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        streamer_name: transaction.streamer_name,
      },
    });
  } catch (error) {
    console.error('Error checking payment:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}




