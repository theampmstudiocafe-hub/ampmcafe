-- ==============================================================================
-- PUNE YOGA STUDIO & CAFÉ PLATFORM
-- Migration 01: Complete Unified Schema (Phases 1, 2, and 3)
-- ==============================================================================

-- 1. ENUMS
CREATE TYPE app_role AS ENUM (
  'visitor',
  'member',
  'trainer',
  'front_desk',
  'kitchen_staff',
  'inventory_staff',
  'manager',
  'admin',
  'owner'
);

CREATE TYPE booking_type_enum AS ENUM ('class_session', 'one_on_one', 'event');
CREATE TYPE booking_status_enum AS ENUM ('confirmed', 'attended', 'cancelled', 'no_show');
CREATE TYPE payment_status_enum AS ENUM ('created', 'authorized', 'captured', 'failed', 'refunded', 'paid_by_aggregator');
CREATE TYPE ledger_entry_type AS ENUM ('purchase', 'booking_deduction', 'cancellation_refund', 'admin_adjustment', 'expiry');
CREATE TYPE kitchen_station_enum AS ENUM ('food', 'beverage', 'dessert');
CREATE TYPE kot_status_enum AS ENUM ('pending', 'in_progress', 'ready', 'served');
CREATE TYPE order_status_enum AS ENUM ('pending_payment', 'placed', 'preparing', 'served', 'completed', 'cancelled');
CREATE TYPE order_source_enum AS ENUM ('dine_in_qr', 'counter', 'zomato', 'swiggy', 'other');
CREATE TYPE settlement_status_enum AS ENUM ('pending', 'reconciled', 'disputed');
CREATE TYPE stock_movement_type_enum AS ENUM ('purchase', 'dish_sale_depletion', 'waste_spoilage', 'audit_adjustment', 'return');
CREATE TYPE po_status_enum AS ENUM ('draft', 'ordered', 'partially_received', 'received', 'cancelled');
CREATE TYPE feedback_target_enum AS ENUM ('booking', 'cafe_order', 'trainer', 'overall');

-- 2. AUTH, PROFILES & ROLES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    display_name TEXT NOT NULL,          -- Safe handle exposed in community chat
    email TEXT NOT NULL UNIQUE,
    phone TEXT,                          -- Optional phone number
    whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    muted_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL UNIQUE,     -- e.g. 'PUNE-EMP-001'
    department TEXT NOT NULL,             -- 'kitchen', 'inventory', 'front_desk', 'operations', 'studio'
    job_title TEXT NOT NULL,
    hourly_rate_inr INT,
    monthly_salary_inr INT,
    emergency_contact JSONB,
    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STUDIO: TRAINERS, CLASSES, SESSIONS, EVENTS
CREATE TABLE trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    bio TEXT NOT NULL,
    story TEXT NOT NULL,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    media_urls TEXT[] NOT NULL DEFAULT '{}',
    instagram_handle TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE class_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    default_capacity INT NOT NULL DEFAULT 15,
    color_hex TEXT NOT NULL DEFAULT '#657E6B',
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_type_id UUID NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
    room TEXT NOT NULL DEFAULT 'Main Shala',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INT NOT NULL DEFAULT 15,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_start ON class_sessions(start_time);

CREATE TABLE one_on_one_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    price_inr INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL DEFAULT 'Yoga Studio Pune',
    capacity INT NOT NULL DEFAULT 30,
    price_inr INT NOT NULL,
    image_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PACKS & CREDIT LEDGER
CREATE TABLE pack_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_inr INT NOT NULL,
    credits INT NOT NULL,
    validity_days INT NOT NULL,
    applicable_class_types UUID[],          -- NULL means valid for all classes
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pack_type_id UUID NOT NULL REFERENCES pack_types(id) ON DELETE RESTRICT,
    initial_credits INT NOT NULL,
    remaining_credits INT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',   -- 'active', 'depleted', 'expired', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_pack_id UUID NOT NULL REFERENCES user_packs(id) ON DELETE CASCADE,
    amount INT NOT NULL,                     -- Positive for credit, negative for debit
    entry_type ledger_entry_type NOT NULL,
    reference_id UUID,
    reason TEXT NOT NULL,
    balance_after INT NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ledger_user ON credit_ledger(user_id);
CREATE INDEX idx_ledger_pack ON credit_ledger(user_pack_id);

-- 5. BOOKINGS, TRIALS & WAITLIST
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_type booking_type_enum NOT NULL DEFAULT 'class_session',
    session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
    one_on_one_slot_id UUID REFERENCES one_on_one_slots(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_pack_id UUID REFERENCES user_packs(id) ON DELETE SET NULL,
    status booking_status_enum NOT NULL DEFAULT 'confirmed',
    is_trial BOOLEAN NOT NULL DEFAULT FALSE,
    credits_deducted INT NOT NULL DEFAULT 0,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_session ON bookings(session_id);

CREATE TABLE trial_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    phone_hash TEXT,
    normalized_email TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    is_flagged_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_by UUID REFERENCES profiles(id),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    position INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    offered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- 6. PAYMENTS, INVOICES & REFUNDS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_order_id TEXT NOT NULL UNIQUE,
    provider_payment_id TEXT UNIQUE,
    provider_signature TEXT,
    amount_inr INT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status payment_status_enum NOT NULL DEFAULT 'created',
    settlement_status settlement_status_enum NOT NULL DEFAULT 'pending',
    aggregator_reference TEXT,
    commission_amount_inr INT DEFAULT 0,
    net_settlement_inr INT,
    item_type TEXT NOT NULL,
    item_id UUID NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    subtotal_inr INT NOT NULL,
    tax_gst_inr INT NOT NULL DEFAULT 0,
    total_inr INT NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    provider_refund_id TEXT UNIQUE,
    amount_inr INT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. COMMUNITY, ANNOUNCEMENTS & MODERATION
CREATE TABLE community_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_display_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_announcement BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by UUID REFERENCES profiles(id),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_community_created ON community_messages(created_at DESC);

CREATE TABLE message_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    action_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    duration_minutes INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. BUSINESS SETTINGS & AUDIT LOG
CREATE TABLE business_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_role TEXT,
    action TEXT NOT NULL,
    resource_table TEXT NOT NULL,
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CAFÉ MENU, DINING TABLES, ORDERS & KOTS (PHASE 3)
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0,
    kitchen_station kitchen_station_enum NOT NULL DEFAULT 'food',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_inr INT NOT NULL,
    dietary_tags TEXT[] NOT NULL DEFAULT '{}',
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dining_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number TEXT NOT NULL UNIQUE,
    qr_code_token TEXT NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_mutation_id UUID UNIQUE,       -- For offline sync idempotency
    table_id UUID REFERENCES dining_tables(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    source order_source_enum NOT NULL DEFAULT 'dine_in_qr',
    external_order_id TEXT,
    order_number TEXT NOT NULL UNIQUE,
    status order_status_enum NOT NULL DEFAULT 'pending_payment',
    total_inr INT NOT NULL,
    aggregator_commission_inr INT DEFAULT 0,
    aggregator_payout_inr INT,
    payment_id UUID REFERENCES payments(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price_inr INT NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    kot_number TEXT NOT NULL UNIQUE,
    kitchen_station kitchen_station_enum NOT NULL,
    status kot_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE kot_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kot_id UUID NOT NULL REFERENCES kots(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    notes TEXT
);

-- 10. RECIPES & INVENTORY STOCK LEDGER (PHASE 2 & 3)
CREATE TABLE units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    symbol TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    unit_id UUID NOT NULL REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    minimum_stock_level NUMERIC(10, 2) NOT NULL DEFAULT 0,
    reorder_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE UNIQUE,
    yield_servings NUMERIC(6, 2) NOT NULL DEFAULT 1,
    preparation_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(recipe_id, ingredient_id)
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_mutation_id UUID UNIQUE,       -- For offline stocktake sync idempotency
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    movement_type stock_movement_type_enum NOT NULL,
    quantity NUMERIC(10, 3) NOT NULL,     -- Positive for intake, negative for depletion
    cost_per_unit NUMERIC(10, 2) NOT NULL,
    reference_id UUID,
    balance_after NUMERIC(10, 3) NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stock_movements_ingredient ON stock_movements(ingredient_id, created_at DESC);

-- 11. SUPPLIERS, PURCHASE ORDERS & DELIVERIES (PHASE 2)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    gstin TEXT,
    payment_terms TEXT,
    lead_time_days INT DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status po_status_enum NOT NULL DEFAULT 'draft',
    total_estimated_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ordered_at TIMESTAMPTZ,
    expected_delivery_at DATE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    ordered_quantity NUMERIC(10, 3) NOT NULL,
    agreed_unit_cost NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    delivery_note_number TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_by UUID REFERENCES profiles(id),
    invoice_amount NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'verified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    received_quantity NUMERIC(10, 3) NOT NULL,
    actual_unit_cost NUMERIC(10, 2) NOT NULL,
    batch_number TEXT,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. CUSTOMER FEEDBACK & NOTIFICATIONS LOGGING
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_type feedback_target_enum NOT NULL,
    target_id UUID,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    tags TEXT[] NOT NULL DEFAULT '{}',
    comments TEXT,
    source TEXT NOT NULL DEFAULT 'app',
    sentiment TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    recipient_phone TEXT,
    recipient_email TEXT,
    channel TEXT NOT NULL,                -- 'email', 'whatsapp'
    template_id TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'queued',
    provider_message_id TEXT,
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
