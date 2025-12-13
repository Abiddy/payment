# Quick Start Guide

Get your Stripe payment system running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## Step 3: Create Environment File

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: For local development, you'll need to set up webhook forwarding (see Step 4).

## Step 4: Set Up Webhooks (Local Development)

### Option A: Using Stripe CLI (Recommended)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhook`
4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`

### Option B: Skip Webhooks (For Testing Only)

You can test payments without webhooks, but transaction status won't update automatically. The payment will still work, but you'll need to manually check the dashboard.

## Step 5: Run the Application

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 6: Test a Payment

1. Click on any streamer's tip button ($5, $10, or $25)
2. Use test card: **4242 4242 4242 4242**
3. Use any future expiry date (e.g., 12/34)
4. Use any 3-digit CVC (e.g., 123)
5. Use any ZIP code (e.g., 12345)
6. Click "Pay"

## Step 7: View Dashboard

1. Click "View Dashboard" on the home page
2. See all transactions with 80/20 breakdown
3. Dashboard auto-refreshes every 5 seconds

## Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Make sure `.env.local` exists in the root directory
- Restart the dev server after creating/updating `.env.local`

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- If using Stripe CLI, use the secret from the `stripe listen` command

### Payment not appearing in dashboard
- Check that webhook is set up correctly
- Check browser console for errors
- Verify transaction in Stripe Dashboard

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then `npm install`

## What to Show in Your Meeting

1. **Home Page**: Show the 3 streamers with tip buttons
2. **Payment Flow**: Click a tip button, enter test card, complete payment
3. **Dashboard**: Show transaction with 80/20 breakdown
4. **Multiple Payments**: Make several payments to different streamers
5. **Database**: Show `data/transactions.json` file with stored transactions

## Key Points to Explain

1. **Payment Processing**: Payment Intents API for secure payments
2. **Webhook Integration**: Reliable payment confirmation
3. **Database Schema**: All fields explained in README.md
4. **80/20 Split**: Calculated server-side, stored in database
5. **Security**: Webhook signature verification, server-side validation

## Next Steps

- Read `README.md` for detailed documentation
- Read `ARCHITECTURE.md` for technical deep-dive
- Customize streamers in `lib/db.ts`
- Add more features as needed

Happy coding! 🚀





