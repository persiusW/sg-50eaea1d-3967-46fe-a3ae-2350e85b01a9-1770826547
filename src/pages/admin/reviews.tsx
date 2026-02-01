import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { AdminNav } from "@/components/AdminNav";

interface ReviewRow {
  id: string;
  business_id: string;
  business_name: string;
  reviewer_phone: string;
  reviewer_name: string | null;
  rating: number;
  body: string;
  created_at: string;
  status?: string | null;
}

const truncate = (text: string, max: number): string => {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
};

const REVIEW_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "No status" },
  { value: "UNDER_REVIEW", label: "UNDER_REVIEW" },
  { value: "VERIFIED", label: "VERIFIED" },
  { value: "SPAM", label: "SPAM" },
];

const PAGE_SIZE = 25;

const AdminReviewsPage: NextPage = () => {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authService.getCurrentSession();
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      setCheckingAuth(false);
    };
    void checkAuth();
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return;

    const fetchReviews = async () => {
      setLoading(true);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id,business_id,reviewer_phone,reviewer_name,rating,body,status,created_at,businesses(name)"
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!error && data) {
        const mapped: ReviewRow[] = (data as any[]).map((row) => ({
          id: row.id as string,
          business_id: row.business_id as string,
          business_name:
            (row.businesses && (row.businesses as any).name) || "Unknown",
          reviewer_phone: row.reviewer_phone as string,
          reviewer_name: (row.reviewer_name as string | null) ?? null,
          rating: row.rating as number,
          body: row.body as string,
          created_at: row.created_at as string,
          status: (row.status as string | null) ?? null,
        }));
        setReviews(mapped);
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setReviews([]);
        setHasMore(false);
      }

      setLoading(false);
    };

    void fetchReviews();
  }, [checkingAuth, page]);

  const handleStatusChange = async (review: ReviewRow, value: string) => {
    const previous = review.status ?? null;
    const nextStatus = value === "" ? null : value;

    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id ? { ...r, status: nextStatus } : r
      )
    );
    setStatusErrors((prev) => {
      const copy = { ...prev };
      delete copy[review.id];
      return copy;
    });

    setSavingId(review.id);
    const { error } = await supabase
      .from("reviews")
      .update({ status: nextStatus })
      .eq("id", review.id);

    if (error) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, status: previous } : r
        )
      );
      setStatusErrors((prev) => ({
        ...prev,
        [review.id]: "Could not update status. Try again.",
      }));
    }

    setSavingId(null);
  };

  const refreshPage = async (pageToLoad: number) => {
    const from = (pageToLoad - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id,business_id,reviewer_phone,reviewer_name,rating,body,status,created_at,businesses(name)"
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error && data) {
      const mapped: ReviewRow[] = (data as any[]).map((row) => ({
        id: row.id as string,
        business_id: row.business_id as string,
        business_name:
          (row.businesses && (row.businesses as any).name) || "Unknown",
        reviewer_phone: row.reviewer_phone as string,
        reviewer_name: (row.reviewer_name as string | null) ?? null,
        rating: row.rating as number,
        body: row.body as string,
        created_at: row.created_at as string,
        status: (row.status as string | null) ?? null,
      }));
      setReviews(mapped);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setReviews([]);
      setHasMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this review? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) {
      await refreshPage(page);
    }
    setDeletingId(null);
  };

  const handleFilterByBusiness = (name: string) => {
    setSearch(name);
  };

  const handleFilterByPhone = (phone: string) => {
    setSearch(phone);
  };

  const filteredReviews = reviews.filter((rev) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      rev.business_name.toLowerCase().includes(q) ||
      (rev.reviewer_name || "").toLowerCase().includes(q) ||
      rev.reviewer_phone.toLowerCase().includes(q)
    );
  });

  if (checkingAuth) {
    return (
      <>
        <SEO
          title="Admin reviews – Transparent Turtle"
          description="Moderate reviews in the Transparent Turtle admin dashboard."
        />
        <main className="min-h-screen bg-background text-foreground">
          <div className="container flex min-h-screen items-center justify-center">
            <p className="text-sm text-muted-foreground">Checking access…</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Admin reviews – Transparent Turtle"
        description="Moderate reviews in the Transparent Turtle admin dashboard."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <AdminNav />
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Reviews (admin)
              </h1>
              <p className="text-sm text-muted-foreground">
                View and delete public reviews. Deletions are permanent.
              </p>
            </div>
          </header>

          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">All reviews</p>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by business, reviewer name, or phone…"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  />
                </div>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="self-start text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
                {loading && (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Business</th>
                    <th className="py-2 px-3">Reviewer phone</th>
                    <th className="py-2 px-3">Reviewer name</th>
                    <th className="py-2 px-3">Rating</th>
                    <th className="py-2 px-3">Review</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Created at</th>
                    <th className="py-2 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-4 text-center text-xs text-muted-foreground"
                      >
                        {search.trim()
                          ? "No reviews match this search."
                          : "No reviews yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((rev) => (
                      <tr
                        key={rev.id}
                        className="border-b border-border/60 align-top"
                      >
                        <td className="py-2 pr-3 font-medium">
                          <button
                            type="button"
                            onClick={() =>
                              handleFilterByBusiness(rev.business_name)
                            }
                            className="text-left text-primary hover:underline"
                          >
                            {rev.business_name}
                          </button>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              handleFilterByPhone(rev.reviewer_phone)
                            }
                            className="text-primary hover:underline"
                          >
                            {rev.reviewer_phone}
                          </button>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {rev.reviewer_name && rev.reviewer_name.trim()
                            ? rev.reviewer_name
                            : "—"}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {rev.rating}/5
                        </td>
                        <td className="py-2 px-3">
                          <span className="block max-w-xs text-xs text-muted-foreground">
                            {truncate(rev.body, 120)}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap align-middle">
                          <select
                            className="mt-0.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60"
                            value={rev.status ?? ""}
                            onChange={(e) =>
                              handleStatusChange(rev, e.target.value)
                            }
                            disabled={savingId === rev.id}
                          >
                            {REVIEW_STATUS_OPTIONS.map((opt) => (
                              <option
                                key={opt.value || "none"}
                                value={opt.value}
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {savingId === rev.id && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              Saving…
                            </p>
                          )}
                          {statusErrors[rev.id] && (
                            <p className="mt-0.5 text-[10px] text-destructive-foreground">
                              {statusErrors[rev.id]}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(rev.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 pl-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDelete(rev.id)}
                            className="text-xs text-destructive-foreground hover:underline disabled:opacity-50"
                            disabled={deletingId === rev.id}
                          >
                            {deletingId === rev.id ? "Deleting…" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => (prev > 1 && !loading ? prev - 1 : prev))
                }
                disabled={page === 1 || loading}
                className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
              >
                Previous
              </button>
              <p className="text-[11px] text-muted-foreground">
                Page {page}
              </p>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) =>
                    hasMore && !loading ? prev + 1 : prev
                  )
                }
                disabled={!hasMore || loading}
                className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Deleting a review cannot be undone and will immediately remove it
              from the public business page.
            </p>
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminReviewsPage;