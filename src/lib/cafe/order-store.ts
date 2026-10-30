/**
 * THE AM:PM CAFE - Shared In-Memory Order Store
 * Retained for offline fallback and automated vertical slice integration testing.
 */

const globalOrders: Map<string, any> = (globalThis as any).__am_pm_orders_map || new Map();
(globalThis as any).__am_pm_orders_map = globalOrders;

export const memoryOrdersMap: Map<string, any> = globalOrders;
