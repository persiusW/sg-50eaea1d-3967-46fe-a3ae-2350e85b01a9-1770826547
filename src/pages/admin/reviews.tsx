import React, { useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { AdminNav } from "@/components/AdminNav";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AdminAuthSkeleton,
  AdminTableSkeleton,
  AdminReviewCardSkeleton,
} from "@/components/admin/AdminSkeletons";

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
  const { toast } = useToast();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(false);

  // delete confirm dialog state
  const [deleteIdToConfirm, setDeleteIdToConfirm] = useState<string | null>(null);
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
        reviewer_phone: (row.reviewer_phone as string | null) ?? null,
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

  useEffect(() => {
    if (checkingAuth) return;

    const fetchReviews = async () => {
      setLoading(true);

      await refreshPage(page);

      setLoading(false);
      setSelectedIds([]);
    };

    void fetchReviews();
  }, [checkingAuth, page]);

  const handleStatusChange = async (review: ReviewRow, value: string) => {
    const previous = review.status ?? null;
    const nextStatus = value === "" ? null : value;

    // optimistic UI
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, status: nextStatus } : r))
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
        prev.map((r) => (r.id === review.id ? { ...r, status: previous } : r))
      );
      setStatusErrors((prev) => ({
        ...prev,
        [review.id]: "Could not update status. Try again.",
      }));
      toast({
        title: "Status update failed",
        description: "Could not update the review status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Review updated",
        description: "Status saved successfully.",
      });
    }

    setSavingId(null);
  };

  const handleStatusQuickChange = async (reviewId: string, nextStatus: string) => {
    setRowErrors((prev) => ({ ...prev, [reviewId]: null }));
    setSavingIds((prev) => [...prev, reviewId]);

    // optimistic UI
    const target = reviews.find((r) => r.id === reviewId);
    const previousStatus = target?.status ?? null;

    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId ? { ...review, status: nextStatus } : review
      )
    );

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
      toast({
        title: "Status update failed",
        description: "Could not update the review status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Review updated",
        description: "Status saved successfully.",
      });
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

    // optimistic UI
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
      const message = "Could not update selected reviews. Changes reverted.";
      setBulkError(message);
      setReviews((prev) =>
        prev.map((r) => ({
          ...r,
          status: prevById.get(r.id) ?? r.status,
        }))
      );
      toast({
        title: "Bulk update failed",
        description: message,
        variant: "destructive",
      });
    } else {
      const count = selectedIds.length;
      setSelectedIds([]);
      toast({
        title: "Reviews updated",
        description: `Updated ${count} review${count === 1 ? "" : "s"}.`,
      });
    }

    setBulkSaving(false);
  };

  // open confirm dialog (do not delete here)
  const handleDelete = (id: string) => {
    setDeleteIdToConfirm(id);
  };

  // delete after confirm
  const confirmDelete = async () => {
    const id = deleteIdToConfirm;
    if (!id) return;

    setDeletingId(id);

    const { error } = await supabase.from("reviews").delete().eq("id", id);

    // close dialog promptly
    setDeletingId(null);
    setDeleteIdToConfirm(null);

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete review.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Review deleted",
      description: "The review was removed successfully.",
    });

    await refreshPage(page);
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (rev.business_name || "").toLowerCase().includes(q) ||
        (rev.reviewer_name || "").toLowerCase().includes(q) ||
        (rev.reviewer_phone || "").toLowerCase().includes(q)
      );
    });
  }, [reviews, search]);

  const allVisibleIds = filteredReviews.map((r) => r.id);
  const allSelectedOnPage =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));
  const someSelectedOnPage =
    allVisibleIds.some((id) => selectedIds.includes(id)) && !allSelectedOnPage;

  if (checkingAuth) {
    return (
      <>
        <SEO
          title="Admin reviews – Transparent Turtle"
          description="Moderate reviews in the Transparent Turtle admin dashboard."
        />
        <AdminAuthSkeleton />
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
              <h1 className="text-xl font-semibold tracking-tight">Reviews (admin)</h1>
              <p className="text-sm text-muted-foreground">
                View and delete public reviews. Deletions are permanent.
              </p>
            </div>
          </header>

          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Moderate public reviews. You can update status or delete any review.
            </p>

            {selectedIds.length > 0 && (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Selected: {selectedIds.length}</span>
                  {bulkError && <span className="text-destructive">{bulkError}</span>}

                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() => void handleBulkUpdateReviewStatus("UNDER_REVIEW")}
                    className="rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 disabled:opacity-60 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    Set UNDER_REVIEW
                  </button>

                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() => void handleBulkUpdateReviewStatus("VERIFIED")}
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
                          if (input) input.indeterminate = someSelectedOnPage;
                        }}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(allVisibleIds);
                          else setSelectedIds([]);
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
                  {loading && reviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <AdminTableSkeleton rows={8} cols={7} />
                      </td>
                    </tr>
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-2 py-4 text-center text-xs text-muted-foreground">
                        No reviews yet.
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
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

                        <td className="px-2 py-2 text-[11px]">{review.rating}</td>

                        <td className="px-2 py-2 text-[11px] text-muted-foreground">
                          {truncate(review.body, 220)}
                        </td>

                        <td className="px-2 py-2 text-[11px]">
                          <select
                            className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                            value={review.status || ""}
                            onChange={(e) => handleStatusChange(review, e.target.value)}
                            disabled={savingId === review.id}
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
                                  void handleStatusQuickChange(review.id, "UNDER_REVIEW")
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
                                  void handleStatusQuickChange(review.id, "VERIFIED")
                                }
                                disabled={savingIds.includes(review.id)}
                                className="rounded-full border border-emerald-500 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800 disabled:opacity-60 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100"
                              >
                                Verified
                              </button>
                            )}

                            {review.status !== "SPAM" && (
                              <button
                                type="button"
                                onClick={() => void handleStatusQuickChange(review.id, "SPAM")}
                                disabled={savingIds.includes(review.id)}
                                className="rounded-full border border-red-400 bg-red-50 px-2 py-0.5 text-[10px] text-red-700 disabled:opacity-60 dark:border-red-500 dark:bg-red-950/40 dark:text-red-200"
                              >
                                Spam
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(review.id)}
                              className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/15"
                              disabled={Boolean(deletingId) || deleteIdToConfirm === review.id}
                            >
                              {deletingId === review.id ? "Deleting…" : "Delete"}
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
              {loading && reviews.length === 0 ? (
                <>
                  <AdminReviewCardSkeleton />
                  <AdminReviewCardSkeleton />
                  <AdminReviewCardSkeleton />
                </>
              ) : filteredReviews.length === 0 ? (
                <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                  No reviews yet.
                </div>
              ) : (
                filteredReviews.map((review) => (
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
                          <span className="font-medium">Rating:</span> {review.rating}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-medium">Review:</span>{" "}
                          {truncate(review.body, 240)}
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
                        onChange={(e) => handleStatusChange(review, e.target.value)}
                        disabled={savingId === review.id}
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
                        disabled={Boolean(deletingId) || deleteIdToConfirm === review.id}
                      >
                        {deletingId === review.id ? "Deleting…" : "Delete"}
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

            {/* Pagination */}
            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPage((prev) => (prev > 1 && !loading ? prev - 1 : prev))}
                disabled={page === 1 || loading}
                className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
              >
                Previous
              </button>

              <p className="text-[11px] text-muted-foreground">Page {page}</p>

              <button
                type="button"
                onClick={() => setPage((prev) => (hasMore && !loading ? prev + 1 : prev))}
                disabled={!hasMore || loading}
                className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        </div>

        <ConfirmDialog
          isOpen={deleteIdToConfirm !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteIdToConfirm(null);
          }}
          title="Delete review"
          description="Delete this review? This action cannot be undone."
          confirmText={deletingId ? "Deleting..." : "Delete"}
          confirmDisabled={Boolean(deletingId)}
          onConfirm={confirmDelete}
        />
      </main>
    </>
  );
};

export default AdminReviewsPage;