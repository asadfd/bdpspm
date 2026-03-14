"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchCurrentUser,
  logoutUser,
  primeCsrfToken,
  setAgentUsername,
  type CurrentUser,
} from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => {
        setUser(u);
        setAgentUsername(u.username);
        void primeCsrfToken();
      })
      .catch(() => {
        // Session expired or user not provisioned — send back to login
        router.replace("/");
      });
  }, [router]);

  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/properties", label: "Properties" },
    { href: "/rooms", label: "Rooms" },
    { href: "/beds", label: "Beds" },
    { href: "/contracts", label: "Contracts" },
    { href: "/payments", label: "Payments" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8e1f8] bg-white/88 px-4 py-4 shadow-[0_10px_30px_rgba(126,96,189,0.08)] backdrop-blur sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#7c6cf6] to-[#a78bfa] shadow-lg shadow-[#cfc5ff]" />
          <div>
            <p className="text-sm font-semibold tracking-wide uppercase text-[#6f59d9]">
              BDSPM
            </p>
            <p className="text-xs text-slate-500">Beds, inventory &amp; payments</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          {user ? (
            <>
              <span className="hidden sm:inline">Signed in as</span>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 font-mono text-slate-800">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="secondary-action action-button-sm"
              >
                Sign out
              </button>
            </>
          ) : (
            <span className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-72 flex-col gap-5 border-r border-slate-200 bg-white/85 px-4 py-6 shadow-sm backdrop-blur md:flex">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Navigation
            </p>
            <ul className="space-y-2 text-sm">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium ${
                        active
                          ? "bg-[#f0ebff] text-[#6f59d9] ring-1 ring-[#d8d0ff]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          active ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="surface-card rounded-3xl p-4">
            <p className="text-sm font-semibold text-slate-900">Workspace</p>
            <p className="mt-1 text-sm text-slate-600">
              Use `Dashboard` for monitoring and the management screens for create, edit, and delete actions.
            </p>
          </div>

          <div className="mt-auto space-y-3">
            {user && (
              <div className="surface-card rounded-2xl px-4 py-3 text-sm">
                <p className="text-slate-500">Signed in as</p>
                <p className="truncate font-mono text-slate-900">{user.username}</p>
                <p className="truncate text-slate-600">{user.email}</p>
              </div>
            )}
            <div className="space-y-1 text-sm text-slate-500">
              <p className="font-semibold">Environment</p>
              <p>Backend: http://localhost:8080</p>
              <p>Auth: Google OAuth2</p>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <section className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          {children}
        </section>
      </div>
    </div>
  );
}
