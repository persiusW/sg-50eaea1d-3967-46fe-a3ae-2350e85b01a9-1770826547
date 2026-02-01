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
  business_name: string | null;
  reviewer_name: string | null;
  reviewer_phone: string | null;
  rating: number;
  body: string;
  status: string | null;
  created_at: string;
}

interface ReviewErrorState {
  [id: string]: string | null;
}

type ReviewStatus = "" | "UNDER_REVIEW" | "VERIFIED" | "SPAM";

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
  const [rowErrors, setRowErrors] = useState<ReviewErrorState>({});
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

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
      setSelectedIds([]);
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

  const handleStatusQuickChange = async (reviewId: string, nextStatus: string) => {
    setRowErrors((prev) => ({ ...prev, [reviewId]: null }));
    setSavingIds((prev) => [...prev, reviewId]);

    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId ? { ...review, status: nextStatus } : review
      )
    );

    const target = reviews.find((r) => r.id === reviewId);
    const previousStatus = target?.status ?? null;

    const { error } = await supabase
      .from("reviews")
      .update({ status: nextStatus })
      .eq("id", reviewId);

    if (error) {
      setRowErrors((prev) => ({
        ...prev,
        [reviewId]: "Could not update status.",
      }));
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? { ...review, status: previousStatus } : review
        )
      );
    }

    setSavingIds((prev) => prev.filter((id) => id !== reviewId));
  };

  const handleBulkUpdateReviewStatus = async (nextStatus: ReviewStatus) => {
    if (selectedIds.length === 0) return;

    setBulkError(null);
    setBulkSaving(true);

    const prevById = new Map<string, string | null>(
      reviews.map((r) => [r.id, r.status])
    );

    const nextValue = nextStatus === "" ? null : nextStatus;

    setReviews((prev) =>
      prev.map((r) =>
        selectedIds.includes(r.id) ? { ...r, status: nextValue } : r
      )
    );

    const { error } = await supabase
      .from("reviews")
      .update({ status: nextValue })
      .in("id", selectedIds);

    if (error) {
      setBulkError("Could not update selected reviews. Changes reverted.");
      setReviews((prev) =>
        prev.map((r) => ({
          ...r,
          status: prevById.get(r.id) ?? r.status,
        }))
      );
    } else {
      setSelectedIds([]);
    }

    setBulkSaving(false);
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
      (rev.business_name || "").toLowerCase().includes(q) ||
      (rev.reviewer_name || "").toLowerCase().includes(q) ||
      (rev.reviewer_phone || "").toLowerCase().includes(q)
    );
  });

  const allVisibleIds = filteredReviews.map((r) => r.id);
  const allSelectedOnPage =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.includes(id));
  const someSelectedOnPage =
    allVisibleIds.some((id) => selectedIds.includes(id)) &&
    !allSelectedOnPage;

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

          <section className="space-y-4">
            <header className="flex items-center justify-between gap-3">
              <h1 className="text-xl font-semibold tracking-tight">Reviews</h1>
            </header>

            <p className="text-sm text-muted-foreground">
              Moderate public reviews. You can update status or delete any review.
            </p>

            {selectedIds.length > 0 && (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    Selected: {selectedIds.length}
                  </span>
                  {bulkError && (
                    <span className="text-destructive">{bulkError}</span>
                  )}
                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() =>
                      void handleBulkUpdateReviewStatus("UNDER_REVIEW")
                    }
                    className="rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 disabled:opacity-60 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    Set UNDER_REVIEW
                  </button>
                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() =>
                      void handleBulkUpdateReviewStatus("VERIFIED")
                    }
                    className="rounded-full border border-emerald-500 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800 disabled:opacity-60 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100"
                  >
                    Set VERIFIED
                  </button>
                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() => void handleBulkUpdateReviewStatus("SPAM")}
                    className="rounded-full border border-red-400 bg-red-50 px-2 py-0.5 text-[10px] text-red-700 disabled:opacity-60 dark:border-red-500 dark:bg-red-950/40 dark:text-red-200"
                  >
                    Set SPAM
                  </button>
                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() => setSelectedIds([])}
                    className="ml-auto rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            )}

            {/* Desktop/table view */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">
                      <input
                        type="checkbox"
                        className="h-3 w-3 accent-emerald-600"
                        checked={allSelectedOnPage}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = someSelectedOnPage;
                          }
                        }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(allVisibleIds);
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-2 py-2 font-medium">Business</th>
                    <th className="px-2 py-2 font-medium">Reviewer</th>
                    <th className="px-2 py-2 font-medium">Rating</th>
                    <th className="px-2 py-2 font-medium">Review</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-2 py-4 text-center text-xs text-muted-foreground"
                      >
                        No reviews yet.
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => (
                      <tr
                        key={review.id}
                        className="border-b border-border/60 align-top text-xs last:border-b-0 hover:bg-muted/40"
                      >
                        <td className="px-2 py-2 align-top">
                          <input
                            type="checkbox"
                            className="h-3 w-3 accent-emerald-600"
                            checked={selectedIds.includes(review.id)}
                            onChange={(e) => {
                              setSelectedIds((prev) =>
                                e.target.checked
                                  ? [...prev, review.id]
                                  : prev.filter((id) => id !== review.id)
                              );
                            }}
                          />
                        </td>
                        <td className="px-2 py-2 text-[11px]">
                          {review.business_name || "—"}
                        </td>
                        <td className="px-2 py-2 text-[11px] text-muted-foreground">
                          <div>{review.reviewer_phone || "—"}</div>
                          <div className="text-[10px]">
                            {review.reviewer_name || "Anonymous"}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-[11px]">
                          {review.rating}
                        </td>
                        <td className="px-2 py-2 text-[11px] text-muted-foreground">
                          {review.body}
                        </td>
                        <td className="px-2 py-2 text-[11px]">
                          <select
                            className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                            value={review.status || ""}
                            onChange={(e) =>
                              handleStatusChange(review, e.target.value)
                            }
                          >
                            {REVIEW_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {statusErrors[review.id] && (
                            <p className="mt-1 text-[10px] text-destructive">
                              {statusErrors[review.id]}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2 text-[11px]">
                          <div className="flex flex-wrap items-center gap-1">
                            {review.status !== "UNDER_REVIEW" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleStatusQuickChange(
                                    review.id,
                                    "UNDER_REVIEW"
                                  )
                                }
                                disabled={savingIds.includes(review.id)}
                                className="rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 disabled:opacity-60 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200"
                              >
                                Under review
                              </button>
                            )}
                            {review.status !== "VERIFIED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleStatusQuickChange(
                                    review.id,
                                    "VERIFIED"
                                  )
                                }
                                disabled={savingIds.includes(review.id)}
                                className="rounded-full border border-emerald-500 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800 disabled:opacity-60 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100"
                              >
                                Verified
                              </button>
                            )}
                            {review.status !== "SCAM_SPAM" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleStatusQuickChange(
                                    review.id,
                                    "SCAM_SPAM"
                                  )
                                }
                                disabled={savingIds.includes(review.id)}
                                className="rounded-full border border-red-400 bg-red-50 px-2 py-0.5 text-[10px] text-red-700 disabled:opacity-60 dark:border-red-500 dark:bg-red-950/40 dark:text-red-200"
                              >
                                Scam / spam
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(review.id)}
                              className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/15"
                            >
                              Delete
                            </button>
                          </div>
                          {rowErrors[review.id] && (
                            <p className="mt-1 text-[10px] text-destructive-foreground">
                              {rowErrors[review.id]}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile/card view */}
            <div className="space-y-3 sm:hidden">
              {reviews.length === 0 ? (
                <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                  No reviews yet.
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-md border border-border bg-background p-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {review.business_name || "—"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-medium">Reviewer:</span>{" "}
                          {review.reviewer_phone || "—"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-medium">Name:</span>{" "}
                          {review.reviewer_name || "Anonymous"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-medium">Rating:</span>{" "}
                          {review.rating}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-medium">Review:</span>{" "}
                          {review.body}
                        </div>
                      </div>
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          className="h-3 w-3 accent-emerald-600"
                          checked={selectedIds.includes(review.id)}
                          onChange={(e) => {
                            setSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, review.id]
                                : prev.filter((id) => id !== review.id)
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <select
                        className="w-1/2 rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                        value={review.status || ""}
                        onChange={(e) =>
                          handleStatusChange(review, e.target.value)
                        }
                      >
                        {REVIEW_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/15"
                      >
                        Delete
                      </button>
                    </div>
                    {statusErrors[review.id] && (
                      <p className="mt-1 text-[10px] text-destructive">
                        {statusErrors[review.id]}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminReviewsPage;