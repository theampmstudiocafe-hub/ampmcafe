# THE AM:PM STUDIO (Pune)
## Complete Platform Handover & Deployment Guide

> **Single Backend • Unified Auth • Single Supabase Postgres Database**  
> **Phase 1 (Delivered)**: Public Experience, Member Booking, Credit Ledgers, Razorpay, Community Chat & Admin Portal  
> **Phase 2 (Ready in Schema)**: PMS, P&L, Staff Management, Recipes, Inventory Movements  
> **Phase 3 (Ready in Schema)**: Table QR Dine-in, 3-Station KOT Pipeline, Zomato/Swiggy Adapter

---

## 1. Architectural Principles & Client Ownership Guarantee

This digital platform has been architected under strict non-negotiable security and client-ownership principles:
1. **Zero Developer-Owned Keys**: Every cloud account (Supabase, Razorpay, Custom SMTP Mailer, Meta WhatsApp Cloud API, Vercel/Hosting) is owned directly by the **CLIENT**. No personal or developer-owned intermediary keys exist in the system.
2. **Deny-by-Default Row Level Security (RLS)**: Enforced directly at the PostgreSQL kernel level across all 36 tables for 9 distinct roles (`visitor`, `member`, `trainer`, `front_desk`, `kitchen_staff`, `inventory_staff`, `manager`, `admin`, `owner`).
3. **Immutable Credit & Inventory Ledgers**: Class packs do not increment a mutable number; every purchase, session booking, cancellation, expiry, and administrative adjustment writes an atomic, tamper-proof record to `credit_ledger` and `audit_logs`.
4. **Member Privacy**: Members in the community chat and public views appear strictly by their display name. Email, phone number, and internal UUIDs are strictly redacted from client payloads.
5. **Signed Webhooks Only**: Payments are never confirmed from client-side callbacks. Fulfillment is executed only upon verifying the Razorpay HMAC-SHA256 signature in the webhook handler.

---

## 2. Environment Variables & Setup Guide

Create a `.env.local` file in the project root based on `.env.example`:

```bash
# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# 1. Supabase (PostgreSQL, Auth, Realtime, Storage)
# Created in client's own Supabase project: Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 2. Razorpay Payment Gateway (Client Account)
# Dashboard -> Settings -> API Keys & Webhooks
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_yourkey
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_custom_webhook_secret

# 3. Transactional Email (Custom SMTP on Client Verified Domain)
# Domain must have valid SPF, DKIM, and DMARC records
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@yourdomain.com
SMTP_PASSWORD=your_smtp_app_password
SMTP_FROM_EMAIL=namaste@yourdomain.com
SMTP_FROM_NAME="THE AM:PM STUDIO"

# 4. Meta WhatsApp Cloud API (Multi-channel Fallback)
# Meta Business Suite -> WhatsApp Cloud API
WHATSAPP_API_TOKEN=your_meta_system_user_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token

# 5. Security & Maintenance
CRON_SECRET=generate-random-32-character-secret
```

---

## 3. Database Deployment & Migration Sequence

All database tables, enums, triggers, and stored procedures are organized in `supabase/migrations/`. In your Supabase SQL Editor or via Supabase CLI (`supabase db push`), run them in sequence:

1. `20261007000001_initial_schema.sql` (Creates all 36 tables for Phases 1–3 including recipes, inventory movements, KOT stations, orders, and feedback).
2. `20261007000002_rls_policies.sql` (Applies deny-by-default RLS and security access definitions for all 9 roles).
3. `20261007000003_ledger_procedures.sql` (Deploys atomic transaction procedures `fund_user_pack_credits`, `deduct_booking_credit`, and `refund_booking_credit`).
4. `20261007000004_reporting_views.sql` (Deploys read-optimized views `v_daily_sales_pnl` and `v_ingredient_days_of_supply`).
5. `20261007000005_seed_data.sql` (Seeds initial Koregaon Park studio profile, trainers, class types, pack pricing tiers, and café menu).

---

## 4. Verification & Testing Suite

Four comprehensive test suites validate the platform's security and business logic. Run them with Node.js:

```bash
# 1. Test RLS role isolation and OTP cooldown logic
node scripts/test-rls-and-auth.mjs

# 2. Test Booking engine, early-expiry pack priority, Razorpay webhooks, and 12h policy
node scripts/test-milestone2-booking-payments.mjs

# 3. Test Community chat privacy, announcements, rate limiting, and 1-click delete
node scripts/test-milestone4-community.mjs

# 4. Test Admin portal role guards, pack management, trial overrides, and audit logs
node scripts/test-milestone5-admin.mjs
```

All 86 test assertions currently pass with zero failures.

---

## 5. Operational Manual for Studio Staff & Admins

### 5.1 Member Booking & Cancellation Policy
- **Booking Flow**: Members can book regular classes using credits from their active pack or their one-time complimentary free trial.
- **Entitlement Engine**: If a member holds multiple packs, the system automatically draws from the pack with the **earliest expiration date**.
- **12-Hour Cancellation Rule**: Cancellations made **12 or more hours** prior to the class start time refund the credit immediately back to the pack and ledger. Cancellations within 12 hours forfeit the credit as per studio policy.

### 5.2 Managing Class Packs (`/admin/packs`)
- To create a new pack or seasonal promotion, visit `/admin/packs` and click **"Create New Pack"**.
- Set the title, price in ₹, credits, validity in days, and display order.
- Packs can be activated or deactivated with a single click. Deactivated packs remain in historical ledgers but are hidden from the public checkout.

### 5.3 Community Moderation (`/admin/moderation` & `/community`)
- Regular members can only post in the main circle under their display name.
- Only Instructors and Admins can post official announcements and pin them to the top banner.
- Any message flagged by a member appears in the Moderation Queue at `/admin/moderation`.
- Instructors and Admins have a **1-Click Quick Delete** button on any message and can issue a temporary mute (1 hour to 7 days) or permanent ban.

### 5.4 Free Trial Abuse Safeguards (`/admin/trials`)
- To protect against duplicate account creation, the system hashes phone numbers (SHA-256) and normalizes email aliases (`user+trial2@gmail.com` -> `user@gmail.com`).
- Flagged duplicates are highlighted for front desk and admin review. Staff can either **Approve (Override)** or **Revoke** the booking with one click.

---

## 6. Future Phases Expansion Roadmap (Zero Refactoring)

Because the full database schema and domain types were deployed from Day 1:
- **Phase 2 (PMS & Operations)**: Expands `/admin` to include P&L dashboards (`v_daily_sales_pnl`), staff employee records (`staff_members`), recipe bill-of-materials (`recipes`), supplier purchase orders (`purchase_orders`), and ingredient days-of-supply (`v_ingredient_days_of_supply`).
- **Phase 3 (Dine-In QR Ordering & Kitchen KOTs)**: Activates QR dining tables (`dining_tables`), menu item routing to 3 kitchen stations (`food`, `beverage`, `dessert`), and aggregator order intake via `external_order_id` and channel adapter webhooks.

---

*Delivered for THE AM:PM STUDIO, Koregaon Park, Pune.*
