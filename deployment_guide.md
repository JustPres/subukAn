# subukAn Production Deployment Manual

This guide provides a comprehensive, step-by-step walkthrough for deploying the **subukAn** platform to production. It covers configuring your source control, connecting Vercel, setting up environment variables, running migrations, and configuring payment webhooks.

---

## Table of Contents
1. [GitHub Repository Setup](#1-github-repository-setup)
2. [Vercel Project Setup](#2-vercel-project-setup)
3. [Environment Variables Configuration](#3-environment-variables-configuration)
4. [Supabase Production Database Migrations](#4-supabase-production-database-migrations)
5. [PayMongo Webhook Registration](#5-paymongo-webhook-registration)
6. [Post-Deployment Verification](#6-post-deployment-verification)

---

## 1. GitHub Repository Setup

To deploy your application, you must push your local repository to a remote GitHub repository that Vercel can access.

### Prerequisites
* A GitHub account.
* Git installed locally.
* A newly created, empty repository on GitHub.

### Step-by-Step Instructions
1. **Initialize the local Git repository** (if not already initialized):
   ```bash
   git init
   ```
2. **Add the remote repository**:
   Replace `<username>` and `<repo-name>` with your actual GitHub credentials:
   ```bash
   git remote add origin https://github.com/<username>/<repo-name>.git
   ```
3. **Ensure you are on the `master` branch**:
   Rename the current active branch to `master` to match the target release workflow:
   ```bash
   git branch -M master
   ```
4. **Commit local changes**:
   Stage and commit all files in your project directory:
   ```bash
   git add .
   git commit -m "Initialize project for production deployment"
   ```
5. **Push to the remote repository**:
   Push the `master` branch to GitHub and set the upstream tracking:
   ```bash
   git push -u origin master
   ```

---

## 2. Vercel Project Setup

Vercel hosts the Next.js frontend and serverless API endpoints.

### Step-by-Step Instructions
1. **Sign In to Vercel**:
   Go to the [Vercel Dashboard](https://vercel.com/dashboard) and sign in using your GitHub account.
2. **Import Repository**:
   * Click the **Add New...** button and select **Project**.
   * Under "Import Git Repository", find your `subukAn` repository and click **Import**.
3. **Configure Project Settings**:
   * **Framework Preset**: Select **Next.js** (detected automatically).
   * **Root Directory**: `./` (default).
   * **Build Command**: `next build` (default).
   * **Output Directory**: `.next` (default).
   * **Install Command**: `npm install` (default).
4. **Click Deploy**:
   > [!NOTE]
   > The initial build might fail or deploy with default configurations until environment variables are fully configured in the next step. This is normal.

---

## 3. Environment Variables Configuration

The application relies on private API keys and URLs to communicate with Supabase and PayMongo. You must define these keys in Vercel to allow the serverless functions to run correctly. For reference, you can look at [.env.example](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/.env.example).

### Required Environment Variables

| Variable Name | Exposure / Scope | Source / Dashboard | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client & Server) | Supabase Dashboard $\rightarrow$ Settings $\rightarrow$ API $\rightarrow$ Project URL | The base API URL for your Supabase project instance. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client & Server) | Supabase Dashboard $\rightarrow$ Settings $\rightarrow$ API $\rightarrow$ Project API Keys (`anon` public) | The public anonymous API key for client-side queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Private (Server-only)** | Supabase Dashboard $\rightarrow$ Settings $\rightarrow$ API $\rightarrow$ Project API Keys (`service_role` secret) | Overrides RLS. **Never expose this to client bundles.** |
| `PAYMONGO_SECRET_KEY` | **Private (Server-only)** | PayMongo Dashboard $\rightarrow$ Developers $\rightarrow$ API Keys | API key for authentication. For live, use `sk_live_...`. |
| `PAYMONGO_WEBHOOK_SECRET` | **Private (Server-only)** | PayMongo Dashboard $\rightarrow$ Webhooks $\rightarrow$ Click Webhook | Created in [Step 5](#5-paymongo-webhook-registration). Verifies webhook authenticity. |
| `CRON_SECRET` | **Private (Server-only)** | Generate secure random string (e.g., `openssl rand -hex 32`) | A secret token protecting administrative cron routes from unauthorized invocation. |

### How to Add Variables in Vercel
1. Go to your project page in Vercel.
2. Navigate to **Settings** $\rightarrow$ **Environment Variables**.
3. Copy each variable name and value from the table above.
4. Keep the environments checked (Production, Preview, Development) as needed.
5. Click **Save** for each variable.

> [!WARNING]
> Keep `SUPABASE_SERVICE_ROLE_KEY` and `PAYMONGO_SECRET_KEY` private. Never name them with a `NEXT_PUBLIC_` prefix, as Vercel will bundle public variables into the client-side JavaScript.

---

## 4. Supabase Production Database Migrations

You must apply your schema migrations to your live Supabase database instance to set up all tables, triggers, and relations.

The project migrations are located under [supabase/migrations](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/supabase/migrations):
* [00001_initial_schema.sql](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/supabase/migrations/00001_initial_schema.sql)
* [00002_timed_display_tasks.sql](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/supabase/migrations/00002_timed_display_tasks.sql)
* [00003_demographics_and_quick_impression.sql](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/supabase/migrations/00003_demographics_and_quick_impression.sql)

### Option A: Using the Supabase CLI (Recommended)
This is the standard approach, using Supabase CLI to push local migrations.

1. **Install the Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```
2. **Log In to Supabase**:
   ```bash
   supabase login
   ```
   Follow the CLI prompt to authorize via the browser or enter your access token.
3. **Link Your Local Project to Production**:
   Locate your Reference ID in the Supabase Dashboard under **Project Settings** $\rightarrow$ **General Settings** (e.g. `https://supabase.com/dashboard/project/abcde12345`).
   ```bash
   supabase link --project-ref <your-production-project-ref>
   ```
   *Note: This will ask for your database password. Enter the password you used during project creation.*
4. **Push Migrations**:
   Execute the following command to apply all migrations in `supabase/migrations/`:
   ```bash
   supabase db push
   ```
   This will automatically detect and execute any unapplied migrations on the production server.

### Option B: Manual Execution via SQL Editor (Fallback)
If you cannot use the CLI, you can manually run the queries in the dashboard.

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to the **SQL Editor** tab from the left sidebar.
3. Create a new query by clicking **New Query**.
4. Run each migration SQL file **in chronological order**:
   * Open and copy the SQL code from [00001_initial_schema.sql](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/supabase/migrations/00001_initial_schema.sql).
   * Paste it into the SQL Editor and click **Run**.
   * Repeat the process for [00002_timed_display_tasks.sql](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/supabase/migrations/00002_timed_display_tasks.sql) next.
   * Finally, run [00003_demographics_and_quick_impression.sql](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/supabase/migrations/00003_demographics_and_quick_impression.sql).

> [!IMPORTANT]
> The migrations must be run sequentially (00001 $\rightarrow$ 00002 $\rightarrow$ 00003). Running them out of order will cause errors due to missing tables and database relations.

---

## 5. PayMongo Webhook Registration

PayMongo must notify your application's webhook endpoint when checkout sessions or payments are completed. The endpoint file is located at [route.ts](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/app/api/webhooks/paymongo/route.ts).

### Option A: Webhook for Vercel Production (Recommended)

1. **Identify Your Endpoint URL**:
   Your production endpoint is:
   ```text
   https://<your-vercel-domain-name>.vercel.app/api/webhooks/paymongo
   ```
2. **Log In to PayMongo Dashboard**:
   Go to the [PayMongo Dashboard](https://dashboard.paymongo.com).
3. **Register Webhook**:
   * Navigate to the **Webhooks** tab in the sidebar.
   * Click **Create a new webhook** or **Add Endpoint**.
   * In the **Endpoint URL** field, paste your production URL.
4. **Select Events**:
   Check the box next to each of the following events:
   * ☑️ **Link**: `link.payment.paid`
   * ☑️ **Checkout Session**: `checkout_session.payment.paid`
   * ☑️ **Payment**: `payment.paid`, `payment.failed`
   * ☑️ **Payout**: `payout.deposited`, `payout.returned`
5. **Create Webhook**:
   Click **Create Webhook** to generate your endpoint credentials.
6. **Obtain Webhook Secret**:
   * Copy the generated Webhook Secret Key (starts with `whsk_test_...` or `whsk_live_...`).
   * Go back to Vercel $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**.
   * Update or add `PAYMONGO_WEBHOOK_SECRET` with this key.
   * Trigger a redeployment in Vercel to apply the new secret.

### Option B: Webhook for Local Development (ngrok Fallback)
To test webhooks on your local computer (`http://localhost:3000`):

1. **Install and run ngrok** in your terminal:
   ```bash
   npx ngrok http 3000
   ```
2. **Copy the Public URL**:
   Ngrok will provide a public URL (e.g. `https://a1b2c3d4.ngrok-free.app`).
3. **Register Webhook in PayMongo Dashboard**:
   * **Endpoint URL**: `https://a1b2c3d4.ngrok-free.app/api/webhooks/paymongo`
   * Check the same event boxes (`link.payment.paid`, `payout.deposited`, etc.).
4. **Copy the Webhook Secret**:
   Copy the generated `whsk_test_...` key into your local `.env.local` file:
   ```env
   PAYMONGO_WEBHOOK_SECRET=whsk_test_...
   ```

---

## 6. Post-Deployment Verification

After completing the steps above, perform the following sanity checks:

- [ ] **Database Connection**: Navigate to the production login page. Register or log in to confirm that users are written to the database.
- [ ] **Checkout Redirect**: Attempt to initiate a test payment to ensure you are redirected to the PayMongo checkout screen.
- [ ] **Webhook Verification**: Pay a test checkout session, then check the Vercel Function logs to verify that the webhook endpoint ([route.ts](file:///C:/Users/justi/.gemini/antigravity/brain/8aa8e88c-c8d0-4358-9493-7ca4fdb4f4a4/.system_generated/worktrees/subagent-Documentation-Writer-technical-writer-5fbdc647/app/api/webhooks/paymongo/route.ts)) returns a `200 OK` status and executes successfully.