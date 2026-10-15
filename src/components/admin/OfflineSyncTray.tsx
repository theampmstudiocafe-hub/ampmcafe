"use client";

import React, { useState, useEffect } from "react";
import {
  offlineSyncManager,
  ConnectionState,
  OfflineMutation,
} from "@/lib/services/offline-sync";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Layers,
  ArrowRight,
  Trash2,
} from "lucide-react";

export function OfflineSyncTray() {
  const [connection, setConnection] = useState<ConnectionState>("online");
  const [pendingCount, setPendingCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [mutations, setMutations] = useState<OfflineMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !offlineSyncManager.subscribe) return;

    const unsubscribe = offlineSyncManager.subscribe((state, count) => {
      setConnection(state);
      setPendingCount(count);
    });

    return () => unsubscribe();
  }, []);

  const loadMutations = async () => {
    if (!offlineSyncManager.getAllMutations) return;
    const all = await offlineSyncManager.getAllMutations();
    setMutations(all);
  };

  const handleOpen = () => {
    loadMutations();
    setIsOpen(true);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await offlineSyncManager.replayOfflineQueue();
    await loadMutations();
    setIsSyncing(false);
  };

  const handleResolveConflict = async (
    mutationId: string,
    choice: "keep_new" | "keep_existing" | "discard"
  ) => {
    await offlineSyncManager.resolveConflict(mutationId, choice);
    await loadMutations();
  };

  const handleDelete = async (id: string) => {
    await offlineSyncManager.deleteMutation(id);
    await loadMutations();
  };

  const conflictCount = mutations.filter((m) => m.status === "conflict").length;

  return (
    <>
      {/* Floating Status Pill */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleOpen}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border transition-all ${
            connection === "offline"
              ? "bg-rose-950 text-rose-200 border-rose-800 hover:bg-rose-900"
              : conflictCount > 0
              ? "bg-amber-950 text-amber-200 border-amber-800 hover:bg-amber-900"
              : pendingCount > 0
              ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
              : "bg-stone-900 text-stone-200 border-stone-700 hover:bg-stone-800"
          }`}
        >
          {connection === "offline" ? (
            <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          ) : connection === "degraded" ? (
            <Wifi className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          )}

          <span className="capitalize">
            {connection === "offline"
              ? "Offline Mode"
              : connection === "degraded"
              ? "Slow Connection"
              : "Online"}
          </span>

          {pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                conflictCount > 0
                  ? "bg-rose-500 text-white"
                  : "bg-amber-500 text-stone-950"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Sync Tray Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-stone-200">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  Offline Sync & Conflicts
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pure IndexedDB Queue • Health-Checked
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of mutations */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {mutations.length === 0 ? (
                <div className="text-center py-12 text-stone-400 space-y-2">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-500/80" />
                  <p className="text-xs font-medium">All local actions synced</p>
                  <p className="text-[11px] text-stone-400">
                    No pending mutations in IndexedDB.
                  </p>
                </div>
              ) : (
                mutations.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      m.status === "conflict"
                        ? "bg-amber-50/80 border-amber-300 text-amber-950"
                        : m.status === "failed"
                        ? "bg-rose-50/80 border-rose-300 text-rose-950"
                        : m.status === "synced"
                        ? "bg-stone-50 border-stone-200 opacity-60 text-stone-600"
                        : "bg-white border-stone-200 text-stone-800"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="font-semibold uppercase tracking-wider text-amber-700">
                        {m.action_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-stone-400">
                        {new Date(m.client_timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-[11px] space-y-0.5 font-sans">
                      {m.storage_area && (
                        <p>
                          <strong className="text-stone-500">Storage Area:</strong>{" "}
                          {m.storage_area}
                        </p>
                      )}
                      <p className="truncate">
                        <strong className="text-stone-500">Payload:</strong>{" "}
                        {JSON.stringify(m.payload)}
                      </p>
                    </div>

                    {/* Conflict Resolution UI */}
                    {m.status === "conflict" && (
                      <div className="mt-2 pt-2 border-t border-amber-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Same Storage Area Count Conflict</span>
                        </div>
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                          A previous count for <strong>{m.storage_area}</strong>{" "}
                          was already recorded. Choose which count to preserve:
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleResolveConflict(m.id, "keep_new")}
                            className="px-2.5 py-1 bg-amber-600 text-white rounded-md text-[10px] font-semibold hover:bg-amber-700 transition"
                          >
                            Overwrite with this
                          </button>
                          <button
                            onClick={() =>
                              handleResolveConflict(m.id, "keep_existing")
                            }
                            className="px-2.5 py-1 bg-stone-200 text-stone-800 rounded-md text-[10px] font-semibold hover:bg-stone-300 transition"
                          >
                            Keep Existing
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {m.status === "failed" && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-rose-700 font-mono">
                          {m.error_message || "Sync Failed"} (Retry #{m.retry_count})
                        </span>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-stone-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer with Sync Now */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                {pendingCount} item(s) pending
              </span>
              <button
                onClick={handleManualSync}
                disabled={isSyncing || connection === "offline"}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
                />
                <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
