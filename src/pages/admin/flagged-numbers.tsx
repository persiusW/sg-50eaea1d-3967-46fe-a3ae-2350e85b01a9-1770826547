import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/AdminNav";

type FlagStatus =
  | "UNDER_REVIEW"
  | "MULTIPLE_REPORTS"
  | "PATTERN_MATCH_SCAM"
  | "VERIFIED";

interface FlaggedNumber {
  id: string;
  phone: string;
  name_on_number: string | null;
  connected_page: string | null;
  admin_note: string | null;
  status: FlagStatus;
  verified: boolean;
}

interface FormState {
  id?: string;
  phone: string;
  name_on_number: string;
  connected_page: string;
  admin_note: string;
  status: FlagStatus;
}

const PAGE_SIZE = 25;

const STATUS_OPTIONS: FlagStatus[] = [
  "UNDER_REVIEW",
  "MULTIPLE_REPORTS",
  "PATTERN_MATCH_SCAM",
  "VERIFIED",
];

const STATUS_LABEL: Record<FlagStatus, string> = {
  UNDER_REVIEW: "Under Review",
  MULTIPLE_REPORTS: "Multiple Reports",
  PATTERN_MATCH_SCAM: "Pattern Match",
  VERIFIED: "Confirmed Scam",
};

const STATUS_CLASS: Record<FlagStatus, string> = {
  UNDER_REVIEW:
    "border-slate-400/40 bg-slate-100 text-slate-700 dark:border-slate-500/50 dark:bg-slate-900/40 dark:text-slate-100",
  MULTIPLE_REPORTS:
    "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:border-orange-400/60 dark:bg-orange-900/30 dark:text-orange-200",
  PATTERN_MATCH_SCAM:
    "border-amber-600/60 bg-amber-500/15 text-amber-800 dark:border-amber-400/70 dark:bg-amber-900/40 dark:text-amber-100",
  VERIFIED:
    "border-red-600 bg-red-600/15 text-red-800 dark:border-red-500 dark:bg-red-900/50 dark:text-red-100",
};

const STATUS_PREFIX: Partial<Record<FlagStatus, string>> = {
  MULTIPLE_REPORTS: "🚩 ",
  PATTERN_MATCH_SCAM: "❗ ",
  VERIFIED: "⛔ ",
};

export default function AdminFlaggedNumbersPage() {
  const [items, setItems] = useState<FlaggedNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    phone: "",
    name_on_number: "",
    connected_page: "",
    admin_note: "",
    status: "UNDER_REVIEW",
  });

  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);

  const load = async (pageNumber: number) => {
    setLoading(true);
    setLoadingPage(true);

    const from = (pageNumber - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("flagged_numbers")
      .select(
        "id, phone, name_on_number, connected_page, admin_note, status, verified",
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      setError(error.message);
      setItems([]);
      setIsLastPage(true);
    } else if (data) {
      setItems(
        data.map((row) => ({
          ...row,
          status: (row.status || "UNDER_REVIEW") as FlagStatus,
          verified: true,
        })),
      );
      setIsLastPage(data.length < PAGE_SIZE);
    } else {
      setItems([]);
      setIsLastPage(true);
    }

    setLoading(false);
    setLoadingPage(false);
  };

  useEffect(() => {
    load(1);
  }, []);

  const resetForm = () => {
    setForm({
      phone: "",
      name_on_number: "",
      connected_page: "",
      admin_note: "",
      status: "UNDER_REVIEW",
    });
  };

  const handleEdit = (item: FlaggedNumber) => {
    setForm({
      id: item.id,
      phone: item.phone,
      name_on_number: item.name_on_number ?? "",
      connected_page: item.connected_page ?? "",
      admin_note: item.admin_note ?? "",
      status: item.status ?? "UNDER_REVIEW",
    });
    setError(null);
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("flagged_numbers")
      .delete()
      .eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      // reload current page to keep context
      await load(page);
      if (form.id === id) {
        resetForm();
      }
    }
    setSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      phone: form.phone.trim(),
      name_on_number: form.name_on_number.trim() || null,
      connected_page: form.connected_page.trim() || null,
      admin_note: form.admin_note.trim() || null,
      status: form.status,
      verified: true,
    };

    if (!payload.phone) {
      setError("Phone number is required.");
      setSaving(false);
      return;
    }

    if (form.id) {
      const { error } = await supabase
        .from("flagged_numbers")
        .update(payload)
        .eq("id", form.id);
      if (error) {
        setError(error.message);
      } else {
        await load(page);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("flagged_numbers")
        .insert([payload]);
      if (error) {
        setError(error.message);
      } else {
        // after insert, go back to first page to ensure new is visible at top
        setPage(1);
        await load(1);
        resetForm();
      }
    }

    setSaving(false);
  };

  const handlePrevious = () => {
    if (page === 1 || loadingPage) return;
    const nextPage = page - 1;
    setPage(nextPage);
    load(nextPage);
  };

  const handleNext = () => {
    if (isLastPage || loadingPage) return;
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage);
  };

  return (
    <>
      <SEO
        title="Admin flagged numbers – Transparent Turtle"
        description="Manage flagged phone numbers in the Transparent Turtle admin dashboard."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <AdminNav />

          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Flagged numbers (admin)
              </h1>
              <p className="text-sm text-muted-foreground">
                Add, edit, or remove flagged phone numbers. All entries here are
                considered high risk.
              </p>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-lg border border-border bg-card p-4 text-sm"
            >
              <h2 className="text-sm font-semibold">
                {form.id ? "Edit flagged number" : "Add flagged number"}
              </h2>

              {error && (
                <p className="text-xs text-red-600">
                  {error}
                </p>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Phone number
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Name on number
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  value={form.name_on_number}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name_on_number: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Connected scam/page
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  value={form.connected_page}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      connected_page: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Admin note
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  rows={3}
                  value={form.admin_note}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      admin_note: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Status
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as FlagStatus,
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : form.id
                      ? "Save changes"
                      : "Add flagged number"}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <h2 className="text-sm font-semibold">Existing flagged numbers</h2>
              {loading ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Loading…
                </p>
              ) : items.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  No flagged numbers yet.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Phone</th>
                        <th className="py-2 px-3 font-medium">Name</th>
                        <th className="py-2 px-3 font-medium">Status</th>
                        <th className="py-2 px-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-2 pr-3 align-middle">
                            <div className="text-sm font-medium">
                              {item.phone}
                            </div>
                            {item.connected_page && (
                              <div className="mt-0.5 text-[11px] text-muted-foreground">
                                {item.connected_page}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 align-middle">
                            {item.name_on_number || (
                              <span className="text-[11px] text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 align-middle">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[item.status]}`}
                            >
                              {STATUS_PREFIX[item.status] ?? ""}
                              {item.status === "VERIFIED"
                                ? "Confirmed Scam"
                                : STATUS_LABEL[item.status]}
                            </span>
                          </td>
                          <td className="py-2 px-3 align-middle">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                className="text-[11px] text-emerald-700 hover:underline dark:text-emerald-300"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="text-[11px] text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={page === 1 || loadingPage}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground disabled:opacity-50"
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLastPage || loadingPage}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}