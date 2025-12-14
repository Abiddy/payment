# Payout Architecture Design Document

## 1. 80/20 Revenue Split - How It Works

When a customer tips a streamer, Stripe deducts processing fees (2.9% + $0.30) before the funds reach our account. We split the **net amount** (after Stripe fees), not the gross amount. The platform takes 20% of the net, and the streamer receives 80% of the net. For eg. , on a $10.00 tip: Stripe takes $0.59, leaving $9.41 net. The platform gets $1.88 (20%) and the streamer gets $7.53 (80%).

```
$10.00 (Gross)
  ↓
- $0.59 (Stripe Fee: 2.9% + $0.30)
  ↓
$9.41 (Net)
  ↓
├─ $1.88 (Platform: 20%)
└─ $7.53 (Streamer: 80%)
```

We use a two-phase approach: at payment intent creation, we calculate estimated values using the standard Stripe fee (2.9% + $0.30) for immediate display. When payment succeeds via webhook, we fetch the actual Stripe fee from Stripe's Balance Transaction API and recalculate the splits, as fees can vary for international cards or different payment methods.

**Database Storage:** We store both estimated and actual values in the `transactions` table. Key fields include `amount` (gross), `stripe_fee_estimated`/`stripe_fee_actual`, `net_amount_estimated`/`net_amount_actual`, and `platform_fee_estimated`/`platform_fee_actual` and `streamer_amount_estimated`/`streamer_amount_actual`. We rely on Stripe as the source of truth for actual fees, while our database stores calculations for reporting, reconciliation, and payout processing.

## 2. Points System Implementation on 80/20 Split

### When do points convert to cash? (Immediately when tipped? Or when a streamer requests payout?)

**Answer:** Points convert to cash **immediately when tipped**. When a user tips a streamer with points, the cash-equivalent value is calculated and the streamer's available balance increases right away. However, the actual funds remain in our Stripe account until the streamer requests a payout. This means: (1) Points → Cash conversion happens at tip time, (2) Streamer balance updates instantly, (3) Physical payout to streamer happens later when they request it.

### 80/20 split applies to points the same as cash tips. Show calculation example.

**Answer:** The 80/20 split applies identically to points as it does to cash tips. The calculation is based on the cash-equivalent value of the points after Stripe fees. For example: User buys 10,000 points ($100), tips 5,000 points ($50) to a streamer. After Stripe fee ($1.75), net is $48.25. Platform gets $9.65 (20%), streamer balance increases by $38.60 (80%).

```
5,000 points ($50.00 cash value)
  ↓
- $1.75 (Stripe Fee: 2.9% + $0.30)
  ↓
$48.25 (Net)
  ↓
├─ $9.65 (Platform: 20%)
└─ $38.60 (Streamer: 80% → added to available balance)
```

### Database schema: How do you track user point balances, point purchases, point tips, and point-to-cash conversion?

**Answer:** We track points using three main tables:

- **`user_points`**: Stores user point balances with fields: `user_id`, `balance` (current available points), `purchased` (total points ever purchased), `spent` (total points ever spent), `created_at`, `updated_at`.

- **`point_purchases`**: Records each point purchase with fields: `purchase_id`, `user_id`, `amount_paid` (in cents), `points_awarded`, `stripe_payment_id`, `status` ('pending', 'succeeded', 'failed'), `created_at`.

- **`point_tips`**: Tracks point tips with fields: `tip_id`, `user_id`, `streamer_id`, `points_amount`, `cash_value` (points × 0.01), `stripe_fee`, `platform_fee`, `streamer_amount`, `status`, `transaction_id` (links to main `transactions` table), `created_at`.

Point tips create entries in the main `transactions` table with a `source_type` field set to `'points'` (vs `'cash'` for direct tips). This allows unified reporting while maintaining the distinction between payment methods.

### Can users refund unused points? What happens to points already tipped to streamers?

**Answer:** **Unused points** can be refunded within 30 days of purchase if no tips have been made with those points. Once points are tipped to a streamer, they **cannot be refunded** because they've already been converted to cash and added to the streamer's balance. Refund logic: (1) Check if points were used within 30 days, (2) If unused, process refund via Stripe and deduct from `user_points.balance`, (3) If used, refund is denied and user is notified that tips cannot be reversed.

### How do you prevent fraud (users buying points with stolen cards, tipping, then disputing)?

**Answer:** We implement multiple fraud prevention measures:

1. **7-day hold period**: Purchased points are held for 7 days before they can be used for tipping. This allows time for payment disputes to surface.

2. **Identity verification**: For purchases over $100, require identity verification (KYC) before points are activated.

3. **Rate limiting**: Implement rate limiting on point purchases to prevent rapid buy-tip-dispute cycles (e.g., max 3 purchases per hour, max $500 per day per user).

4. **Transaction monitoring**: Flag suspicious patterns (e.g., new account → large purchase → immediate tip → chargeback) for manual review.

5. **Stripe Radar**: Leverage Stripe's built-in fraud detection to flag high-risk transactions before processing.

## 3. Streamer Account Balance Management

## 4. Payout System Requirements & Caveats

## 5. Technical Implementation
