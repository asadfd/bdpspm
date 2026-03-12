"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  createBed,
  deleteBed,
  listBeds,
  listRooms,
  updateBed,
  type BedUnitManagementDto,
  type BedUnitStatus,
  type RoomManagementDto,
} from "@/lib/api";

function statusClasses(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "OCCUPIED":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "NOTICE":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
}

function BedsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get("edit");
  const [beds, setBeds] = useState<BedUnitManagementDto[]>([]);
  const [rooms, setRooms] = useState<RoomManagementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<BedUnitStatus>("AVAILABLE");
  const [roomId, setRoomId] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [bedData, roomData] = await Promise.all([listBeds(), listRooms()]);
      setBeds(bedData);
      setRooms(roomData);
      setRoomId((current) => current || String(roomData[0]?.id ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load beds.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!editIdParam) {
      setEditingId(null);
      setStatus("AVAILABLE");
      setRoomId((current) => current || String(rooms[0]?.id ?? ""));
      return;
    }

    const editId = Number(editIdParam);
    if (!Number.isFinite(editId) || editId <= 0) {
      setError("Invalid bed selected for editing.");
      return;
    }

    const match = beds.find((bed) => bed.id === editId);
    if (match) {
      setEditingId(match.id);
      setStatus(match.status);
      setRoomId(String(match.roomId));
      setError(null);
    }
  }, [beds, editIdParam, rooms]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedRoomId = Number(roomId);
    if (!Number.isFinite(selectedRoomId) || selectedRoomId <= 0) {
      setError("Please select a room.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = { status, roomId: selectedRoomId };
      if (editingId == null) {
        await createBed(payload);
      } else {
        await updateBed(editingId, payload);
      }
      setEditingId(null);
      setStatus("AVAILABLE");
      router.replace("/beds");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save bed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(bed: BedUnitManagementDto) {
    if (!window.confirm(`Delete bed #${bed.id}?`)) {
      return;
    }

    try {
      setError(null);
      await deleteBed(bed.id);
      if (editingId === bed.id) {
        setEditingId(null);
        setStatus("AVAILABLE");
        router.replace("/beds");
      }
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete bed.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title text-3xl font-semibold tracking-tight sm:text-4xl">
          Beds
        </h1>
        <p className="section-copy mt-2 max-w-2xl text-base">
          Create or update bed units here. The full bed listing now lives on the separate records page.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form onSubmit={handleSubmit} className="surface-card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId == null ? "Create bed" : "Edit bed"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Assign the bed to a room and maintain its latest occupancy state.
              </p>
            </div>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setStatus("AVAILABLE");
                  setRoomId(String(rooms[0]?.id ?? ""));
                  router.replace("/beds");
                }}
                className="secondary-action rounded-full px-4 py-2 text-sm font-medium"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BedUnitStatus)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="NOTICE">NOTICE</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Room</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.propertyName} · {room.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="primary-action inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : editingId == null ? "Create bed" : "Update bed"}
            </button>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  const current = beds.find((bed) => bed.id === editingId);
                  if (current) {
                    void handleDelete(current);
                  }
                }}
                className="rounded-full border border-rose-300 bg-white px-5 py-3 text-base font-semibold text-rose-700 hover:bg-rose-50"
              >
                Delete bed
              </button>
            )}
          </div>
        </form>

        <div className="surface-card rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-slate-900">Bed records moved</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Bed listings are now available on the dedicated records page with the cleaner table format you requested.
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>
              {loading
                ? "Loading latest bed totals..."
                : `${beds.length} bed records are currently available in the records page.`}
            </p>
            <p>
              Open the records page to browse rows, launch edits, or delete beds from the centralized listing screen.
            </p>
          </div>
          <Link
            href="/records?tab=beds"
            className="primary-action mt-6 inline-flex rounded-full px-5 py-3 text-base font-semibold"
          >
            Open bed records
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BedsPage() {
  return (
    <Suspense>
      <BedsPageContent />
    </Suspense>
  );
}
