/**
 * THE AM:PM STUDIO - Offline Sync Service
 * Pure IndexedDB Queue • Service Worker Pre-Caching • Active Health Checks
 * Restricted to: Front-Desk Check-Ins, Stocktake Counts & Manual Expenses
 */

export type OfflineActionType =
  | "FRONT_DESK_CHECKIN"
  | "STOCKTAKE_COUNT"
  | "MANUAL_EXPENSE";

export type MutationStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "failed"
  | "conflict";

export type ConnectionState = "online" | "degraded" | "offline";

export interface OfflineMutation {
  id: string; // Client-generated UUID for idempotency
  action_type: OfflineActionType;
  payload: Record<string, any>;
  storage_area?: string; // Used for additive stocktake area conflict rules
  ingredient_id?: string;
  client_timestamp: number;
  status: MutationStatus;
  error_message?: string | null;
  conflict_details?: {
    existing_value: any;
    attempted_value: any;
    storage_area: string;
  } | null;
  retry_count: number;
}

export interface CachedRosterAttendee {
  booking_id: string;
  attendee_id: string;
  display_name: string;
  status: "confirmed" | "attended" | "cancelled" | "no_show";
  emergency_name?: string;
  emergency_phone?: string;
}

export interface CachedClassRoster {
  session_id: string;
  class_name: string;
  start_time: string;
  room: string;
  cached_at: number;
  attendees: CachedRosterAttendee[];
}

const DB_NAME = "ampm_offline_pms_db";
const DB_VERSION = 1;
const STORE_MUTATIONS = "ampm_offline_mutations";
const STORE_ROSTERS = "ampm_cached_rosters";
const ROSTER_TTL_MS = 4 * 60 * 60 * 1000; // 4 Hours Short TTL

class OfflineSyncManager {
  private db: IDBDatabase | null = null;
  private connectionState: ConnectionState = "online";
  private healthInterval: any = null;
  private listeners: Set<(state: ConnectionState, pendingCount: number) => void> = new Set();
  private isSyncing = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initDB().then(() => {
        this.startHealthPolling();
        this.registerServiceWorker();
      });
    }
  }

  // 1. IndexedDB Initialization
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;

        // Mutations Store
        if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
          const mutationStore = db.createObjectStore(STORE_MUTATIONS, { keyPath: "id" });
          mutationStore.createIndex("status", "status", { unique: false });
          mutationStore.createIndex("action_type", "action_type", { unique: false });
          mutationStore.createIndex("client_timestamp", "client_timestamp", { unique: false });
        }

        // Rosters Store
        if (!db.objectStoreNames.contains(STORE_ROSTERS)) {
          db.createObjectStore(STORE_ROSTERS, { keyPath: "session_id" });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        console.error("[OfflineSync] Failed to open IndexedDB", request.error);
        reject(request.error);
      };
    });
  }

  // 2. Active Health-Check Polling (Every 15 Seconds)
  private startHealthPolling() {
    this.checkHealth();
    this.healthInterval = setInterval(() => {
      this.checkHealth();
    }, 15000);
  }

  public async checkHealth(): Promise<ConnectionState> {
    if (typeof window === "undefined") return "online";

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (res.ok) {
        const newState: ConnectionState = latency > 800 ? "degraded" : "online";
        const wasOffline = this.connectionState === "offline";
        this.connectionState = newState;

        if (wasOffline) {
          console.log("[OfflineSync] Regained connection. Replaying queue...");
          this.replayOfflineQueue();
        }
      } else {
        this.connectionState = "offline";
      }
    } catch {
      this.connectionState = "offline";
    }

    this.notifyListeners();
    return this.connectionState;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public subscribe(fn: (state: ConnectionState, pendingCount: number) => void): () => void {
    this.listeners.add(fn);
    this.getPendingCount().then((count) => fn(this.connectionState, count));
    return () => this.listeners.delete(fn);
  }

  private async notifyListeners() {
    const count = await this.getPendingCount();
    this.listeners.forEach((fn) => fn(this.connectionState, count));
  }

  // 3. Queue Offline Mutation (Strictly Restricted Actions)
  public async queueMutation(
    actionType: OfflineActionType,
    payload: Record<string, any>,
    options?: { storage_area?: string; ingredient_id?: string }
  ): Promise<OfflineMutation> {
    // Disallow credit adjustments or unpermitted operations offline
    if (
      actionType !== "FRONT_DESK_CHECKIN" &&
      actionType !== "STOCKTAKE_COUNT" &&
      actionType !== "MANUAL_EXPENSE"
    ) {
      throw new Error(
        "Credit adjustments and sensitive operations require real-time ledger verification and cannot be performed offline."
      );
    }

    const db = await this.initDB();
    const mutation: OfflineMutation = {
      id: crypto.randomUUID(),
      action_type: actionType,
      payload,
      storage_area: options?.storage_area,
      ingredient_id: options?.ingredient_id,
      client_timestamp: Date.now(),
      status: "pending",
      retry_count: 0,
      conflict_details: null,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, "readwrite");
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.add(mutation);

      req.onsuccess = () => {
        this.notifyListeners();
        // If currently online, attempt immediate sync
        if (this.connectionState !== "offline") {
          this.replayOfflineQueue();
        }
        resolve(mutation);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // 4. Retrieve All Mutations
  public async getAllMutations(): Promise<OfflineMutation[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, "readonly");
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async getPendingCount(): Promise<number> {
    try {
      const all = await this.getAllMutations();
      return all.filter((m) => m.status === "pending" || m.status === "failed" || m.status === "conflict").length;
    } catch {
      return 0;
    }
  }

  // 5. Replay Queue with Conflict Rules
  public async replayOfflineQueue(): Promise<{ synced: number; failed: number; conflicts: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0, conflicts: 0 };
    this.isSyncing = true;

    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      const all = await this.getAllMutations();
      const pending = all.filter((m) => m.status === "pending" || m.status === "failed");

      for (const mutation of pending) {
        try {
          await this.updateMutationStatus(mutation.id, "syncing");

          // Dispatch mutation to corresponding endpoint with client_mutation_id
          const response = await this.dispatchMutation(mutation);

          if (response.conflict) {
            // Additive storage-area conflict rule:
            // Conflict ONLY occurs if repeat count for same area exists
            await this.updateMutationStatus(mutation.id, "conflict", {
              error_message: "Duplicate count for the same storage area detected.",
              conflict_details: response.conflict_details,
            });
            conflicts++;
          } else if (response.ok) {
            await this.updateMutationStatus(mutation.id, "synced");
            synced++;
          } else {
            throw new Error(response.error || "Sync rejected by server");
          }
        } catch (err: any) {
          failed++;
          const newRetryCount = (mutation.retry_count || 0) + 1;
          await this.updateMutationStatus(mutation.id, "failed", {
            error_message: err.message || "Network error",
            retry_count: newRetryCount,
          });
        }
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { synced, failed, conflicts };
  }

  private async dispatchMutation(mutation: OfflineMutation): Promise<{ ok: boolean; conflict?: boolean; conflict_details?: any; error?: string }> {
    let endpoint = "";

    switch (mutation.action_type) {
      case "FRONT_DESK_CHECKIN":
        endpoint = "/api/admin/bookings/check-in";
        break;
      case "STOCKTAKE_COUNT":
        endpoint = "/api/admin/inventory/stocktake";
        break;
      case "MANUAL_EXPENSE":
        endpoint = "/api/admin/expenses";
        break;
      default:
        throw new Error(`Unsupported action type: ${mutation.action_type}`);
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Mutation-ID": mutation.id,
      },
      body: JSON.stringify({
        ...mutation.payload,
        client_mutation_id: mutation.id,
        storage_area: mutation.storage_area,
        ingredient_id: mutation.ingredient_id,
        client_timestamp: mutation.client_timestamp,
      }),
    });

    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, conflict: true, conflict_details: data.conflict_details };
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }

    return { ok: true };
  }

  public async resolveConflict(mutationId: string, choice: "keep_new" | "keep_existing" | "discard") {
    const db = await this.initDB();
    const all = await this.getAllMutations();
    const target = all.find((m) => m.id === mutationId);
    if (!target) return;

    if (choice === "discard") {
      await this.deleteMutation(mutationId);
    } else if (choice === "keep_new") {
      // Re-dispatch forcing overwrite
      target.status = "pending";
      target.payload.force_overwrite = true;
      const tx = db.transaction(STORE_MUTATIONS, "readwrite");
      tx.objectStore(STORE_MUTATIONS).put(target);
      this.notifyListeners();
      this.replayOfflineQueue();
    } else {
      // Keep existing: mark as synced/resolved
      await this.updateMutationStatus(mutationId, "synced");
    }
  }

  public async deleteMutation(id: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, "readwrite");
      tx.objectStore(STORE_MUTATIONS).delete(id);
      tx.oncomplete = () => {
        this.notifyListeners();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  private async updateMutationStatus(
    id: string,
    status: MutationStatus,
    extra?: { error_message?: string; retry_count?: number; conflict_details?: any }
  ): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, "readwrite");
      const store = tx.objectStore(STORE_MUTATIONS);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as OfflineMutation;
        if (!item) return resolve();

        item.status = status;
        if (extra?.error_message !== undefined) item.error_message = extra.error_message;
        if (extra?.retry_count !== undefined) item.retry_count = extra.retry_count;
        if (extra?.conflict_details !== undefined) item.conflict_details = extra.conflict_details;

        store.put(item);
      };

      tx.oncomplete = () => {
        this.notifyListeners();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  // 6. Minimal Roster Cache (Short TTL 4h & Purge on Logout)
  public async cacheRoster(roster: CachedClassRoster): Promise<void> {
    const db = await this.initDB();
    // Enforce minimal fields only (no emails, no personal phones, no financial spend)
    const sanitizedAttendees: CachedRosterAttendee[] = roster.attendees.map((a) => ({
      booking_id: a.booking_id,
      attendee_id: a.attendee_id,
      display_name: a.display_name,
      status: a.status,
      emergency_name: a.emergency_name,
      emergency_phone: a.emergency_phone,
    }));

    const cleanRoster: CachedClassRoster = {
      session_id: roster.session_id,
      class_name: roster.class_name,
      start_time: roster.start_time,
      room: roster.room,
      cached_at: Date.now(),
      attendees: sanitizedAttendees,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ROSTERS, "readwrite");
      tx.objectStore(STORE_ROSTERS).put(cleanRoster);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getCachedRoster(sessionId: string): Promise<CachedClassRoster | null> {
    const db = await this.initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ROSTERS, "readonly");
      const req = tx.objectStore(STORE_ROSTERS).get(sessionId);

      req.onsuccess = () => {
        const result = req.result as CachedClassRoster | undefined;
        if (!result) return resolve(null);

        // Check short TTL (4 hours)
        if (Date.now() - result.cached_at > ROSTER_TTL_MS) {
          console.warn("[OfflineSync] Cached roster expired (> 4 hours).");
          resolve(null);
        } else {
          resolve(result);
        }
      };

      req.onerror = () => resolve(null);
    });
  }

  public async purgeRosterCache(): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ROSTERS, "readwrite");
      tx.objectStore(STORE_ROSTERS).clear();
      tx.oncomplete = () => {
        console.log("[OfflineSync] Roster cache purged successfully (Logout / Session Clear).");
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  // 7. Service Worker Registration
  private registerServiceWorker() {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[OfflineSync] ServiceWorker registration ignored:", err);
      });
    }
  }
}

// Singleton export
export const offlineSyncManager =
  typeof window !== "undefined"
    ? new OfflineSyncManager()
    : ({} as OfflineSyncManager);
