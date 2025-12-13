# Architecture & Technical Explanation

## System Overview

This payment system is built as a full-stack Next.js application using the App Router architecture. It implements a professional payment flow with Stripe's Payment Intents API and webhook-based confirmation.

## Payment Flow Diagram

```
User → Click Tip Button
  ↓
Frontend → POST /api/create-payment-intent
  ↓
Backend → Create Stripe Payment Intent
  ↓
Backend → Store Transaction (status: pending)
  ↓
Backend → Return clientSecret
  ↓
Frontend → Display Stripe Payment Element
  ↓
User → Enter Card Details
  ↓
Frontend → stripe.confirmPayment()
  ↓
Stripe → Process Payment
  ↓
┌─────────────────┬─────────────────┐
│                 │                 │
Immediate Response  Webhook Event
│                 │                 │
↓                 ↓                 ↓
Update UI      POST /api/webhook
                ↓
            Verify Signature
                ↓
            Update Transaction Status
                ↓
            Dashboard Auto-Refreshes
```

## Database Design

### Storage Mechanism

The application uses a file-based JSON database (`data/transactions.json`) for simplicity. In production, this would be replaced with a proper database like PostgreSQL or MongoDB.

### Transaction Lifecycle

1. **Pending**: Created when payment intent is created, before user confirms payment
2. **Succeeded**: Updated via webhook when Stripe confirms successful payment
3. **Failed**: Updated via webhook when payment fails
4. **Canceled**: Updated via webhook when payment is canceled

### Data Integrity

- Transactions are stored immediately upon payment intent creation
- Webhook updates ensure eventual consistency
- File writes are atomic (write to temp file, then rename)
- All amounts stored in cents to avoid floating-point errors

## API Endpoints

### POST /api/create-payment-intent

**Purpose**: Create a Stripe Payment Intent and initialize transaction

**Request Body**:
```json
{
  "streamerId": "streamer_1",
  "amount": 500  // in cents
}
```

**Response**:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "transactionId": "txn_1234567890_abc123"
}
```

**Process**:
1. Validate input (streamer exists, amount > 0)
2. Calculate fees (20% platform, 80% streamer)
3. Create Stripe Payment Intent with metadata
4. Store transaction in database (status: pending)
5. Return clientSecret for frontend

### POST /api/webhook

**Purpose**: Handle Stripe webhook events

**Headers**:
- `stripe-signature`: Webhook signature for verification

**Process**:
1. Verify webhook signature using Stripe secret
2. Parse event type
3. Update transaction status based on event
4. Return 200 OK

**Events Handled**:
- `payment_intent.succeeded` → status: 'succeeded'
- `payment_intent.payment_failed` → status: 'failed'
- `payment_intent.canceled` → status: 'canceled'

### GET /api/transactions

**Purpose**: Fetch all transactions and platform statistics

**Response**:
```json
{
  "transactions": [...],
  "stats": {
    "totalTransactions": 10,
    "totalAmount": 50000,
    "totalPlatformFee": 10000,
    "totalStreamerAmount": 40000
  }
}
```

### GET /api/streamers

**Purpose**: Fetch list of available streamers

**Response**:
```json
[
  {
    "id": "streamer_1",
    "name": "GamingPro",
    "description": "Professional gamer streaming FPS games"
  },
  ...
]
```

## Frontend Architecture

### Component Structure

```
app/
├── page.tsx              # Home page with streamer list
├── dashboard/
│   └── page.tsx          # Transaction dashboard
└── payment-success/
    └── page.tsx          # Payment confirmation page

components/
├── StreamerList.tsx      # Displays 3 streamers with tip buttons
└── TipModal.tsx          # Payment modal with Stripe Elements
```

### State Management

- React hooks (`useState`, `useEffect`) for local state
- No global state management needed (simple app)
- Real-time updates via polling (dashboard refreshes every 5s)

### Stripe Integration

- Uses `@stripe/react-stripe-js` for Payment Element
- Client-side payment confirmation
- Handles 3D Secure authentication automatically
- Error handling with user-friendly messages

## Security Considerations

### 1. Webhook Signature Verification

All webhooks are verified using Stripe's signature verification:

```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

This ensures:
- Request came from Stripe
- Request wasn't tampered with
- Replay attacks are prevented

### 2. Server-Side Payment Intent Creation

Payment intents are created server-side to:
- Prevent client-side manipulation
- Keep secret key secure
- Validate business logic before payment

### 3. Environment Variables

Sensitive keys stored in `.env.local`:
- Never committed to git
- Loaded at runtime
- Different values for dev/prod

### 4. Input Validation

All inputs validated:
- Amount must be positive and >= $0.50
- Streamer must exist
- Payment intent ID must be valid

## Fee Calculation

### Formula

```typescript
const platformFee = Math.round(amount * 0.2);  // 20%
const streamerAmount = amount - platformFee;    // 80%
```

### Why Round?

Stripe amounts are in cents (integers). Rounding ensures:
- No fractional cents
- Consistent calculations
- Proper accounting

### Example

$10.00 tip:
- Total: 1000 cents
- Platform Fee: 200 cents (20%)
- Streamer Amount: 800 cents (80%)

## Error Handling Strategy

### Frontend Errors

- Payment failures: Display error message, allow retry
- Network errors: Show retry option
- Invalid inputs: Disable submit button

### Backend Errors

- Validation errors: Return 400 with error message
- Stripe errors: Log and return 500
- Database errors: Log and return 500

### Webhook Errors

- Invalid signature: Return 400
- Unknown event: Log and return 200 (idempotent)
- Update failures: Log for manual review

## Performance Optimizations

1. **File-Based DB**: Fast for small datasets, no network latency
2. **Polling Interval**: 5 seconds balances freshness vs. server load
3. **Client-Side Rendering**: Fast initial load, smooth interactions
4. **Stripe Elements**: Optimized payment form, handles SCA automatically

## Scalability Considerations

### Current Limitations

- File-based storage doesn't scale beyond single server
- No database transactions (could lose data on crash)
- Polling increases load with many users

### Production Improvements

1. **Database**: PostgreSQL with proper transactions
2. **Caching**: Redis for frequently accessed data
3. **WebSockets**: Real-time updates instead of polling
4. **Queue**: Background job processing for webhooks
5. **CDN**: Static asset delivery
6. **Load Balancer**: Multiple server instances

## Testing Strategy

### Manual Testing

1. Test successful payment with card 4242...
2. Test failed payment with card 4000...
3. Verify transaction appears in dashboard
4. Verify 80/20 split is correct
5. Test webhook with Stripe CLI

### Automated Testing (Future)

- Unit tests for fee calculation
- Integration tests for API endpoints
- E2E tests for payment flow
- Webhook signature verification tests

## Deployment Checklist

- [ ] Set production Stripe keys
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up SSL certificate (required for webhooks)
- [ ] Configure domain and DNS
- [ ] Set up monitoring and alerts
- [ ] Test webhook delivery
- [ ] Load test payment flow
- [ ] Set up backup strategy

## Monitoring & Observability

### Key Metrics to Track

- Payment success rate
- Average payment amount
- Platform fee revenue
- Failed payment reasons
- Webhook delivery success rate
- API response times

### Logging

- All payment intents created
- All webhook events received
- All database operations
- All errors with stack traces

## Compliance & Legal

### PCI Compliance

- Stripe handles card data (PCI Level 1 compliant)
- No card data stored in our system
- Payment Element is PCI compliant

### Data Privacy

- Transaction data stored securely
- Customer email optional
- GDPR considerations for EU users

---

This architecture provides a solid foundation for a payment system that can scale to production with proper database and infrastructure upgrades.





