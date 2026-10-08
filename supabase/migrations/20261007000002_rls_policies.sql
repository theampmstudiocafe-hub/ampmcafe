-- ==============================================================================
-- PUNE YOGA STUDIO & CAFÉ PLATFORM
-- Migration 02: Row Level Security (RLS) Policies (Deny-by-default, 9 Roles)
-- ==============================================================================

-- 1. SECURITY HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Helper to check if caller has administrative privileges (admin or owner)
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'owner')
  );
$$;

-- Helper to check if caller is staff / manager / admin / owner
CREATE OR REPLACE FUNCTION public.is_management(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'owner', 'manager')
  );
$$;

-- 2. ENABLE RLS ON ALL TABLES (DENY BY DEFAULT)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kots ENABLE ROW LEVEL SECURITY;
ALTER TABLE kot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES & ROLES POLICIES
-- Profiles: users read/update own; front_desk & management read all; admin full access
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.has_role(auth.uid(), 'front_desk') OR public.is_management(auth.uid()));

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON profiles
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

-- User Roles: users see own role; front_desk & management see all; admin manages
CREATE POLICY "user_roles_select" ON user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_management(auth.uid()));

CREATE POLICY "user_roles_admin" ON user_roles
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

-- Staff Members: staff read own; management read/manage
CREATE POLICY "staff_select_own" ON staff_members
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_management(auth.uid()));

CREATE POLICY "staff_management_all" ON staff_members
    FOR ALL TO authenticated
    USING (public.is_management(auth.uid()));

-- 4. PUBLIC & STUDIO CONTENT POLICIES
-- Trainers: public can read active; management manages
CREATE POLICY "trainers_public_read" ON trainers
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE OR public.is_management(auth.uid()));

CREATE POLICY "trainers_management_all" ON trainers
    FOR ALL TO authenticated
    USING (public.is_management(auth.uid()));

-- Class Types: public can read active; management manages
CREATE POLICY "class_types_public_read" ON class_types
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE OR public.is_management(auth.uid()));

CREATE POLICY "class_types_management_all" ON class_types
    FOR ALL TO authenticated
    USING (public.is_management(auth.uid()));

-- Class Sessions: public read scheduled; trainers read assigned; front_desk & management all
CREATE POLICY "class_sessions_public_read" ON class_sessions
    FOR SELECT TO anon, authenticated
    USING (status != 'cancelled' OR public.is_management(auth.uid()));

CREATE POLICY "class_sessions_management_all" ON class_sessions
    FOR ALL TO authenticated
    USING (public.is_management(auth.uid()) OR public.has_role(auth.uid(), 'front_desk'));

-- One-on-one slots: public read unbooked; trainer manages own; management all
CREATE POLICY "one_on_one_public_read" ON one_on_one_slots
    FOR SELECT TO anon, authenticated
    USING (is_booked = FALSE OR public.is_management(auth.uid()));

CREATE POLICY "one_on_one_trainer_manage" ON one_on_one_slots
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM trainers t
            WHERE t.id = one_on_one_slots.trainer_id AND t.user_id = auth.uid()
        ) OR public.is_management(auth.uid())
    );

-- Events: public read published; management manages
CREATE POLICY "events_public_read" ON events
    FOR SELECT TO anon, authenticated
    USING (is_published = TRUE OR public.is_management(auth.uid()));

CREATE POLICY "events_management_all" ON events
    FOR ALL TO authenticated
    USING (public.is_management(auth.uid()));

-- 5. PACKS, LEDGER & BOOKINGS
-- Pack types: public read active; admin manages
CREATE POLICY "pack_types_public_read" ON pack_types
    FOR SELECT TO anon, authenticated
    USING (active = TRUE OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "pack_types_admin_all" ON pack_types
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

-- User packs: user read own; staff/management read all; admin/service manages
CREATE POLICY "user_packs_select_own" ON user_packs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'front_desk') OR public.is_management(auth.uid()));

CREATE POLICY "user_packs_admin_all" ON user_packs
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

-- Credit Ledger: user read own; staff/management read all; system inserts
CREATE POLICY "credit_ledger_select_own" ON credit_ledger
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'front_desk') OR public.is_management(auth.uid()));

CREATE POLICY "credit_ledger_admin_all" ON credit_ledger
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

-- Bookings: user read/cancel own; front_desk & management read/manage all; trainers read sessions they teach
CREATE POLICY "bookings_select_own" ON bookings
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id 
        OR public.has_role(auth.uid(), 'front_desk') 
        OR public.is_management(auth.uid())
        OR EXISTS (
            SELECT 1 FROM class_sessions cs
            JOIN trainers t ON cs.trainer_id = t.id
            WHERE cs.id = bookings.session_id AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "bookings_insert_own" ON bookings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'front_desk') OR public.is_management(auth.uid()));

CREATE POLICY "bookings_update_own" ON bookings
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'front_desk') OR public.is_management(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'front_desk') OR public.is_management(auth.uid()));

-- Trial Usage: user read own; front_desk & management read/override all
CREATE POLICY "trial_usage_select_own" ON trial_usage
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'front_desk') OR public.is_management(auth.uid()));

CREATE POLICY "trial_usage_admin_manage" ON trial_usage
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'front_desk') OR public.is_management(auth.uid()));

-- Waitlist: user read/join/leave own; management all
CREATE POLICY "waitlist_user_access" ON waitlist
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR public.is_management(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR public.is_management(auth.uid()));

-- 6. PAYMENTS & INVOICES
CREATE POLICY "payments_select_own" ON payments
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "payments_admin_all" ON payments
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "invoices_select_own" ON invoices
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));

CREATE POLICY "invoices_admin_all" ON invoices
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "refunds_admin_all" ON refunds
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

-- 7. COMMUNITY & MODERATION
-- Community messages: authenticated members read (only if not deleted); post (only if not banned/muted)
CREATE POLICY "community_select_active" ON community_messages
    FOR SELECT TO authenticated
    USING (is_deleted = FALSE OR public.is_management(auth.uid()));

CREATE POLICY "community_insert_member" ON community_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND NOT EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
              AND (p.is_banned = TRUE OR (p.muted_until IS NOT NULL AND p.muted_until > NOW()))
        )
    );

CREATE POLICY "community_admin_manage" ON community_messages
    FOR ALL TO authenticated
    USING (public.is_management(auth.uid()));

-- Message reports: members insert; management reads and resolves
CREATE POLICY "reports_insert_member" ON message_reports
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "reports_management_all" ON message_reports
    FOR ALL TO authenticated
    USING (public.is_management(auth.uid()));

CREATE POLICY "moderation_actions_management" ON moderation_actions
    FOR ALL TO authenticated
    USING (public.is_management(auth.uid()));

-- 8. BUSINESS SETTINGS & AUDIT LOGS
CREATE POLICY "settings_public_read" ON business_settings
    FOR SELECT TO anon, authenticated
    USING (TRUE);

CREATE POLICY "settings_admin_update" ON business_settings
    FOR ALL TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "audit_logs_admin_read" ON audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin_or_owner(auth.uid()));

-- 9. CAFÉ & KOT POLICIES (PHASE 3)
CREATE POLICY "menu_categories_public_read" ON menu_categories
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE OR public.is_management(auth.uid()));

CREATE POLICY "menu_items_public_read" ON menu_items
    FOR SELECT TO anon, authenticated
    USING (is_available = TRUE OR public.is_management(auth.uid()));

CREATE POLICY "dining_tables_public_read" ON dining_tables
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE OR public.is_management(auth.uid()));

CREATE POLICY "orders_select_own" ON orders
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id 
        OR public.has_role(auth.uid(), 'kitchen_staff')
        OR public.has_role(auth.uid(), 'front_desk')
        OR public.is_management(auth.uid())
    );

CREATE POLICY "kots_kitchen_access" ON kots
    FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'kitchen_staff')
        OR public.is_management(auth.uid())
    );

CREATE POLICY "kot_items_kitchen_access" ON kot_items
    FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'kitchen_staff')
        OR public.is_management(auth.uid())
    );

-- 10. INVENTORY, RECIPES & SUPPLIERS (PHASE 2 & 3)
CREATE POLICY "inventory_staff_access" ON ingredients
    FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'inventory_staff') 
        OR public.has_role(auth.uid(), 'kitchen_staff')
        OR public.is_management(auth.uid())
    );

CREATE POLICY "stock_movements_access" ON stock_movements
    FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'inventory_staff') 
        OR public.is_management(auth.uid())
    );

CREATE POLICY "recipes_access" ON recipes
    FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'kitchen_staff') 
        OR public.is_management(auth.uid())
    );

CREATE POLICY "suppliers_management_access" ON suppliers
    FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'inventory_staff') 
        OR public.is_management(auth.uid())
    );

-- 11. FEEDBACK & NOTIFICATIONS
CREATE POLICY "feedback_member_insert" ON feedback
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "feedback_management_read" ON feedback
    FOR SELECT TO authenticated
    USING (public.is_management(auth.uid()));

CREATE POLICY "notification_logs_management" ON notification_logs
    FOR SELECT TO authenticated
    USING (public.is_management(auth.uid()));
