"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginCard() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const usernameFromQuery = searchParams.get("username") ?? "";
  const [username, setUsername] = useState(usernameFromQuery);

  useEffect(() => {
    setUsername(usernameFromQuery);
  }, [usernameFromQuery]);

  const errorMessage =
    error === "oauth_failed"
      ? "Google sign-in failed. Please try again."
      : error === "missing_agent_username"
        ? "Enter your agent username before continuing with Google."
        : error === "unknown_user"
          ? "That agent username is not active in the BDSPM user table."
          : error === "missing_google_email"
            ? "Google did not return an email address for this account."
            : error === "username_email_mismatch"
              ? "The selected Google account does not match the entered active agent username."
              : error
                ? "Authentication error. Please try again."
                : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#7c6cf6] to-[#a78bfa] shadow-lg shadow-[#d5ccff]">
            <span className="select-none text-3xl font-black tracking-tight text-white">B</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              BDSPM Agent Portal
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Sign in to continue to the dashboard and CRUD screens
            </p>
          </div>
        </div>

        <div className="surface-card rounded-[2rem] p-8">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-600">
              Enter the active agent username from the BDSPM user table, then continue with the matching Google account.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          <form
            action="http://localhost:8080/auth/login/google"
            method="GET"
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Agent username
              </label>
              <input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. agent1"
                autoComplete="username"
                suppressHydrationWarning
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <button
              type="submit"
              disabled={!username.trim()}
              className="primary-action flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-3 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="mt-5 text-center text-sm leading-relaxed text-slate-500">
            Access is allowed only when the entered active agent username matches the Google account returned by OAuth.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500">
          BDSPM - Bed, Desk and Space Property Management
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  );
}
