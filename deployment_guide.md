# PayMongo Webhook & API Key Setup Guide

This guide explains how to set up your PayMongo API Keys and Webhook Endpoint for both **Local Testing** and **Vercel Production**.

---

## 1. PayMongo API Keys

In your PayMongo Dashboard (`https://dashboard.paymongo.com`):
1. Go to **Developers** $\rightarrow$ **API Keys**.
2. Copy your **Secret Key** (e.g., `sk_test_...`).
3. Add it to your `.env.local` file:
   ```env
   PAYMONGO_SECRET_KEY=sk_test_...
   ```

---

## 2. Setting Up the Webhook Endpoint

PayMongo requires a **publicly accessible HTTPS URL** to send webhook events when payments or payouts are processed.

### Path in SubukAn App
```text
/api/webhooks/paymongo
```

---

### Option A: Webhook for Vercel Production / Staging (Recommended)
Once you deploy SubukAn to Vercel (e.g. `https://subukan.vercel.app`):

1. Go to PayMongo Dashboard $\rightarrow$ **Webhooks** $\rightarrow$ **Create a new webhook**.
2. **Endpoint URL:**
   ```text
   https://your-app-name.vercel.app/api/webhooks/paymongo
   ```
3. **Select Events (Check these boxes on the screen):**
   - ☑️ **Link**: `link.payment.paid`
   - ☑️ **Checkout Session**: `checkout_session.payment.paid`
   - ☑️ **Payment**: `payment.paid`, `payment.failed`
   - ☑️ **Payout**: `payout.deposited`, `payout.returned`
4. Click **Create Webhook**.
5. Copy the generated **Webhook Secret Key** (`whsk_test_...` or `whsk_live_...`).
6. Add it to your Vercel Environment Variables:
   ```env
   PAYMONGO_WEBHOOK_SECRET=whsk_test_...
   ```

---

### Option B: Webhook for Local Development (ngrok)
To test webhooks on your local computer (`http://localhost:3000`):

1. Install and run **ngrok** in your terminal:
   ```bash
   npx ngrok http 3000
   ```
2. Ngrok will give you a public URL (e.g. `https://a1b2c3d4.ngrok-free.app`).
3. In PayMongo Dashboard $\rightarrow$ **Webhooks** $\rightarrow$ **Create a new webhook**:
   - **Endpoint URL:** `https://a1b2c3d4.ngrok-free.app/api/webhooks/paymongo`
   - Check the same event boxes (`link.payment.paid`, `payout.deposited`, etc.).
4. Copy the generated `whsk_test_...` key into `.env.local`:
   ```env
   PAYMONGO_WEBHOOK_SECRET=whsk_test_...
   ```

---

## 3. Summary of `.env.local` Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PayMongo
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_WEBHOOK_SECRET=whsk_test_...

# Cron Security
CRON_SECRET=your-random-cron-secret-key
```
