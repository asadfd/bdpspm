"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  deleteBed,
  deleteProperty,
  deleteRoom,
  listBeds,
  listProperties,
  listRooms,
  type BedUnitManagementDto,
  type PropertyDto,
  type RoomManagementDto,
} from "@/lib/api";

type TabKey = "properties" | "rooms" | "beds";

function statusPillClasses(kind: "good" | "warn" | "notice") {
  switch (kind) {
    case "good":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "warn":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function RecordsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>("properties");
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [rooms, setRooms] = useState<RoomManagementDto[]>([]);
  const [beds, setBeds] = useState<BedUnitManagementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (requestedTab === "properties" || requestedTab === "rooms" || requestedTab === "beds") {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  async function loadRecords() {
    try {
      setLoading(true);
      setError(null);
      const [propertyData, roomData, bedData] = await Promise.all([
        listProperties(),
        listRooms(),
        listBeds(),
      ]);
      setProperties(propertyData);
      setRooms(roomData);
      setBeds(bedData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return properties;
    return properties.filter((property) => {
      const bedCount = property.rooms.reduce((sum, room) => sum + room.bedUnits.length, 0);
      return (
        property.name.toLowerCase().includes(query) ||
        String(property.id).includes(query) ||
        String(property.rooms.length).includes(query) ||
        String(bedCount).includes(query)
      );
    });
  }, [properties, search]);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rooms;
    return rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(query) ||
        room.propertyName.toLowerCase().includes(query) ||
        String(room.id).includes(query) ||
        String(room.bedCount).includes(query),
    );
  }, [rooms, search]);

  const filteredBeds = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return beds;
    return beds.filter(
      (bed) =>
        String(bed.id).includes(query) ||
        bed.propertyName.toLowerCase().includes(query) ||
        bed.roomName.toLowerCase().includes(query) ||
        String(bed.status).toLowerCase().includes(query),
    );
  }, [beds, search]);

  async function handleDeleteProperty(property: PropertyDto) {
    if (!window.confirm(`Delete property "${property.name}"? This will also remove its rooms and beds.`)) {
      return;
    }
    try {
      setError(null);
      await deleteProperty(property.id);
      await loadRecords();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete property.");
    }
  }

  async function handleDeleteRoom(room: RoomManagementDto) {
    if (!window.confirm(`Delete room "${room.name}"? This will also remove its bed units.`)) {
      return;
    }
    try {
      setError(null);
      await deleteRoom(room.id);
      await loadRecords();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete room.");
    }
  }

  async function handleDeleteBed(bed: BedUnitManagementDto) {
    if (!window.confirm(`Delete bed #${bed.id}?`)) {
      return;
    }
    try {
      setError(null);
      await deleteBed(bed.id);
      await loadRecords();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete bed.");
    }
  }

  const createHref =
    activeTab === "properties" ? "/properties" : activeTab === "rooms" ? "/rooms" : "/beds";
  const createLabel =
    activeTab === "properties" ? "Property" : activeTab === "rooms" ? "Room" : "Bed";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title text-3xl font-semibold tracking-tight sm:text-4xl">
          Records
        </h1>
        <p className="section-copy mt-2 max-w-3xl text-base">
          Centralized listings for properties, rooms, and beds. The table layout follows the clean record style you shared.
        </p>
      </div>

      <div className="surface-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["properties", "rooms", "beds"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setSearch("");
                    router.replace(`/records?tab=${tab}`);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    activeTab === tab ? "primary-action" : "secondary-action"
                  }`}
                >
                  {tab === "properties" ? "Properties" : tab === "rooms" ? "Rooms" : "Beds"}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}`}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 sm:max-w-sm"
            />
          </div>

          <Link
            href={createHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1684f7] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(22,132,247,0.2)] hover:bg-[#0d78e6]"
          >
            <span className="text-base leading-none">+</span>
            New {createLabel}
          </Link>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
          {loading && (
            <div className="px-6 py-10 text-sm text-slate-600">Loading records...</div>
          )}

          {!loading && activeTab === "properties" && (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-white">
                <tr className="border-b border-slate-200 text-slate-900">
                  <th className="w-14 px-5 py-4 text-left">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">Property</th>
                  <th className="px-5 py-4 text-left font-semibold">Rooms</th>
                  <th className="px-5 py-4 text-left font-semibold">Beds</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => {
                  const bedCount = property.rooms.reduce((sum, room) => sum + room.bedUnits.length, 0);
                  const statusLabel = property.rooms.length === 0 ? "Needs rooms" : "Active";
                  const statusKind = property.rooms.length === 0 ? "notice" : "good";

                  return (
                    <tr key={property.id} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-5 py-4">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => router.push(`/properties?edit=${property.id}`)}
                          className="font-medium text-[#2a7df7] hover:underline"
                        >
                          {property.name}
                        </button>
                        <div className="mt-1 text-xs text-slate-500">Property ID {property.id}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{property.rooms.length}</td>
                      <td className="px-5 py-4 text-slate-700">{bedCount}</td>
                      <td className="px-5 py-4">
                        <span className={`data-pill border ${statusPillClasses(statusKind)}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/properties?edit=${property.id}`)}
                            className="secondary-action rounded-full px-4 py-2 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteProperty(property)}
                            className="rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProperties.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-600">
                      No property records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {!loading && activeTab === "rooms" && (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-white">
                <tr className="border-b border-slate-200 text-slate-900">
                  <th className="w-14 px-5 py-4 text-left">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">Room</th>
                  <th className="px-5 py-4 text-left font-semibold">Property</th>
                  <th className="px-5 py-4 text-left font-semibold">Bed units</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => {
                  const statusLabel = room.bedCount === 0 ? "Needs beds" : "Allocated";
                  const statusKind = room.bedCount === 0 ? "notice" : "good";

                  return (
                    <tr key={room.id} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-5 py-4">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => router.push(`/rooms?edit=${room.id}`)}
                          className="font-medium text-[#2a7df7] hover:underline"
                        >
                          {room.name}
                        </button>
                        <div className="mt-1 text-xs text-slate-500">Room ID {room.id}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{room.propertyName}</td>
                      <td className="px-5 py-4 text-slate-700">{room.bedCount}</td>
                      <td className="px-5 py-4">
                        <span className={`data-pill border ${statusPillClasses(statusKind)}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/rooms?edit=${room.id}`)}
                            className="secondary-action rounded-full px-4 py-2 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteRoom(room)}
                            className="rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-600">
                      No room records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {!loading && activeTab === "beds" && (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-white">
                <tr className="border-b border-slate-200 text-slate-900">
                  <th className="w-14 px-5 py-4 text-left">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">Bed</th>
                  <th className="px-5 py-4 text-left font-semibold">Property</th>
                  <th className="px-5 py-4 text-left font-semibold">Room</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeds.map((bed) => {
                  const statusKind =
                    bed.status === "AVAILABLE" ? "good" : bed.status === "OCCUPIED" ? "warn" : "notice";

                  return (
                    <tr key={bed.id} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-5 py-4">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => router.push(`/beds?edit=${bed.id}`)}
                          className="font-medium text-[#2a7df7] hover:underline"
                        >
                          Bed #{bed.id}
                        </button>
                        <div className="mt-1 text-xs text-slate-500">Bed ID {bed.id}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{bed.propertyName}</td>
                      <td className="px-5 py-4 text-slate-700">{bed.roomName}</td>
                      <td className="px-5 py-4">
                        <span className={`data-pill border ${statusPillClasses(statusKind)}`}>
                          {bed.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/beds?edit=${bed.id}`)}
                            className="secondary-action rounded-full px-4 py-2 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteBed(bed)}
                            className="rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredBeds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-600">
                      No bed records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense>
      <RecordsPageContent />
    </Suspense>
  );
}
