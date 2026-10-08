-- ==============================================================================
-- PUNE YOGA STUDIO & CAFÉ PLATFORM
-- Migration 05: Seed Data (Initial Configuration, Studio & Café)
-- ==============================================================================

-- 1. BUSINESS SETTINGS
INSERT INTO business_settings (key, value, description) VALUES
('cancellation_window_hours', '12'::jsonb, 'Hours prior to session start where cancellation refunds full credit'),
('refund_credit_policy', '"return_credit_if_cancelled_before_window"'::jsonb, 'Default refund rule when cancellation is within policy'),
('waitlist_enabled', 'true'::jsonb, 'Whether members can join a waitlist when class session is full'),
('waitlist_auto_promote', 'true'::jsonb, 'Whether waitlisted members are automatically promoted when a spot opens'),
('one_on_one_default_price_inr', '2500'::jsonb, 'Standard price for 60-minute private 1-on-1 yoga instruction'),
('trial_allow_free', 'true'::jsonb, 'Whether verified new members receive one complimentary trial class'),
('studio_profile', '{
    "name": "THE AM:PM STUDIO",
    "city": "Pune",
    "neighborhood": "Koregaon Park",
    "address": "Lane 6, South Main Road, Koregaon Park, Pune 411001",
    "phone": "+91 98230 12345",
    "email": "namaste@theampmstudio.com",
    "instagram": "@theampmstudio.pune"
}'::jsonb, 'Core brand and studio location identity');

-- 2. CLASS TYPES
INSERT INTO class_types (id, name, slug, description, duration_minutes, default_capacity, color_hex, image_url) VALUES
('11111111-1111-1111-1111-111111111101', 'Vinyasa Flow', 'vinyasa-flow', 'Dynamic, breath-synchronized sequence building strength, flexibility, and moving meditation.', 60, 16, '#C86D51', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop'),
('11111111-1111-1111-1111-111111111102', 'Ashtanga Primary', 'ashtanga-primary', 'Traditional set sequence of postures promoting endurance, mental clarity, and internal heat.', 75, 14, '#657E6B', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop'),
('11111111-1111-1111-1111-111111111103', 'Yin Yoga & Sound Bath', 'yin-sound-bath', 'Slow, passive floor poses held for deep connective release, accompanied by Tibetan singing bowls.', 75, 18, '#7A6F82', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop'),
('11111111-1111-1111-1111-111111111104', 'Pranayama & Breathwork', 'pranayama-breathwork', 'Conscious yogic breath regulation techniques for nervous system rejuvenation and stillness.', 45, 20, '#D4A373', 'https://images.unsplash.com/photo-1508672019048-805b876b67e2?q=80&w=1000&auto=format&fit=crop')
ON CONFLICT (slug) DO NOTHING;

-- 3. PACK TYPES
INSERT INTO pack_types (id, name, description, price_inr, credits, validity_days, active, display_order) VALUES
('22222222-2222-2222-2222-222222222201', 'Introductory 3-Class Pack', 'Ideal for newcomers to experience our shala instructors and styles.', 1800, 3, 30, TRUE, 1),
('22222222-2222-2222-2222-222222222202', '10-Class Practice Pack', 'Our most loved pack for consistent weekly practice and community wellness.', 5500, 10, 60, TRUE, 2),
('22222222-2222-2222-2222-222222222203', '20-Class Commitment Pack', 'Maximum value for dedicated daily and multi-session practitioners.', 9800, 20, 90, TRUE, 3),
('22222222-2222-2222-2222-222222222204', 'Single Drop-In Pass', 'Flexible single session pass for drop-ins and travelers in Pune.', 700, 1, 14, TRUE, 4)
ON CONFLICT DO NOTHING;

-- 4. TRAINERS
INSERT INTO trainers (id, name, slug, bio, story, specialties, instagram_handle, display_order, media_urls) VALUES
('33333333-3333-3333-3333-333333333301', 'Ananya Kulkarni', 'ananya-kulkarni', 'Senior Vinyasa and Functional Movement teacher with 10+ years exploring yogic anatomy and mindful transitions.', 'Ananya discovered yoga during her corporate years in Pune, finding in it an anchor of presence and deep physiological healing. Certified in Mysore and Rishikesh.', ARRAY['Vinyasa Flow', 'Asana Alignment', 'Mobility & Restorative'], '@ananya.yoga.pune', 1, ARRAY['https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop']),
('33333333-3333-3333-3333-333333333302', 'Rohan Deshmukh', 'rohan-deshmukh', 'Ashtanga practitioner and breathwork guide dedicated to traditional Mysore discipline and stillness.', 'Born and raised in Pune, Rohan apprenticed under renowned Ashtanga masters. He combines rigorous technique with compassionate presence.', ARRAY['Ashtanga Vinyasa', 'Pranayama', 'Bandhas & Breath'], '@rohan.ashtanga', 2, ARRAY['https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop']),
('33333333-3333-3333-3333-333333333303', 'Maya Shenoy', 'maya-shenoy', 'Sound alchemist and Yin Yoga practitioner weaving quartz singing bowls, gongs, and meditative stillness.', 'Maya blends sound therapy and myofascial yin release, holding grounding spaces where the nervous system naturally recalibrates.', ARRAY['Yin Yoga', 'Sound Bath', 'Nervous System Reset'], '@maya.sounds', 3, ARRAY['https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop'])
ON CONFLICT (slug) DO NOTHING;

-- 5. CAFÉ CATEGORIES (PHASE 1 DISPLAY & PHASE 3 KOT ROUTING)
INSERT INTO menu_categories (id, name, slug, display_order, kitchen_station, is_active) VALUES
('44444444-4444-4444-4444-444444444401', 'Nourish Bowls & Food', 'food', 1, 'food', TRUE),
('44444444-4444-4444-4444-444444444402', 'Elixirs & Beverages', 'beverage', 2, 'beverage', TRUE),
('44444444-4444-4444-4444-444444444403', 'Guilt-Free Desserts', 'dessert', 3, 'dessert', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 6. CAFÉ MENU ITEMS
INSERT INTO menu_items (category_id, name, description, price_inr, dietary_tags, image_url, is_available, display_order) VALUES
('44444444-4444-4444-4444-444444444401', 'AM:PM Earth Bowl', 'Warm red quinoa, charred broccolini, roasted sweet potato, edamame, and turmeric tahini dressing.', 380, ARRAY['vegan', 'gluten_free'], 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop', TRUE, 1),
('44444444-4444-4444-4444-444444444401', 'Artisan Sourdough Tartine', 'House fermented sourdough, crushed Hass avocado, hemp seeds, microgreens, and cold-pressed chili oil.', 340, ARRAY['vegan'], 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop', TRUE, 2),
('44444444-4444-4444-4444-444444444402', 'Ceremonial Uji Matcha Latte', 'First harvest Japanese ceremonial matcha whisked with velvety oat milk and raw wild honey.', 260, ARRAY['organic', 'dairy_free'], 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=800&auto=format&fit=crop', TRUE, 1),
('44444444-4444-4444-4444-444444444402', 'Golden Turmeric Ashwagandha Elixir', 'Fresh Lakadong turmeric, adaptogenic ashwagandha, black pepper, cardamom, and coconut milk.', 220, ARRAY['vegan', 'caffeine_free'], 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=800&auto=format&fit=crop', TRUE, 2),
('44444444-4444-4444-4444-444444444403', 'Raw Cacao & Avocado Silk Mousse', 'Single origin Indian cacao, Hass avocado, Medjool date nectar, and toasted hazelnut crumble.', 280, ARRAY['vegan', 'gluten_free', 'sugar_free'], 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop', TRUE, 1),
('44444444-4444-4444-4444-444444444403', 'Cardamom & Rose Chia Pudding', 'Coconut-soaked chia seeds, crushed pistachios, organic rose petal jam, and seasonal berries.', 240, ARRAY['vegan', 'gluten_free'], 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop', TRUE, 2)
ON CONFLICT DO NOTHING;

-- 7. DINING TABLES (PHASE 3)
INSERT INTO dining_tables (table_number, qr_code_token, capacity, is_active) VALUES
('Table 1', 'QR-PUNE-T01-A9F2', 2, TRUE),
('Table 2', 'QR-PUNE-T02-B8E3', 4, TRUE),
('Table 3', 'QR-PUNE-T03-C7D4', 2, TRUE),
('Veranda 1', 'QR-PUNE-V01-D6C5', 4, TRUE),
('Veranda 2', 'QR-PUNE-V02-E5B6', 6, TRUE)
ON CONFLICT (table_number) DO NOTHING;
