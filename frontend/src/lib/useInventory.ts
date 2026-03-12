"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getInventoryMap,
  INVENTORY_CHANGED_EVENT,
  type BedUnitDto,
  type InventoryMapDto,
  type PropertyDto,
  type RoomDto,
} from "@/lib/api";

export interface InventoryViewModel {
  data: InventoryMapDto | null;
  loading: boolean;
  error: string | null;
  properties: PropertyDto[];
  rooms: Array<RoomDto & { propertyName: string }>;
  beds: Array<BedUnitDto & { roomName: string; propertyName: string }>;
  refetch: () => Promise<void>;
}

export function useInventory(): InventoryViewModel {
  const [data, setData] = useState<InventoryMapDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    try {
      setLoading(true);
      const map = await getInventoryMap();
      setData(map);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refetch();

    function handleInventoryChanged() {
      void refetch();
    }

    window.addEventListener(INVENTORY_CHANGED_EVENT, handleInventoryChanged);
    return () => {
      window.removeEventListener(INVENTORY_CHANGED_EVENT, handleInventoryChanged);
    };
  }, []);

  const properties = useMemo(() => data?.properties ?? [], [data]);

  const rooms = useMemo(
    () =>
      properties.flatMap((property) =>
        property.rooms.map((room) => ({
          ...room,
          propertyName: property.name,
        })),
      ),
    [properties],
  );

  const beds = useMemo(
    () =>
      properties.flatMap((property) =>
        property.rooms.flatMap((room) =>
          room.bedUnits.map((bed) => ({
            ...bed,
            roomName: room.name,
            propertyName: property.name,
          })),
        ),
      ),
    [properties],
  );

  return { data, loading, error, properties, rooms, beds, refetch };
}
