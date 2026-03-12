"use client";

import { useState } from "react";
import type { BedUnitDto, PropertyDto, RoomDto } from "@/lib/api";
import { useInventory } from "@/lib/useInventory";

export default function InventoryPage() {
  const { data, loading, error, refetch } = useInventory();
  const [activePropertyId, setActivePropertyId] = useState<number | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const activeProperty: PropertyDto | undefined = (() => {
    const firstProperty = data?.properties[0];
    if (!firstProperty) return undefined;
    return data?.properties.find((property) => property.id === activePropertyId) ?? firstProperty;
  })();

  const activeRoom: RoomDto | undefined = (() => {
    const firstRoom = activeProperty?.rooms[0];
    if (!firstRoom) return undefined;
    return activeProperty?.rooms.find((room) => room.id === activeRoomId) ?? firstRoom;
  })();

  function statusClasses(status: BedUnitDto["status"]) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="section-title text-3xl font-semibold tracking-tight sm:text-4xl">
            Inventory
          </h1>
          <p className="section-copy mt-2 max-w-2xl text-base">
            Review the full property hierarchy and inspect room-wise bed status from one screen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="data-pill border border-emerald-200 bg-emerald-50 text-emerald-800">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Connected to /api/inventory/map
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="secondary-action rounded-full px-4 py-2 text-sm font-medium"
          >
            Refresh inventory
          </button>
        </div>
      </div>

      {loading && (
        <div className="surface-card flex h-40 items-center justify-center rounded-3xl">
          <p className="text-base text-slate-600">Loading inventory...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid gap-5 xl:grid-cols-[minmax(340px,1fr)_minmax(0,1.5fr)]">
          <div className="space-y-5">
            <div className="surface-card rounded-3xl p-5">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Properties
              </p>
              {data.properties.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No properties found yet. Seed backend data to start exploring the hierarchy.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.properties.map((property) => (
                    <li key={property.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePropertyId(property.id);
                          setActiveRoomId(property.rooms[0]?.id ?? null);
                        }}
                        className={`w-full rounded-2xl border px-4 py-4 text-left ${
                          property.id === activeProperty?.id
                            ? "border-emerald-300 bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-900">{property.name}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {property.rooms.length} room{property.rooms.length === 1 ? "" : "s"}
                            </p>
                          </div>
                          <span className="data-pill border border-slate-200 bg-slate-50 text-slate-700">
                            ID {property.id}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {activeProperty && (
              <div className="surface-card rounded-3xl p-5">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Rooms in {activeProperty.name}
                </p>
                {activeProperty.rooms.length === 0 ? (
                  <p className="text-sm text-slate-600">No rooms found for this property.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeProperty.rooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setActiveRoomId(room.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium ${
                          room.id === activeRoom?.id
                            ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {room.name} ({room.bedUnits.length})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="surface-card rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Bed units
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {activeRoom
                    ? `${activeRoom.name} · ${activeProperty?.name ?? "Property"}`
                    : "Select a room to see its bed units"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="data-pill border border-emerald-200 bg-emerald-50 text-emerald-800">
                  Available
                </span>
                <span className="data-pill border border-rose-200 bg-rose-50 text-rose-800">
                  Occupied
                </span>
                <span className="data-pill border border-amber-200 bg-amber-50 text-amber-800">
                  Notice
                </span>
              </div>
            </div>

            <div className="mt-5">
              {activeRoom && activeRoom.bedUnits.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeRoom.bedUnits.map((bed) => (
                    <div
                      key={bed.id}
                      className={`rounded-2xl border px-4 py-4 shadow-sm ${statusClasses(bed.status)}`}
                    >
                      <p className="text-base font-semibold">Bed #{bed.id}</p>
                      <p className="mt-1 text-sm font-medium uppercase tracking-wide">
                        {String(bed.status)}
                      </p>
                      <p className="mt-3 text-sm">Room ID: {bed.roomId}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                  {activeRoom
                    ? "No bed units defined for this room yet."
                    : "Choose a property and room to view bed units."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
