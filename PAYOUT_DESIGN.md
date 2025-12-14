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

**Answer:** From my understanding, the 80/20 split is calculated after we convert points to cash. The process works as follows: (1) Points are first converted to their cash-equivalent value, (2) Stripe fees are deducted from that cash amount, (3) The 80/20 split is then applied to the net amount (after Stripe fees). For example: User tips 5,000 points ($50 cash value) to a streamer. After Stripe fee ($1.75), net is $48.25. Platform gets $9.65 (20%), streamer balance increases by $38.60 (80%).

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

**Answer:** Fraud can be managed and litigated in a number of ways, we could implement a 7-day hold period where purchased points are held before they can be used for tipping, allowing time for payment disputes to surface. For purchases over $100, we could require identity verification (KYC) before points are activated. We could also implement rate limiting on point purchases to prevent rapid buy-tip-dispute cycles (e.g., max 3 purchases per hour, max $500 per day per user). Additionally, we could flag suspicious patterns through transaction monitoring (e.g., new account → large purchase → immediate tip → chargeback) for manual review, and leverage Stripe's built-in fraud detection (Stripe Radar) to flag high-risk transactions before processing.

## 3. Streamer Account Balance Management

We manage streamer balances using three states: **Pending Balance** (tips not yet cleared, held for 7 days for fraud prevention), **Available Balance** (money cleared and ready for payout), and **Paid Out** (money transferred to streamer's bank account). Balances are calculated from the existing `transactions` table by summing `streamer_amount_actual` for succeeded transactions, with pending balance including transactions within the 7-day hold period and available balance including older transactions. We maintain a `streamer_balances` table as a performance cache with fields: `streamer_id`, `pending_balance`, `available_balance`, `total_paid_out`, and `updated_at`. This table is updated in real-time when transactions succeed (via webhook) and when payouts are processed.

In Stripe, we identify streamer transactions using metadata with `streamer_id`, while in our database we use `streamer_id` as the primary identifier. We track payouts in a separate `payouts` table with fields: `payout_id`, `streamer_id`, `amount`, `stripe_payout_id` (links to Stripe's payout record), `status` ('pending', 'paid', 'failed'), `created_at`, and `paid_at`. When a payout is created, we deduct from `available_balance` and create a `payouts` record. When Stripe confirms the payout via webhook, we update the `payouts.status` to 'paid' and add to `total_paid_out`. Both cash tips and point tips contribute to the same balance—point tips convert to cash immediately when tipped (as per our design), and both create entries in the `transactions` table with the same `streamer_id`, so they're aggregated together in the balance calculation.

Streamer balances are displayed in a streamer dashboard showing `pending_balance`, `available_balance`, and payout history. Balances are managed in our database (our source of truth), while Stripe is used for actual payout execution. We reconcile daily by comparing `available_balance + total_paid_out` against Stripe's transfer records, matching `payouts.stripe_payout_id` with Stripe payout objects, and flagging any discrepancies for manual review.

## 4. Payout System Requirements & Caveats

We use **Stripe Express accounts** for streamers, which provides a streamlined onboarding experience while maintaining platform control. Express accounts allow streamers to complete onboarding directly through Stripe's hosted interface, requiring minimal integration work on our end. The onboarding flow: (1) Streamer requests payout for the first time, (2) We create a Stripe Express account for them, (3) Streamer completes Stripe's hosted onboarding (identity verification, bank account linking), (4) Once verified, payouts are enabled. We chose Express over Standard because it offers faster onboarding and better UX, while Custom accounts would require more compliance overhead and development complexity.

Streamers can withdraw funds on a **weekly basis** with a **minimum threshold of $50**. This policy balances streamer needs for regular access to earnings while reducing processing costs and administrative overhead. The weekly schedule allows funds to accumulate slightly, making payouts more meaningful, while the $50 minimum ensures payout fees are reasonable relative to the amount. As mentioned earlier in section 3, funds move from pending balance (7-day hold period for fraud prevention) to available balance automatically, and only available balance is eligible for payout.

Payout requirements include: (1) **Verified identity** - streamers must complete Stripe's KYC verification during onboarding, (2) **Linked bank account** - required for receiving payouts, (3) **Minimum balance** - $50 available balance threshold, (4) **Holding period complete** - as mentioned in section 2, we implement a 7-day hold period for fraud prevention, so tips must be at least 7 days old to move from pending to available balance. Payouts are blocked if: (1) There are pending disputes or chargebacks on transactions, (2) Available balance is below the $50 minimum threshold, (3) Streamer account is suspended or under review, (4) Identity verification is incomplete or failed, (5) Bank account is not linked or verification failed. We also leverage Stripe Radar (as mentioned in section 2) to flag high-risk transactions that could lead to disputes, which may delay or block payouts until resolved.

## 5. Technical Implementation
