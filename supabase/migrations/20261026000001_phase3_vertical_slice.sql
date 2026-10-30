-- ==============================================================================
-- PUNE YOGA STUDIO & CAFÉ PLATFORM
-- Migration: Phase 3 Vertical Slice & Core Schema Extensions
-- ==============================================================================

-- 1. Extend dining_tables with status, hold_expires_at, and active_order_id
ALTER TABLE dining_tables 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available',
ADD COLUMN IF NOT EXISTS active_order_id UUID,
ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;

-- 2. Extend orders with integer paise columns and idempotency key
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS subtotal_paise INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_gst_paise INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_charge_paise INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_paise INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- 3. Extend kots with acceptance and rejection statuses if needed
-- Status supports: 'pending', 'accepted', 'preparing', 'ready', 'served', 'rejected'
ALTER TABLE kots 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_prep_at TIMESTAMPTZ;

-- 4. Create daily_kot_counters table for fast atomic KOT sequences (not gapless)
CREATE TABLE IF NOT EXISTS daily_kot_counters (
    operational_date DATE NOT NULL,
    station kitchen_station_enum NOT NULL,
    last_seq INT NOT NULL DEFAULT 0,
    PRIMARY KEY (operational_date, station)
);

-- 5. Create print_jobs table with structured JSON payload rendered at send time
CREATE TABLE IF NOT EXISTS print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    kot_id UUID REFERENCES kots(id) ON DELETE SET NULL,
    station kitchen_station_enum,
    job_type TEXT NOT NULL,                -- 'kot_ticket', 'cancelled_slip', 'customer_receipt'
    printer_target TEXT NOT NULL,          -- 'printer_food', 'printer_bev', 'printer_dessert', 'printer_pos'
    status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'printed', 'failed'
    job_data JSONB NOT NULL,               -- Structured JSON rendered to ESC/POS at send time
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    printed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_print_jobs_pending ON print_jobs(status, created_at) WHERE status IN ('queued', 'failed');

-- 6. Add default cafe billing settings if not present
INSERT INTO business_settings (key, value, description)
VALUES (
    'cafe_billing_settings',
    '{
        "food_gst_percent": 5.0,
        "service_charge_percent": 0.0,
        "service_charge_enabled": false,
        "business_day_cutoff_time": "04:00",
        "unaccepted_order_alert_minutes": 5,
        "gstin": "27AAAAA0000A1Z5",
        "fssai_license": "11521034000123",
        "restaurant_name": "THE AM:PM CAFE",
        "restaurant_address": "Lane 6, Koregaon Park, Pune 411001"
    }'::jsonb,
    'Configurable tax rates, service charge, and operational settings for Pune Cafe (Pending CA Confirmation)'
)
ON CONFLICT (key) DO NOTHING;
