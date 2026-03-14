"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listContracts,
  createPayment,
  deletePayment,
  listPayments,
  updatePayment,
  type PaymentDto,
  type PaymentStatus,
  type TenancyContractDto,
} from "@/lib/api";

interface FormState {
  tenancyContractId: string;
  paymentDate: string;
  dueDate: string;
  amountPaid: string;
  amountPending: string;
  status: PaymentStatus;
}

function paymentStatusClass(status: PaymentStatus) {
  if (status === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "HALF_PAID") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (status === "OVERDUE") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function PaymentsPage() {
  const [form, setForm] = useState<FormState>({
    tenancyContractId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    amountPaid: "",
    amountPending: "",
    status: "PENDING",
  });
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [contracts, setContracts] = useState<TenancyContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  function resetForm() {
    setForm({
      tenancyContractId: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      amountPaid: "",
      amountPending: "",
      status: "PENDING",
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

  async function loadContracts() {
    try {
      setContractsLoading(true);
      setError(null);
      setContracts(await listContracts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contracts.");
    } finally {
      setContractsLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
    void loadContracts();
  }, []);

  const availableContracts = useMemo(() => {
    const selectedContractId = Number(form.tenancyContractId);
    return contracts.filter(
      (contract) =>
        contract.status !== "ENDED" ||
        (Number.isFinite(selectedContractId) && contract.id === selectedContractId),
    );
  }, [contracts, form.tenancyContractId]);

  const selectedContract = useMemo(() => {
    const selectedContractId = Number(form.tenancyContractId);
    if (!Number.isFinite(selectedContractId) || selectedContractId <= 0) {
      return null;
    }
    return contracts.find((contract) => contract.id === selectedContractId) ?? null;
  }, [contracts, form.tenancyContractId]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter(
      (payment) =>
        String(payment.id).includes(query) ||
        (payment.tenantName ?? "").toLowerCase().includes(query) ||
        payment.status.toLowerCase().includes(query) ||
        (payment.contractStatus ?? "").toLowerCase().includes(query) ||
        payment.createdByUsername.toLowerCase().includes(query) ||
        (payment.propertyName ?? "").toLowerCase().includes(query) ||
        (payment.roomName ?? "").toLowerCase().includes(query) ||
        String(payment.bedUnitId ?? "").includes(query) ||
        String(payment.tenancyContractId ?? "").includes(query),
    );
  }, [payments, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const contractId = Number(form.tenancyContractId);
    if (!Number.isFinite(contractId) || contractId <= 0) {
      setError("Please select a tenancy contract.");
      return;
    }

    const amountPaid = Number(form.amountPaid);
    const amountPending = Number(form.amountPending);
    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      setError("Amount paid must be zero or a positive number.");
      return;
    }
    if (!Number.isFinite(amountPending) || amountPending < 0) {
      setError("Amount pending must be zero or a positive number.");
      return;
    }

    if (!form.paymentDate) {
      setError("Payment date is required.");
      return;
    }
    if (!form.dueDate) {
      setError("Due date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        paymentDate: form.paymentDate,
        dueDate: form.dueDate,
        amountPaid,
        amountPending,
        status: form.status,
        tenancyContractId: contractId,
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
    if (!window.confirm(`Delete payment #${payment.id}?`)) {
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
          <div className="mb-4 flex flex-wrap gap-3">
            <Link href="/dashboard" className="secondary-action action-button-sm">
              Back to dashboard
            </Link>
          </div>
          <h1 className="section-title text-3xl font-semibold tracking-tight sm:text-4xl">
            Payments
          </h1>
          <p className="section-copy mt-2 max-w-3xl text-base">
            Record contract-wise payments with due date, paid amount, pending amount, and collection status.
          </p>
        </div>
        <div className="data-pill border border-emerald-200 bg-emerald-50 text-emerald-800">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Connected to /api/payments
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <form onSubmit={handleSubmit} className="surface-card space-y-5 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId == null ? "Create payment" : "Edit payment"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Choose a tenancy contract first, then store paid and pending amounts against that contract.
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

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Tenancy contract</label>
            <select
              value={form.tenancyContractId}
              onChange={(e) => handleChange("tenancyContractId", e.target.value)}
              disabled={contractsLoading}
              className="field-control"
            >
              <option value="">Select a contract</option>
              {availableContracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  Contract #{contract.id} - {contract.tenantName} - {contract.propertyName} / {contract.roomName} / Bed #{contract.bedUnitId}
                </option>
              ))}
            </select>
          </div>

          {selectedContract && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Selected contract
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{selectedContract.tenantName}</p>
                  <p className="text-sm text-slate-600">
                    {selectedContract.propertyName} / {selectedContract.roomName} / Bed #{selectedContract.bedUnitId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Rent {selectedContract.rentAmount.toFixed(2)}</p>
                  <p className="text-sm text-slate-600">
                    {selectedContract.startDate} to {selectedContract.endDate} · {selectedContract.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Amount paid</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amountPaid}
                onChange={(e) => handleChange("amountPaid", e.target.value)}
                placeholder="500.00"
                className="field-control"
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
                className="field-control"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Amount pending</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amountPending}
                onChange={(e) => handleChange("amountPending", e.target.value)}
                placeholder="1000.00"
                className="field-control"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value as PaymentStatus)}
                className="field-control"
              >
                <option value="PENDING">PENDING</option>
                <option value="HALF_PAID">HALF_PAID</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Due date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="field-control"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || contractsLoading}
            className="primary-action action-button w-full disabled:cursor-not-allowed disabled:opacity-70"
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
                  Search by payment ID, contract, tenant, room, bed, status, or agent.
                </p>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payments"
                className="field-control sm:max-w-xs"
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
                        <h3 className="text-lg font-semibold text-slate-900">Payment #{payment.id}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Contract #{payment.tenancyContractId ?? "-"} · {payment.tenantName ?? "No tenant"} · {payment.paymentDate}
                        </p>
                      </div>
                      <span className={`data-pill border ${paymentStatusClass(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Linked contract
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {payment.propertyName ?? "Unlinked"} / {payment.roomName ?? "Unlinked"} / Bed #{payment.bedUnitId ?? "-"}
                        </p>
                        <p className="text-sm text-slate-600">Contract status: {payment.contractStatus ?? "Unknown"}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Amount tracking
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          Paid {payment.amountPaid.toFixed(2)} · Pending {payment.amountPending.toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-600">Due on {payment.dueDate}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {payment.tenancyContractId != null && (
                        <span className="data-pill border border-violet-200 bg-violet-50 text-violet-800">
                          Contract ID {payment.tenancyContractId}
                        </span>
                      )}
                      {payment.bedUnitId != null && (
                        <span className="data-pill border border-emerald-200 bg-emerald-50 text-emerald-800">
                          Bed ID {payment.bedUnitId}
                        </span>
                      )}
                      <span className="data-pill border border-slate-200 bg-white text-slate-700">
                        Recorded by {payment.createdByUsername}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(payment.id);
                          setForm({
                            tenancyContractId:
                              payment.tenancyContractId == null ? "" : String(payment.tenancyContractId),
                            paymentDate: payment.paymentDate,
                            dueDate: payment.dueDate,
                            amountPaid: String(payment.amountPaid),
                            amountPending: String(payment.amountPending),
                            status: payment.status,
                          });
                        }}
                        className="secondary-action action-button-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(payment)}
                        className="danger-action action-button-sm"
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
