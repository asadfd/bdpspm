"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  createProperty,
  deleteProperty,
  listProperties,
  updateProperty,
  type PropertyDto,
} from "@/lib/api";

function PropertiesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get("edit");
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadProperties() {
    try {
      setLoading(true);
      setError(null);
      setProperties(await listProperties());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProperties();
  }, []);

  useEffect(() => {
    if (!editIdParam) {
      setEditingId(null);
      setFormName("");
      return;
    }

    const editId = Number(editIdParam);
    if (!Number.isFinite(editId) || editId <= 0) {
      setError("Invalid property selected for editing.");
      return;
    }

    const match = properties.find((property) => property.id === editId);
    if (match) {
      setEditingId(match.id);
      setFormName(match.name);
      setError(null);
    }
  }, [editIdParam, properties]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = formName.trim();
    if (!name) {
      setError("Property name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (editingId == null) {
        await createProperty({ name });
      } else {
        await updateProperty(editingId, { name });
      }
      setFormName("");
      setEditingId(null);
      router.replace("/properties");
      await loadProperties();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save property.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete property "${name}"? This will also remove its rooms and beds.`)) {
      return;
    }

    try {
      setError(null);
      await deleteProperty(id);
      if (editingId === id) {
        setEditingId(null);
        setFormName("");
        router.replace("/properties");
      }
      await loadProperties();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete property.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex flex-wrap gap-3">
          <Link href="/dashboard" className="secondary-action action-button-sm">
            Back to dashboard
          </Link>
        </div>
        <h1 className="section-title text-3xl font-semibold tracking-tight sm:text-4xl">
          Properties
        </h1>
        <p className="section-copy mt-2 max-w-2xl text-base">
          Create or update properties here. Use the dashboard as the single monitoring overview for the portal.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form onSubmit={handleSubmit} className="surface-card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId == null ? "Create property" : "Edit property"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Use a clear property name so rooms and beds are easy to trace later.
              </p>
            </div>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormName("");
                  router.replace("/properties");
                }}
                className="secondary-action action-button-sm"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-800">Property name</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Central Residency"
              className="field-control"
            />
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
              className="primary-action action-button flex-1 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : editingId == null ? "Create property" : "Update property"}
            </button>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  const current = properties.find((property) => property.id === editingId);
                  if (current) {
                    void handleDelete(current.id, current.name);
                  }
                }}
                className="danger-action action-button"
              >
                Delete property
              </button>
            )}
          </div>
        </form>

        <div className="surface-card rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-slate-900">Property overview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This page stays focused on the property form while the dashboard remains the single place for monitoring the portal.
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>
              {loading
                ? "Loading latest property totals..."
                : `${properties.length} property records are currently active in the portal.`}
            </p>
            <p>
              Use the dashboard for overview counts, then come back here whenever you need to create or update a property.
            </p>
          </div>
          <Link href="/dashboard" className="primary-action action-button mt-6">
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense>
      <PropertiesPageContent />
    </Suspense>
  );
}
