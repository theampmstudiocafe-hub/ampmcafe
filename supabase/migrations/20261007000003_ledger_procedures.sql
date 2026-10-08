-- ==============================================================================
-- PUNE YOGA STUDIO & CAFÉ PLATFORM
-- Migration 03: Atomic Stored Procedures (Ledger, Entitlements & Trials)
-- ==============================================================================

-- 1. PROCEDURE: Deduct credit for booking (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.deduct_credits_for_booking(
    p_user_id UUID,
    p_session_id UUID,
    p_user_pack_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pack RECORD;
    v_booking_id UUID;
    v_new_balance INT;
    v_session RECORD;
BEGIN
    -- Check class session status and capacity
    SELECT cs.*, ct.name as class_name 
    INTO v_session
    FROM class_sessions cs
    JOIN class_types ct ON cs.class_type_id = ct.id
    WHERE cs.id = p_session_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Class session not found';
    END IF;

    IF v_session.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot book a cancelled session';
    END IF;

    -- Lock and verify user pack
    SELECT * INTO v_pack
    FROM user_packs
    WHERE id = p_user_pack_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active user pack not found for this user';
    END IF;

    IF v_pack.expires_at < NOW() THEN
        RAISE EXCEPTION 'Class pack has expired';
    END IF;

    IF v_pack.remaining_credits < 1 THEN
        RAISE EXCEPTION 'No remaining credits in this pack';
    END IF;

    -- Deduct credit
    v_new_balance := v_pack.remaining_credits - 1;
    UPDATE user_packs
    SET remaining_credits = v_new_balance,
        status = CASE WHEN v_new_balance = 0 THEN 'depleted' ELSE 'active' END
    WHERE id = p_user_pack_id;

    -- Create booking
    INSERT INTO bookings (
        user_id,
        booking_type,
        session_id,
        user_pack_id,
        status,
        is_trial,
        credits_deducted
    ) VALUES (
        p_user_id,
        'class_session',
        p_session_id,
        p_user_pack_id,
        'confirmed',
        FALSE,
        1
    ) RETURNING id INTO v_booking_id;

    -- Insert credit ledger record
    INSERT INTO credit_ledger (
        user_id,
        user_pack_id,
        amount,
        entry_type,
        reference_id,
        reason,
        balance_after,
        created_by
    ) VALUES (
        p_user_id,
        p_user_pack_id,
        -1,
        'booking_deduction',
        v_booking_id,
        CONCAT('Booked spot in ', v_session.class_name, ' on ', to_char(v_session.start_time, 'YYYY-MM-DD HH24:MI')),
        v_new_balance,
        p_user_id
    );

    RETURN v_booking_id;
END;
$$;

-- 2. PROCEDURE: Refund credits for cancellation
CREATE OR REPLACE FUNCTION public.refund_credits_for_cancellation(
    p_booking_id UUID,
    p_reason TEXT,
    p_actor_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
    v_pack RECORD;
    v_new_balance INT;
BEGIN
    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled';
    END IF;

    -- Mark booking cancelled
    UPDATE bookings
    SET status = 'cancelled',
        cancellation_reason = p_reason,
        cancelled_at = NOW()
    WHERE id = p_booking_id;

    -- If booked with credits, refund back to user_pack
    IF v_booking.user_pack_id IS NOT NULL AND v_booking.credits_deducted > 0 THEN
        SELECT * INTO v_pack
        FROM user_packs
        WHERE id = v_booking.user_pack_id
        FOR UPDATE;

        IF FOUND THEN
            v_new_balance := v_pack.remaining_credits + v_booking.credits_deducted;
            UPDATE user_packs
            SET remaining_credits = v_new_balance,
                status = 'active'
            WHERE id = v_booking.user_pack_id;

            -- Record cancellation refund in ledger
            INSERT INTO credit_ledger (
                user_id,
                user_pack_id,
                amount,
                entry_type,
                reference_id,
                reason,
                balance_after,
                created_by
            ) VALUES (
                v_booking.user_id,
                v_booking.user_pack_id,
                v_booking.credits_deducted,
                'cancellation_refund',
                p_booking_id,
                CONCAT('Cancellation refund: ', p_reason),
                v_new_balance,
                p_actor_id
            );
        END IF;
    END IF;

    RETURN TRUE;
END;
$$;

-- 3. PROCEDURE: Record pack purchase & credit addition
CREATE OR REPLACE FUNCTION public.record_pack_purchase(
    p_user_id UUID,
    p_pack_type_id UUID,
    p_payment_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pack_type RECORD;
    v_user_pack_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_pack_type
    FROM pack_types
    WHERE id = p_pack_type_id AND active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pack type not found or inactive';
    END IF;

    v_expires_at := NOW() + (v_pack_type.validity_days || ' days')::INTERVAL;

    -- Create user pack
    INSERT INTO user_packs (
        user_id,
        pack_type_id,
        initial_credits,
        remaining_credits,
        expires_at,
        status
    ) VALUES (
        p_user_id,
        p_pack_type_id,
        v_pack_type.credits,
        v_pack_type.credits,
        v_expires_at,
        'active'
    ) RETURNING id INTO v_user_pack_id;

    -- Insert positive credit ledger record
    INSERT INTO credit_ledger (
        user_id,
        user_pack_id,
        amount,
        entry_type,
        reference_id,
        reason,
        balance_after,
        created_by
    ) VALUES (
        p_user_id,
        v_user_pack_id,
        v_pack_type.credits,
        'purchase',
        p_payment_id,
        CONCAT('Purchased ', v_pack_type.name, ' (', v_pack_type.credits, ' credits)'),
        v_pack_type.credits,
        p_user_id
    );

    RETURN v_user_pack_id;
END;
$$;
