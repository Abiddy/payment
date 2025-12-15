# Streamer Tipping Platform with Stripe

A professional, production-ready payment system built with Next.js, TypeScript, and Stripe Test Mode. This platform allows users to tip streamers with automatic 80/20 revenue split (80% to streamer, 20% platform fee).

## Demo


https://github.com/user-attachments/assets/0b217b72-5bb0-4a16-87ce-0b1b1094dbaa



## 🚀 Features

- **3 Mock Streamers** with tip buttons ($5, $10, $25)
- **Stripe Payment Processing** using Payment Intents API
- **Webhook Integration** for reliable payment confirmation
- **Transaction Dashboard** with real-time 80/20 breakdown
- **Mock Database** storing all transaction data
- **Modern UI** with Tailwind CSS
- **Type-Safe** with TypeScript

## 📋 Prerequisites

- Node.js 18+ installed
- Stripe account with Test Mode keys
- npm or yarn package manager

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Stripe Test Mode Keys (get these from https://dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Webhook Secret (get this after setting up webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Stripe Webhook (for local development)

For local development, use Stripe CLI to forward webhooks:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhook`
4. Copy the webhook signing secret and add it to `.env.local`

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing with Stripe Test Cards

### Success Card
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### Decline Card
- **Card Number:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

## 📊 Database Schema

The mock database stores transactions in `data/transactions.json` with the following schema:

```typescript
interface Transaction {
  id: string;                    // Unique transaction ID (e.g., "txn_1234567890_abc123")
  streamer_id: string;            // Streamer identifier (e.g., "streamer_1")
  streamer_name: string;          // Streamer display name (e.g., "GamingPro")
  amount: number;                 // Total amount in cents (e.g., 500 = $5.00)
  platform_fee: number;           // Platform fee in cents (20% of amount)
  streamer_amount: number;         // Streamer payout in cents (80% of amount)
  payment_id: string;             // Stripe Payment Intent ID (e.g., "pi_1234567890")
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  currency: string;               // Currency code (e.g., "usd")
  customer_email?: string;        // Optional customer email
  timestamp: string;              // ISO 8601 timestamp of payment
  created_at: string;             // ISO 8601 timestamp of record creation
  updated_at: string;             // ISO 8601 timestamp of last update
}
```

### Database Fields Explanation

- **id**: Auto-generated unique identifier for each transaction
- **streamer_id**: Links transaction to specific streamer
- **streamer_name**: Human-readable streamer name for display
- **amount**: Total payment amount in cents (Stripe uses cents)
- **platform_fee**: Calculated as 20% of amount, rounded to nearest cent
- **streamer_amount**: Calculated as 80% of amount (amount - platform_fee)
- **payment_id**: Stripe Payment Intent ID for tracking and reconciliation
- **status**: Payment lifecycle state (pending → succeeded/failed/canceled)
- **currency**: Always "usd" for this implementation
- **timestamp**: When the payment was processed
- **created_at/updated_at**: Database record timestamps

## 💳 Payment Processing Flow

### 1. User Initiates Payment

1. User clicks tip button ($5, $10, or $25)
2. Modal opens with Stripe Payment Element
3. Frontend calls `/api/create-payment-intent`

### 2. Payment Intent Creation

**Endpoint:** `POST /api/create-payment-intent`

**Process:**
- Validates streamer exists
- Calculates fees (20% platform, 80% streamer)
- Creates Stripe Payment Intent with metadata
- Stores transaction in database with `pending` status
- Returns `clientSecret` to frontend

**Code Location:** `app/api/create-payment-intent/route.ts`

### 3. Payment Confirmation

1. User enters card details in Payment Element
2. Frontend calls `stripe.confirmPayment()` with clientSecret
3. Stripe processes payment
4. Two paths for confirmation:
   - **Immediate**: Payment status returned in response
   - **Webhook**: Stripe sends event to webhook endpoint

### 4. Webhook Processing

**Endpoint:** `POST /api/webhook`

**Process:**
- Verifies webhook signature for security
- Handles events:
  - `payment_intent.succeeded` → Update transaction to `succeeded`
  - `payment_intent.payment_failed` → Update transaction to `failed`
  - `payment_intent.canceled` → Update transaction to `canceled`
- Updates database transaction status

**Code Location:** `app/api/webhook/route.ts`

### 5. Transaction Storage

- All transactions stored in `data/transactions.json`
- File-based storage for simplicity (production would use PostgreSQL/MongoDB)
- Atomic writes ensure data consistency
- Auto-creates `data/` directory if missing

## 🔐 Security Features

1. **Webhook Signature Verification**: All webhooks verified using Stripe signing secret
2. **Server-Side Payment Intent Creation**: Prevents client-side manipulation
3. **Environment Variables**: Sensitive keys stored in `.env.local` (not committed)
4. **Type Safety**: TypeScript prevents common errors
5. **Input Validation**: Amount and streamer validation before processing

## 📈 Dashboard Features

The dashboard (`/dashboard`) displays:

- **Statistics Cards:**
  - Total successful transactions
  - Total amount processed
  - Total platform fees (20%)
  - Total streamer payouts (80%)

- **Visual Breakdown:**
  - Progress bars showing 80/20 split
  - Color-coded revenue streams

- **Transaction Table:**
  - All transactions with full details
  - Status badges (succeeded/failed/pending/canceled)
  - Real-time updates (refreshes every 5 seconds)
  - Formatted currency and timestamps

## 🏗️ Architecture

```
stripe/
├── app/
│   ├── api/
│   │   ├── create-payment-intent/  # Creates Stripe Payment Intent
│   │   ├── webhook/                 # Handles Stripe webhooks
│   │   ├── transactions/           # Fetches all transactions
│   │   ├── streamers/               # Fetches streamer list
│   │   └── check-payment/           # Checks payment status
│   ├── dashboard/                   # Dashboard page
│   ├── payment-success/             # Success page
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home page with streamers
│   └── globals.css                  # Global styles
├── components/
│   ├── StreamerList.tsx            # Streamer cards with tip buttons
│   └── TipModal.tsx                # Payment modal with Stripe Element
├── lib/
│   ├── db.ts                        # Mock database implementation
│   └── stripe.ts                    # Stripe client initialization
└── data/
    └── transactions.json            # Transaction storage (auto-created)
```

## 🔄 Webhook Setup for Production

For production deployment:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copy webhook signing secret to environment variables

## 🚨 Error Handling

- Payment failures gracefully handled with user-friendly messages
- Database errors logged to console
- Webhook verification failures return 400 status
- Missing environment variables throw clear errors

## 📝 Key Implementation Details

### Why Payment Intents?

Payment Intents API is Stripe's recommended approach for:
- Strong Customer Authentication (SCA) compliance
- Handling 3D Secure authentication
- Better error handling
- Idempotent operations

### Why Webhooks?

Webhooks provide:
- Reliable payment confirmation (even if user closes browser)
- Asynchronous processing
- Event-driven architecture
- Audit trail

### Why 80/20 Split?

- Standard industry split for creator platforms
- Calculated server-side to prevent manipulation
- Stored in database for transparency
- Displayed in dashboard for verification

## 🧪 Testing Checklist

- [x] Success payment with test card 4242 4242 4242 4242
- [x] Failed payment with test card 4000 0000 0000 0002
- [x] Transaction appears in dashboard
- [x] 80/20 split calculated correctly
- [x] Webhook updates transaction status
- [x] Dashboard refreshes automatically
- [x] Multiple streamers can receive tips
- [x] Payment modal handles errors gracefully

## 🎯 Production Considerations

For production deployment, consider:

1. **Database**: Replace JSON file with PostgreSQL/MongoDB
2. **Authentication**: Add user authentication
3. **Rate Limiting**: Implement API rate limiting
4. **Logging**: Add structured logging (Winston, Pino)
5. **Monitoring**: Add error tracking (Sentry)
6. **Testing**: Add unit and integration tests
7. **CI/CD**: Set up deployment pipeline
8. **SSL**: Ensure HTTPS for webhook endpoints
9. **Backup**: Implement database backups
10. **Compliance**: Add GDPR/PCI compliance measures

## 📚 Resources

- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Next.js Documentation](https://nextjs.org/docs)

## 📄 License

This project is for demonstration purposes.

---

**Built with ❤️ using Next.js, TypeScript, and Stripe**





