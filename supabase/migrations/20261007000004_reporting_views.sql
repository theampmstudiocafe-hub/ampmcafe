-- ==============================================================================
-- PUNE YOGA STUDIO & CAFÉ PLATFORM
-- Migration 04: Read-Optimized Materialized Views (Owner & PMS Analytics)
-- ==============================================================================

-- 1. VIEW: Rolling Days of Supply & Low-Stock Indicators (Inventory)
CREATE MATERIALIZED VIEW IF NOT EXISTS v_ingredient_days_of_supply AS
WITH recent_usage AS (
    SELECT 
        ingredient_id,
        ABS(SUM(quantity)) AS total_used_30d,
        ABS(SUM(quantity)) / 30.0 AS avg_daily_usage
    FROM stock_movements
    WHERE movement_type IN ('dish_sale_depletion', 'waste_spoilage')
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY ingredient_id
),
current_balance AS (
    SELECT 
        sm.ingredient_id,
        sm.balance_after AS current_stock
    FROM stock_movements sm
    INNER JOIN (
        SELECT ingredient_id, MAX(created_at) as max_created
        FROM stock_movements
        GROUP BY ingredient_id
    ) latest ON sm.ingredient_id = latest.ingredient_id AND sm.created_at = latest.max_created
)
SELECT 
    i.id AS ingredient_id,
    i.name AS ingredient_name,
    u.symbol AS unit,
    COALESCE(cb.current_stock, 0) AS current_stock,
    i.minimum_stock_level,
    COALESCE(ru.avg_daily_usage, 0) AS avg_daily_usage,
    CASE 
        WHEN COALESCE(ru.avg_daily_usage, 0) <= 0 THEN 999.0
        ELSE ROUND((COALESCE(cb.current_stock, 0) / ru.avg_daily_usage)::NUMERIC, 1)
    END AS days_of_supply,
    CASE 
        WHEN COALESCE(cb.current_stock, 0) <= i.minimum_stock_level THEN TRUE 
        ELSE FALSE 
    END AS is_low_stock
FROM ingredients i
JOIN units_of_measure u ON i.unit_id = u.id
LEFT JOIN current_balance cb ON i.id = cb.ingredient_id
LEFT JOIN recent_usage ru ON i.id = ru.ingredient_id;

-- 2. VIEW: Daily Sales & P&L by Channel
CREATE MATERIALIZED VIEW IF NOT EXISTS v_daily_sales_pnl AS
SELECT
    DATE(created_at) AS report_date,
    COUNT(DISTINCT id) AS total_orders,
    SUM(CASE WHEN source = 'dine_in_qr' THEN total_inr ELSE 0 END) AS dine_in_sales,
    SUM(CASE WHEN source = 'counter' THEN total_inr ELSE 0 END) AS counter_sales,
    SUM(CASE WHEN source = 'zomato' THEN total_inr ELSE 0 END) AS zomato_gross_sales,
    SUM(CASE WHEN source = 'swiggy' THEN total_inr ELSE 0 END) AS swiggy_gross_sales,
    SUM(COALESCE(aggregator_commission_inr, 0)) AS total_aggregator_commissions,
    SUM(total_inr) - SUM(COALESCE(aggregator_commission_inr, 0)) AS net_cafe_revenue
FROM orders
WHERE status IN ('completed', 'served')
GROUP BY DATE(created_at);

-- 3. FUNCTION TO REFRESH REPORTING VIEWS
CREATE OR REPLACE FUNCTION public.refresh_reporting_views()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY v_ingredient_days_of_supply;
    REFRESH MATERIALIZED VIEW CONCURRENTLY v_daily_sales_pnl;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback to standard refresh if unique index not yet populated
        REFRESH MATERIALIZED VIEW v_ingredient_days_of_supply;
        REFRESH MATERIALIZED VIEW v_daily_sales_pnl;
END;
$$;
