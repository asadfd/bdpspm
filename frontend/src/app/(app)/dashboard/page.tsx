"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listContracts, listPayments, type PaymentDto, type TenancyContractDto } from "@/lib/api";
import { useInventory } from "@/lib/useInventory";

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M8 7h2" />
      <path d="M8 11h2" />
      <path d="M8 15h2" />
      <path d="M12 7h2" />
      <path d="M12 11h2" />
      <path d="M12 15h2" />
      <path d="M10 21v-3a2 2 0 1 1 4 0v3" />
    </svg>
  );
}

function RoomIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 20V6a2 2 0 0 1 2-2h8a4 4 0 0 1 4 4v12" />
      <path d="M5 20h14" />
      <path d="M15 12h.01" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 19v-8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2h6a3 3 0 0 1 3 3v3" />
      <path d="M3 19v2" />
      <path d="M19 19v2" />
      <path d="M10 13V9a2 2 0 0 1 2-2h3a3 3 0 0 1 3 3v3" />
    </svg>
  );
}

export default function DashboardPage() {
  const { properties, rooms, beds, loading, error } = useInventory();
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [contracts, setContracts] = useState<TenancyContractDto[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  const bedStatus = useMemo(() => {
    return beds.reduce(
      (totals, bed) => {
        if (bed.status === "AVAILABLE") totals.available += 1;
        else if (bed.status === "OCCUPIED") totals.occupied += 1;
        else if (bed.status === "NOTICE") totals.notice += 1;
        else totals.other += 1;
        return totals;
      },
      { available: 0, occupied: 0, notice: 0, other: 0 },
    );
  }, [beds]);

  const emptyProperties = useMemo(
    () => properties.filter((property) => property.rooms.length === 0).length,
    [properties],
  );
  const roomsWithoutBeds = useMemo(
    () => rooms.filter((room) => room.bedUnits.length === 0).length,
    [rooms],
  );
  const availableProperties = useMemo(
    () => properties.filter((property) => property.rooms.length > 0).length,
    [properties],
  );
  const occupiedRate = beds.length === 0 ? 0 : Math.round((bedStatus.occupied / beds.length) * 100);
  const activeContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "ACTIVE").length,
    [contracts],
  );
  const noticeContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "NOTICE").length,
    [contracts],
  );
  const endedContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "ENDED").length,
    [contracts],
  );
  const paidPayments = useMemo(
    () => payments.filter((payment) => payment.status === "PAID").length,
    [payments],
  );
  const halfPaidPayments = useMemo(
    () => payments.filter((payment) => payment.status === "HALF_PAID").length,
    [payments],
  );
  const overduePayments = useMemo(
    () => payments.filter((payment) => payment.status === "OVERDUE").length,
    [payments],
  );
  const totalPaidAmount = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amountPaid, 0),
    [payments],
  );
  const totalPendingAmount = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amountPending, 0),
    [payments],
  );
  const latestPayments = useMemo(() => payments.slice(0, 4), [payments]);

  const managementCards = [
    {
      title: "Properties",
      href: "/properties",
      value: properties.length,
      copy: "Create and maintain property masters with cleaner forms.",
    },
    {
      title: "Rooms",
      href: "/rooms",
      value: rooms.length,
      copy: "Map rooms under the correct property and keep allocations tidy.",
    },
    {
      title: "Beds",
      href: "/beds",
      value: beds.length,
      copy: "Manage bed units and update their latest occupancy status.",
    },
    {
      title: "Contracts",
      href: "/contracts",
      value: contracts.length,
      copy: "Create active tenancy contracts, move them to notice, and end them cleanly.",
    },
    {
      title: "Payments",
      href: "/payments",
      value: null,
      copy: "Record paid and pending amounts directly against the linked contract.",
    },
  ];

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        setPaymentsLoading(true);
        const [paymentData, contractData] = await Promise.all([listPayments(), listContracts()]);
        if (active) {
          setPayments(paymentData);
          setContracts(contractData);
        }
      } finally {
        if (active) {
          setPaymentsLoading(false);
        }
      }
    }

    void loadDashboardData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title text-3xl font-semibold tracking-tight sm:text-4xl">
          Dashboard
        </h1>
        <p className="section-copy mt-2 max-w-3xl text-base">
          Live monitoring summary for properties, rooms, and beds. Use the navigation menu to open the CRUD forms for each management area.
        </p>
      </div>

      {loading && (
        <div className="surface-card rounded-3xl p-6 text-sm text-slate-600">
          Loading monitoring counts...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="surface-card rounded-3xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Properties
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-slate-900">{properties.length}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {availableProperties} active and {emptyProperties} still waiting for room mapping.
                  </p>
                </div>
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                  <BuildingIcon />
                </div>
              </div>
            </div>

            <div className="surface-card rounded-3xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Rooms
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-slate-900">{rooms.length}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {roomsWithoutBeds} rooms are still waiting for bed allocation.
                  </p>
                </div>
                <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                  <RoomIcon />
                </div>
              </div>
            </div>

            <div className="surface-card rounded-3xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Beds
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-slate-900">{beds.length}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {occupiedRate}% of bed capacity is currently occupied.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <BedIcon />
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-3xl p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Bed status monitoring
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  Current occupancy and exception snapshot
                </h2>
              </div>
              <div className="data-pill border border-slate-200 bg-white text-slate-700">
                Total beds monitored: {beds.length}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Available
                </p>
                <p className="mt-3 text-3xl font-semibold text-emerald-900">{bedStatus.available}</p>
                <p className="mt-2 text-sm text-emerald-800">
                  Ready for fresh allotment.
                </p>
              </div>

              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-rose-700">
                  Occupied
                </p>
                <p className="mt-3 text-3xl font-semibold text-rose-900">{bedStatus.occupied}</p>
                <p className="mt-2 text-sm text-rose-800">
                  Currently assigned to residents.
                </p>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">
                  Notice
                </p>
                <p className="mt-3 text-3xl font-semibold text-amber-900">{bedStatus.notice}</p>
                <p className="mt-2 text-sm text-amber-800">
                  Needs follow-up, maintenance, or planned turnover.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Other
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{bedStatus.other}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Unexpected statuses that should be reviewed.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-3xl p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Management
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  Open the main work areas from one place
                </h2>
              </div>
              <div className="data-pill border border-slate-200 bg-white text-slate-700">
                Dashboard is the single overview page
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {managementCards.map((card) => (
                <div key={card.href} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {card.title}
                  </p>
                  {card.value != null && (
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
                  )}
                  <p className={`text-sm text-slate-600 ${card.value != null ? "mt-2" : "mt-3"}`}>
                    {card.copy}
                  </p>
                  <Link href={card.href} className="primary-action action-button mt-5 w-full">
                    Open {card.title}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card rounded-3xl p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Payments
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  Payment dashboard
                </h2>
              </div>
              <Link href="/payments" className="secondary-action action-button-sm">
                Open payments
              </Link>
            </div>

            {paymentsLoading ? (
              <div className="mt-5 text-sm text-slate-600">Loading payment overview...</div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-700">
                      Active contracts
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-violet-900">{activeContracts}</p>
                    <p className="mt-2 text-sm text-violet-800">
                      {noticeContracts} in notice and {endedContracts} ended.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      Paid
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-emerald-900">{paidPayments}</p>
                    <p className="mt-2 text-sm text-emerald-800">Payments fully cleared.</p>
                  </div>
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">
                      Half paid
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-amber-900">{halfPaidPayments}</p>
                    <p className="mt-2 text-sm text-amber-800">Contracts with partial collection.</p>
                  </div>
                  <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-rose-700">
                      Overdue
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-rose-900">{overduePayments}</p>
                    <p className="mt-2 text-sm text-rose-800">Payments that need immediate follow-up.</p>
                  </div>
                  <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700">
                      Total paid
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-cyan-900">{totalPaidAmount.toFixed(2)}</p>
                    <p className="mt-2 text-sm text-cyan-800">Amount received across all contract payments.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
                      Total pending
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">
                      {totalPendingAmount.toFixed(2)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">Outstanding amount still due on contracts.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Recent payments
                  </p>
                  {latestPayments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
                      No payments logged yet.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {latestPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                Payment #{payment.id} / Contract #{payment.tenancyContractId ?? "-"}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {payment.tenantName ?? "No tenant"} · {payment.propertyName ?? "No property"} / {payment.roomName ?? "No room"} / Bed #{payment.bedUnitId ?? "-"}
                              </p>
                            </div>
                            <span
                              className={`data-pill border ${
                                payment.status === "PAID"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : payment.status === "HALF_PAID"
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : payment.status === "OVERDUE"
                                      ? "border-rose-200 bg-rose-50 text-rose-800"
                                      : "border-slate-200 bg-slate-50 text-slate-700"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                            <span>{payment.paymentDate}</span>
                            <span className="font-semibold text-slate-900">
                              Paid {payment.amountPaid.toFixed(2)} / Pending {payment.amountPending.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
