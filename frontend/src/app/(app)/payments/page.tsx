"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createPayment,
  deletePayment,
  listPayments,
  updatePayment,
  type PaymentDto,
  type PaymentStatus,
} from "@/lib/api";
import { useInventory } from "@/lib/useInventory";

interface FormState {
  txnNo: string;
  amount: string;
  paymentDate: string;
  paymentMode: string;
  status: PaymentStatus;
  propertyId: string;
  roomId: string;
  bedUnitId: string;
}

function paymentStatusClass(status: PaymentStatus) {
  return status === "VERIFIED"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

export default function PaymentsPage() {
  const { properties, rooms, beds, loading: inventoryLoading, error: inventoryError } = useInventory();
  const [form, setForm] = useState<FormState>({
    txnNo: "",
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: "",
    status: "PENDING",
    propertyId: "",
    roomId: "",
    bedUnitId: "",
  });
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  function resetForm() {
    setForm({
      txnNo: "",
      amount: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: "",
      status: "PENDING",
      propertyId: "",
      roomId: "",
      bedUnitId: "",
    });
  }

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function loadPayments() {
    try {
      setLoading(true);
      setError(null);
      setPayments(await listPayments());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
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
    if (!Number.isFinite(selectedRoomId) || selectedRoomId <= 0) {
      return [];
    }
    return beds.filter((bed) => bed.roomId === selectedRoomId);
  }, [beds, form.roomId]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter(
      (payment) =>
        payment.txnNo.toLowerCase().includes(query) ||
        payment.status.toLowerCase().includes(query) ||
        payment.createdByUsername.toLowerCase().includes(query) ||
        (payment.paymentMode ?? "").toLowerCase().includes(query) ||
        (payment.propertyName ?? "").toLowerCase().includes(query) ||
        (payment.roomName ?? "").toLowerCase().includes(query) ||
        String(payment.bedUnitId ?? "").includes(query),
    );
  }, [payments, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.txnNo.trim()) {
      setError("Transaction number is required.");
      return;
    }

    const amountNumber = Number(form.amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    if (!form.paymentDate) {
      setError("Payment date is required.");
      return;
    }

    const propertyId = Number(form.propertyId);
    const roomId = Number(form.roomId);
    const bedUnitId = Number(form.bedUnitId);

    if (!Number.isFinite(propertyId) || propertyId <= 0) {
      setError("Please select a property for this payment.");
      return;
    }
    if (!Number.isFinite(roomId) || roomId <= 0) {
      setError("Please select a room for this payment.");
      return;
    }
    if (!Number.isFinite(bedUnitId) || bedUnitId <= 0) {
      setError("Please select a bed for this payment.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        txnNo: form.txnNo.trim(),
        amount: amountNumber,
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode.trim() || null,
        status: form.status,
        propertyId,
        roomId,
        bedUnitId,
      };

      if (editingId == null) {
        await createPayment(payload);
      } else {
        await updatePayment(editingId, payload);
      }

      resetForm();
      setEditingId(null);
      await loadPayments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save payment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(payment: PaymentDto) {
    if (!window.confirm(`Delete payment "${payment.txnNo}"?`)) {
      return;
    }

    try {
      setError(null);
      await deletePayment(payment.id);
      if (editingId === payment.id) {
        setEditingId(null);
        resetForm();
      }
      await loadPayments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete payment.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="section-title text-3xl font-semibold tracking-tight sm:text-4xl">
            Payments
          </h1>
          <p className="section-copy mt-2 max-w-3xl text-base">
            Create, edit, and delete payment entries while linking each payment to the exact property, room, and bed it belongs to.
          </p>
        </div>
        <div className="data-pill border border-emerald-200 bg-emerald-50 text-emerald-800">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Connected to /api/payments
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
                {editingId == null ? "Create payment" : "Edit payment"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Keep transaction details up to date and attach every payment to the correct stay location.
              </p>
            </div>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  resetForm();
                }}
                className="secondary-action rounded-full px-4 py-2 text-sm font-medium"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Transaction number
            </label>
            <input
              type="text"
              value={form.txnNo}
              onChange={(e) => handleChange("txnNo", e.target.value)}
              placeholder="e.g. TXN-001"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
            <p className="mt-2 text-sm text-slate-600">
              This value must be unique. The backend rejects duplicates.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="150.50"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Payment date
              </label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) => handleChange("paymentDate", e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Payment mode</label>
              <input
                type="text"
                value={form.paymentMode}
                onChange={(e) => handleChange("paymentMode", e.target.value)}
                placeholder="Cash, UPI, Bank transfer"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value as PaymentStatus)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="PENDING">PENDING</option>
                <option value="VERIFIED">VERIFIED</option>
              </select>
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || inventoryLoading}
            className="primary-action inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : editingId == null ? "Create payment" : "Update payment"}
          </button>
        </form>

        <div className="space-y-5">
          <div className="surface-card rounded-3xl p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Payment list
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Search by transaction, location, status, mode, bed, or agent.
                </p>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payments"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 sm:max-w-xs"
              />
            </div>

            {loading && <div className="mt-5 text-sm text-slate-600">Loading payments...</div>}
            {!loading && !error && filteredPayments.length === 0 && (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                No payments match your search yet.
              </div>
            )}
            {!loading && !error && filteredPayments.length > 0 && (
              <div className="mt-5 grid gap-4">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{payment.txnNo}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {payment.paymentDate} · {payment.paymentMode ?? "No mode"} · Amount {payment.amount.toFixed(2)}
                        </p>
                      </div>
                      <span className={`data-pill border ${paymentStatusClass(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Linked location
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {payment.propertyName ?? "Unlinked"} / {payment.roomName ?? "Unlinked"} / Bed #{payment.bedUnitId ?? "-"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Recorded by
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {payment.createdByUsername}
                        </p>
                        <p className="text-sm text-slate-600">User ID {payment.createdByUserId}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {payment.propertyId != null && (
                        <span className="data-pill border border-violet-200 bg-violet-50 text-violet-800">
                          Property ID {payment.propertyId}
                        </span>
                      )}
                      {payment.roomId != null && (
                        <span className="data-pill border border-cyan-200 bg-cyan-50 text-cyan-800">
                          Room ID {payment.roomId}
                        </span>
                      )}
                      {payment.bedUnitId != null && (
                        <span className="data-pill border border-emerald-200 bg-emerald-50 text-emerald-800">
                          Bed ID {payment.bedUnitId}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(payment.id);
                          setForm({
                            txnNo: payment.txnNo,
                            amount: String(payment.amount),
                            paymentDate: payment.paymentDate,
                            paymentMode: payment.paymentMode ?? "",
                            status: payment.status,
                            propertyId: payment.propertyId == null ? "" : String(payment.propertyId),
                            roomId: payment.roomId == null ? "" : String(payment.roomId),
                            bedUnitId: payment.bedUnitId == null ? "" : String(payment.bedUnitId),
                          });
                        }}
                        className="secondary-action rounded-full px-4 py-2 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(payment)}
                        className="rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
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
