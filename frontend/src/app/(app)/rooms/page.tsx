"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  createRoom,
  deleteRoom,
  listProperties,
  listRooms,
  updateRoom,
  type PropertyDto,
  type RoomManagementDto,
} from "@/lib/api";

function RoomsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get("edit");
  const [rooms, setRooms] = useState<RoomManagementDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomData, propertyData] = await Promise.all([listRooms(), listProperties()]);
      setRooms(roomData);
      setProperties(propertyData);
      setPropertyId((current) => current || String(propertyData[0]?.id ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rooms.");
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
      setFormName("");
      setPropertyId((current) => current || String(properties[0]?.id ?? ""));
      return;
    }

    const editId = Number(editIdParam);
    if (!Number.isFinite(editId) || editId <= 0) {
      setError("Invalid room selected for editing.");
      return;
    }

    const match = rooms.find((room) => room.id === editId);
    if (match) {
      setEditingId(match.id);
      setFormName(match.name);
      setPropertyId(String(match.propertyId));
      setError(null);
    }
  }, [editIdParam, properties, rooms]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = formName.trim();
    const selectedPropertyId = Number(propertyId);
    if (!name) {
      setError("Room name is required.");
      return;
    }
    if (!Number.isFinite(selectedPropertyId) || selectedPropertyId <= 0) {
      setError("Please select a property.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = { name, propertyId: selectedPropertyId };
      if (editingId == null) {
        await createRoom(payload);
      } else {
        await updateRoom(editingId, payload);
      }
      setEditingId(null);
      setFormName("");
      router.replace("/rooms");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save room.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(room: RoomManagementDto) {
    if (!window.confirm(`Delete room "${room.name}"? This will also remove its bed units.`)) {
      return;
    }

    try {
      setError(null);
      await deleteRoom(room.id);
      if (editingId === room.id) {
        setEditingId(null);
        setFormName("");
        router.replace("/rooms");
      }
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete room.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title text-3xl font-semibold tracking-tight sm:text-4xl">
          Rooms
        </h1>
        <p className="section-copy mt-2 max-w-2xl text-base">
          Create or update rooms here. The full room listing now lives on the separate records page.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form onSubmit={handleSubmit} className="surface-card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId == null ? "Create room" : "Edit room"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Link each room to a property and update its name when needed.
              </p>
            </div>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormName("");
                  setPropertyId(String(properties[0]?.id ?? ""));
                  router.replace("/rooms");
                }}
                className="secondary-action rounded-full px-4 py-2 text-sm font-medium"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Room name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. A-101"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Property</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
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
              {saving ? "Saving..." : editingId == null ? "Create room" : "Update room"}
            </button>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  const current = rooms.find((room) => room.id === editingId);
                  if (current) {
                    void handleDelete(current);
                  }
                }}
                className="rounded-full border border-rose-300 bg-white px-5 py-3 text-base font-semibold text-rose-700 hover:bg-rose-50"
              >
                Delete room
              </button>
            )}
          </div>
        </form>

        <div className="surface-card rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-slate-900">Room records moved</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Room listings are now on the central records page in a table layout inspired by your shared design.
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>
              {loading
                ? "Loading latest room totals..."
                : `${rooms.length} room records are currently available in the records page.`}
            </p>
            <p>
              Use the records page to browse rows, launch edits, or delete rooms while this page stays focused on the room form.
            </p>
          </div>
          <Link
            href="/records?tab=rooms"
            className="primary-action mt-6 inline-flex rounded-full px-5 py-3 text-base font-semibold"
          >
            Open room records
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense>
      <RoomsPageContent />
    </Suspense>
  );
}
