export type AppRole =
  | 'visitor'
  | 'member'
  | 'trainer'
  | 'front_desk'
  | 'kitchen_staff'
  | 'inventory_staff'
  | 'manager'
  | 'admin'
  | 'owner';

export type BookingType = 'class_session' | 'one_on_one' | 'event';
export type BookingStatus = 'confirmed' | 'attended' | 'cancelled' | 'no_show';
export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'paid_by_aggregator';
export type LedgerEntryType = 'purchase' | 'booking_deduction' | 'cancellation_refund' | 'admin_adjustment' | 'expiry';
export type KitchenStation = 'food' | 'beverage' | 'dessert';
export type KotStatus = 'pending' | 'in_progress' | 'ready' | 'served';
export type OrderStatus = 'pending_payment' | 'placed' | 'preparing' | 'served' | 'completed' | 'cancelled';
export type OrderSource = 'dine_in_qr' | 'counter' | 'zomato' | 'swiggy' | 'other';
export type SettlementStatus = 'pending' | 'reconciled' | 'disputed';
export type StockMovementType = 'purchase' | 'dish_sale_depletion' | 'waste_spoilage' | 'audit_adjustment' | 'return';
export type PoStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
export type FeedbackTarget = 'booking' | 'cafe_order' | 'trainer' | 'overall';

export interface Profile {
  id: string;
  full_name: string;
  display_name: string;
  email: string;
  phone: string | null;
  whatsapp_opt_in: boolean;
  avatar_url: string | null;
  is_banned: boolean;
  muted_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  employee_id: string;
  department: string;
  job_title: string;
  hourly_rate_inr: number | null;
  monthly_salary_inr: number | null;
  emergency_contact: Record<string, any> | null;
  date_of_joining: string;
  is_active: boolean;
  created_at: string;
}

export interface Trainer {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  bio: string;
  story: string;
  specialties: string[];
  media_urls: string[];
  instagram_handle: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ClassType {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  default_capacity: number;
  color_hex: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ClassSession {
  id: string;
  class_type_id: string;
  trainer_id: string;
  room: string;
  start_time: string;
  end_time: string;
  capacity: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface OneOnOneSlot {
  id: string;
  trainer_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  price_inr: number;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  price_inr: number;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface PackType {
  id: string;
  name: string;
  description: string | null;
  price_inr: number;
  credits: number;
  validity_days: number;
  applicable_class_types: string[] | null;
  active: boolean;
  display_order: number;
  created_at: string;
}

export interface UserPack {
  id: string;
  user_id: string;
  pack_type_id: string;
  initial_credits: number;
  remaining_credits: number;
  expires_at: string;
  status: 'active' | 'depleted' | 'expired' | 'cancelled';
  created_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  user_id: string;
  user_pack_id: string;
  amount: number;
  entry_type: LedgerEntryType;
  reference_id: string | null;
  reason: string;
  balance_after: number;
  created_by: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  booking_type: BookingType;
  session_id: string | null;
  one_on_one_slot_id: string | null;
  event_id: string | null;
  user_pack_id: string | null;
  status: BookingStatus;
  is_trial: boolean;
  credits_deducted: number;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface TrialUsage {
  id: string;
  user_id: string;
  booking_id: string;
  phone_hash: string | null;
  normalized_email: string;
  normalized_name: string;
  is_flagged_duplicate: boolean;
  flag_reason: string | null;
  is_revoked: boolean;
  revoked_by: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string | null;
  provider: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  provider_signature: string | null;
  amount_inr: number;
  currency: string;
  status: PaymentStatus;
  settlement_status: SettlementStatus;
  aggregator_reference: string | null;
  commission_amount_inr: number;
  net_settlement_inr: number | null;
  item_type: string;
  item_id: string;
  metadata: Record<string, any>;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityMessage {
  id: string;
  sender_id: string;
  sender_display_name: string;
  content: string;
  is_announcement: boolean;
  is_pinned: boolean;
  is_deleted: boolean;
  deleted_by: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface MessageReport {
  id: string;
  message_id: string;
  reported_by: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface BusinessSettings {
  key: string;
  value: any;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  kitchen_station: KitchenStation;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_inr: number;
  dietary_tags: string[];
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  client_mutation_id: string | null;
  table_id: string | null;
  user_id: string | null;
  source: OrderSource;
  external_order_id: string | null;
  order_number: string;
  status: OrderStatus;
  total_inr: number;
  aggregator_commission_inr: number;
  aggregator_payout_inr: number | null;
  payment_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  recipient_id: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  channel: 'email' | 'whatsapp';
  template_id: string;
  payload: Record<string, any>;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'fallback_sent';
  provider_message_id: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}
