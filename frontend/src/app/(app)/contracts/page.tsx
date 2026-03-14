"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  createContract,
  deleteContract,
  endContract,
  listContracts,
  updateContract,
  type TenancyContractDto,
  type TenancyContractRequest,
  type TenancyContractStatus,
} from "@/lib/api";
import { useInventory } from "@/lib/useInventory";

interface FormState {
  tenantName: string;
  tenantGovernmentId: string;
  tenantPhoneNumber: string;
  propertyId: string;
  roomId: string;
  bedUnitId: string;
  rentAmount: string;
  startDate: string;
  endDate: string;
}

function contractStatusClass(status: TenancyContractStatus) {
  if (status === "ACTIVE") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (status === "NOTICE") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default function ContractsPage() {
  const {
    properties,
    rooms,
    beds,
    loading: inventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useInventory();
  const [contracts, setContracts] = useState<TenancyContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    tenantName: "",
    tenantGovernmentId: "",
    tenantPhoneNumber: "",
    propertyId: "",
    roomId: "",
    bedUnitId: "",
    rentAmount: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  });

  function resetForm() {
    setForm({
      tenantName: "",
      tenantGovernmentId: "",
      tenantPhoneNumber: "",
      propertyId: "",
      roomId: "",
      bedUnitId: "",
      rentAmount: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
    });
  }

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function loadContracts() {
    try {
      setLoading(true);
      setError(null);
      setContracts(await listContracts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contracts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContracts();
  }, []);

  const availableRooms = useMemo(() => {
    const selectedPropertyId = Number(form.propertyId);
    if (!Number.isFinite(selectedPropertyId) || selectedPropertyId <= 0) {
      return [];
    }
    return rooms.filter((room) => room.propertyId === selectedPropertyId);
  }, [form.propertyId, rooms]);

  const availableBeds = useMemo(() => {
    const selectedRoomId = Number(form.roomId);
    const selectedBedId = Number(form.bedUnitId);
    if (!Number.isFinite(selectedRoomId) || selectedRoomId <= 0) {
      return [];
    }
    return beds.filter(
      (bed) =>
        bed.roomId === selectedRoomId &&
        (bed.status === "AVAILABLE" || (Number.isFinite(selectedBedId) && bed.id === selectedBedId)),
    );
  }, [beds, form.bedUnitId, form.roomId]);

  const filteredContracts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return contracts;
    }
    return contracts.filter(
      (contract) =>
        contract.tenantName.toLowerCase().includes(query) ||
        contract.tenantGovernmentId.toLowerCase().includes(query) ||
        contract.tenantPhoneNumber.toLowerCase().includes(query) ||
        contract.propertyName.toLowerCase().includes(query) ||
        contract.roomName.toLowerCase().includes(query) ||
        contract.status.toLowerCase().includes(query) ||
        String(contract.bedUnitId).includes(query),
    );
  }, [contracts, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.tenantName.trim()) {
      setError("Tenant name is required.");
      return;
    }
    if (!form.tenantGovernmentId.trim()) {
      setError("Tenant ID is required.");
      return;
    }
    if (!form.tenantPhoneNumber.trim()) {
      setError("Tenant phone number is required.");
      return;
    }

    const propertyId = Number(form.propertyId);
    const roomId = Number(form.roomId);
    const bedUnitId = Number(form.bedUnitId);
    const rentAmount = Number(form.rentAmount);

    if (!Number.isFinite(propertyId) || propertyId <= 0) {
      setError("Please select a property.");
      return;
    }
    if (!Number.isFinite(roomId) || roomId <= 0) {
      setError("Please select a room.");
      return;
    }
    if (!Number.isFinite(bedUnitId) || bedUnitId <= 0) {
      setError("Please select a bed.");
      return;
    }
    if (!Number.isFinite(rentAmount) || rentAmount <= 0) {
      setError("Rent amount must be a positive number.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Start and end dates are required.");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    const payload: TenancyContractRequest = {
      tenantName: form.tenantName.trim(),
      tenantGovernmentId: form.tenantGovernmentId.trim(),
      tenantPhoneNumber: form.tenantPhoneNumber.trim(),
      propertyId,
      roomId,
      bedUnitId,
      rentAmount,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    setSubmitting(true);
    try {
      if (editingId == null) {
        await createContract(payload);
      } else {
        await updateContract(editingId, payload);
      }
      await refetchInventory();
      setEditingId(null);
      resetForm();
      await loadContracts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save contract.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(contract: TenancyContractDto) {
    if (!window.confirm(`Delete ended contract for "${contract.tenantName}"?`)) {
      return;
    }
    try {
      setError(null);
      await deleteContract(contract.id);
      if (editingId === contract.id) {
        setEditingId(null);
        resetForm();
      }
      await refetchInventory();
      await loadContracts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete contract.");
    }
  }

  async function handleEnd(contract: TenancyContractDto, immediateEnd: boolean) {
    const prompt = immediateEnd
      ? `Immediately end the contract for "${contract.tenantName}"?`
      : `Move the contract for "${contract.tenantName}" into notice?`;
    if (!window.confirm(prompt)) {
      return;
    }
    try {
      setError(null);
      await endContract(contract.id, immediateEnd);
      await refetchInventory();
      await loadContracts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to end contract.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <Link href="/dashboard" className="secondary-action action-button-sm">
              Back to dashboard
            </Link>
          </div>
          <h1 className="section-title text-3xl font-semibold tracking-tight sm:text-4xl">
            Tenancy Contracts
          </h1>
          <p className="section-copy mt-2 max-w-3xl text-base">
            Create bed rental contracts with tenant details, rent, stay dates, and clear end actions. Active contracts keep the bed occupied until the contract is ended.
          </p>
        </div>
        <div className="data-pill border border-violet-200 bg-violet-50 text-violet-800">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          Connected to /api/contracts
        </div>
      </div>

      {inventoryError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {inventoryError}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <form onSubmit={handleSubmit} className="surface-card space-y-5 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId == null ? "Create tenancy contract" : "Edit tenancy contract"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Select the stay location first, then capture tenant identity and rent details.
              </p>
            </div>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  resetForm();
                }}
                className="secondary-action action-button-sm"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Tenant name</label>
              <input
                type="text"
                value={form.tenantName}
                onChange={(e) => handleChange("tenantName", e.target.value)}
                placeholder="Full tenant name"
                className="field-control"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Tenant ID</label>
              <input
                type="text"
                value={form.tenantGovernmentId}
                onChange={(e) => handleChange("tenantGovernmentId", e.target.value)}
                placeholder="Government ID / document number"
                className="field-control"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Phone number</label>
              <input
                type="text"
                value={form.tenantPhoneNumber}
                onChange={(e) => handleChange("tenantPhoneNumber", e.target.value)}
                placeholder="Tenant phone number"
                className="field-control"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Monthly rent</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.rentAmount}
                onChange={(e) => handleChange("rentAmount", e.target.value)}
                placeholder="1500.00"
                className="field-control"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Property</label>
              <select
                value={form.propertyId}
                onChange={(e) => {
                  const propertyId = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    propertyId,
                    roomId: "",
                    bedUnitId: "",
                  }));
                }}
                disabled={inventoryLoading}
                className="field-control"
              >
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Room</label>
              <select
                value={form.roomId}
                onChange={(e) => {
                  const roomId = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    roomId,
                    bedUnitId: "",
                  }));
                }}
                disabled={inventoryLoading || !form.propertyId}
                className="field-control"
              >
                <option value="">Select a room</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Bed</label>
              <select
                value={form.bedUnitId}
                onChange={(e) => handleChange("bedUnitId", e.target.value)}
                disabled={inventoryLoading || !form.roomId}
                className="field-control"
              >
                <option value="">Select a bed</option>
                {availableBeds.map((bed) => (
                  <option key={bed.id} value={bed.id}>
                    Bed #{bed.id} - {bed.status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className="field-control"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className="field-control"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || inventoryLoading}
            className="primary-action action-button w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : editingId == null ? "Create contract" : "Update contract"}
          </button>
        </form>

        <div className="space-y-5">
          <div className="surface-card rounded-3xl p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Contract list
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Search by tenant, ID, phone, property, room, bed, or contract status.
                </p>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contracts"
                className="field-control sm:max-w-xs"
              />
            </div>

            {loading && <div className="mt-5 text-sm text-slate-600">Loading contracts...</div>}
            {!loading && !error && filteredContracts.length === 0 && (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                No contracts match your search yet.
              </div>
            )}
            {!loading && !error && filteredContracts.length > 0 && (
              <div className="mt-5 grid gap-4">
                {filteredContracts.map((contract) => (
                  <div key={contract.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{contract.tenantName}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {contract.propertyName} / {contract.roomName} / Bed #{contract.bedUnitId}
                        </p>
                      </div>
                      <span className={`data-pill border ${contractStatusClass(contract.status)}`}>
                        {contract.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Tenant details
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">{contract.tenantGovernmentId}</p>
                        <p className="text-sm text-slate-600">{contract.tenantPhoneNumber}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Stay period
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {contract.startDate} to {contract.endDate}
                        </p>
                        <p className="text-sm text-slate-600">
                          Rent {contract.rentAmount.toFixed(2)} / Bed status {contract.bedStatus}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="data-pill border border-violet-200 bg-violet-50 text-violet-800">
                        Contract #{contract.id}
                      </span>
                      <span className="data-pill border border-cyan-200 bg-cyan-50 text-cyan-800">
                        Property ID {contract.propertyId}
                      </span>
                      <span className="data-pill border border-emerald-200 bg-emerald-50 text-emerald-800">
                        Room ID {contract.roomId}
                      </span>
                      <span className="data-pill border border-amber-200 bg-amber-50 text-amber-800">
                        Bed ID {contract.bedUnitId}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {contract.status !== "ENDED" && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(contract.id);
                            setForm({
                              tenantName: contract.tenantName,
                              tenantGovernmentId: contract.tenantGovernmentId,
                              tenantPhoneNumber: contract.tenantPhoneNumber,
                              propertyId: String(contract.propertyId),
                              roomId: String(contract.roomId),
                              bedUnitId: String(contract.bedUnitId),
                              rentAmount: String(contract.rentAmount),
                              startDate: contract.startDate,
                              endDate: contract.endDate,
                            });
                          }}
                          className="secondary-action action-button-sm"
                        >
                          Edit
                        </button>
                      )}
                      {contract.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => void handleEnd(contract, false)}
                          className="secondary-action action-button-sm"
                        >
                          Move to notice
                        </button>
                      )}
                      {contract.status !== "ENDED" && (
                        <button
                          type="button"
                          onClick={() => void handleEnd(contract, true)}
                          className="danger-action action-button-sm"
                        >
                          Immediate end
                        </button>
                      )}
                      {contract.status === "ENDED" && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(contract)}
                          className="danger-action action-button-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
