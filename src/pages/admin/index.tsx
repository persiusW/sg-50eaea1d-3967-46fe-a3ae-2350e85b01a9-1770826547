import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { AdminNav } from "@/components/AdminNav";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

interface CategoryStat {
  category: string | null;
  count: number;
}

interface ReviewerStat {
  reviewer_phone: string;
  reviewer_name: string | null;
  count: number;
}

interface RecentReview {
  id: string;
  created_at: string;
  rating: number;
  body: string;
  reviewer_phone: string | null;
  reviewer_name: string | null;
  businesses: { name: string | null } | null;
}

interface RecentBusiness {
  id: string;
  name: string;
  phone: string;
  category: string | null;
  status: string | null;
  created_at: string;
}

const AdminDashboardPage: NextPage = () => {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [totalBusinesses, setTotalBusinesses] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number | null>(null);
  const [totalFlagged, setTotalFlagged] = useState<number | null>(null);
  const [underReviewBusinesses, setUnderReviewBusinesses] = useState<number | null>(null);
  const [underReviewReviews, setUnderReviewReviews] = useState<number | null>(null);
  const [confirmedScamBusinesses, setConfirmedScamBusinesses] = useState<number | null>(null);
  const [confirmedScamNumbers, setConfirmedScamNumbers] = useState<number | null>(null);

  const [categoryStats, setCategoryStats] = useState<CategoryStat[] | null>(null);
  const [reviewerStats, setReviewerStats] = useState<ReviewerStat[] | null>(null);

  const [recentReviews, setRecentReviews] = useState<RecentReview[] | null>(null);
  const [recentBusinesses, setRecentBusinesses] = useState<RecentBusiness[] | null>(null);

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

    const fetchData = async () => {
      const totalBusinessesPromise = supabase
        .from("businesses")
        .select("id", { count: "exact", head: true });
      const totalReviewsPromise = supabase
        .from("reviews")
        .select("id", { count: "exact", head: true });
      const totalFlaggedPromise = supabase
        .from("flagged_numbers")
        .select("id", { count: "exact", head: true });
      const underReviewBusinessesPromise = supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("status", "UNDER_REVIEW");
      const underReviewReviewsPromise = supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", "UNDER_REVIEW");
      const confirmedScamBusinessesPromise = supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("status", "SCAM");
      const confirmedScamNumbersPromise = supabase
        .from("flagged_numbers")
        .select("id", { count: "exact", head: true })
        .eq("status", "VERIFIED");

      const categoryStatsPromise = supabase
        .from("businesses")
        .select("category")
        .not("category", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      const reviewerStatsPromise = supabase
        .from("reviews")
        .select("reviewer_phone, reviewer_name")
        .order("created_at", { ascending: false })
        .limit(200);

      const recentReviewsPromise = supabase
        .from("reviews")
        .select(
          "id, created_at, rating, body, reviewer_phone, reviewer_name, businesses(name)"
        )
        .order("created_at", { ascending: false })
        .limit(10);

      const recentBusinessesPromise = supabase
        .from("businesses")
        .select("id, name, phone, category, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      const [
        totalBusinessesRes,
        totalReviewsRes,
        totalFlaggedRes,
        underReviewBusinessesRes,
        underReviewReviewsRes,
        confirmedScamBusinessesRes,
        confirmedScamNumbersRes,
        categoryStatsRes,
        reviewerStatsRes,
        recentReviewsRes,
        recentBusinessesRes,
      ] = await Promise.all([
        totalBusinessesPromise,
        totalReviewsPromise,
        totalFlaggedPromise,
        underReviewBusinessesPromise,
        underReviewReviewsPromise,
        confirmedScamBusinessesPromise,
        confirmedScamNumbersPromise,
        categoryStatsPromise,
        reviewerStatsPromise,
        recentReviewsPromise,
        recentBusinessesPromise,
      ]);

      setTotalBusinesses(totalBusinessesRes.error ? null : totalBusinessesRes.count ?? null);
      setTotalReviews(totalReviewsRes.error ? null : totalReviewsRes.count ?? null);
      setTotalFlagged(totalFlaggedRes.error ? null : totalFlaggedRes.count ?? null);
      setUnderReviewBusinesses(
        underReviewBusinessesRes.error ? null : underReviewBusinessesRes.count ?? null
      );
      setUnderReviewReviews(
        underReviewReviewsRes.error ? null : underReviewReviewsRes.count ?? null
      );
      setConfirmedScamBusinesses(
        confirmedScamBusinessesRes.error ? null : confirmedScamBusinessesRes.count ?? null
      );
      setConfirmedScamNumbers(
        confirmedScamNumbersRes.error ? null : confirmedScamNumbersRes.count ?? null
      );

      setCategoryStats(
        categoryStatsRes.error || !categoryStatsRes.data
          ? null
          : (() => {
              const counts = new Map<string | null, number>();
              (categoryStatsRes.data as any[]).forEach((row) => {
                const key = (row.category as string | null) ?? null;
                counts.set(key, (counts.get(key) ?? 0) + 1);
              });
              const entries: CategoryStat[] = Array.from(counts.entries()).map(
                ([category, count]) => ({ category, count })
              );
              entries.sort((a, b) => b.count - a.count);
              return entries.slice(0, 10);
            })()
      );

      setReviewerStats(
        reviewerStatsRes.error || !reviewerStatsRes.data
          ? null
          : (() => {
              const counts = new Map<
                string,
                { reviewer_phone: string; reviewer_name: string | null; count: number }
              >();
              (reviewerStatsRes.data as any[]).forEach((row) => {
                const phone = (row.reviewer_phone as string) || "";
                const name = (row.reviewer_name as string | null) ?? null;
                if (!phone) return;
                const existing = counts.get(phone);
                if (existing) {
                  existing.count += 1;
                } else {
                  counts.set(phone, { reviewer_phone: phone, reviewer_name: name, count: 1 });
                }
              });
              const values = Array.from(counts.values());
              values.sort((a, b) => b.count - a.count);
              return values.slice(0, 10);
            })()
      );

      setRecentReviews(
        recentReviewsRes.error || !recentReviewsRes.data
          ? null
          : (recentReviewsRes.data as any[]).map((rev) => ({
              id: rev.id as string,
              created_at: rev.created_at as string,
              rating: rev.rating as number,
              body: rev.body as string,
              reviewer_phone: (rev.reviewer_phone as string | null) ?? null,
              reviewer_name: (rev.reviewer_name as string | null) ?? null,
              businesses: (rev.businesses as { name: string | null } | null) ?? null,
            }))
      );

      setRecentBusinesses(
        recentBusinessesRes.error || !recentBusinessesRes.data
          ? null
          : (recentBusinessesRes.data as any[]).map((biz) => ({
              id: biz.id as string,
              name: biz.name as string,
              phone: biz.phone as string,
              category: (biz.category as string | null) ?? null,
              status: (biz.status as string | null) ?? null,
              created_at: biz.created_at as string,
            }))
      );
    };

    void fetchData();
  }, [checkingAuth]);

  if (checkingAuth) {
    return (
      <>
        <SEO
          title="Admin dashboard – Transparent Turtle"
          description="Overview of activity in the Transparent Turtle admin dashboard."
        />
        <main className="min-h-screen bg-background text-foreground">
          <div className="container flex min-h-screen items-center justify-center">
            <p className="text-sm text-muted-foreground">Checking access…</p>
          </div>
        </main>
      </>
    );
  }

  const renderBarList = (items: { label: string; value: number; hint?: string }[]) => {
    if (!items.length) {
      return <p className="text-xs text-muted-foreground">No data.</p>;
    }

    const max = Math.max(...items.map((i) => i.value || 0)) || 1;

    return (
      <ul className="space-y-2">
        {items.map((item) => {
          const width = `${(item.value / max) * 100}%`;
          return (
            <li key={item.label} className="flex items-center gap-3 text-xs sm:text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{item.label}</div>
                {item.hint && (
                  <div className="truncate text-[11px] text-muted-foreground">
                    {item.hint}
                  </div>
                )}
              </div>
              <div className="flex w-32 items-center gap-2">
                <div className="relative h-2 flex-1 rounded-full bg-muted/60">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{item.value}</span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <SEO
        title="Admin dashboard – Transparent Turtle"
        description="Overview of activity in the Transparent Turtle admin dashboard."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <AdminNav />

          <header className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Dashboard build v1</p>
            <p className="text-sm text-muted-foreground">
              High-level overview of businesses, reviews, and flagged numbers.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total businesses
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {totalBusinesses ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total reviews
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {totalReviews ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Flagged numbers
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {totalFlagged ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Businesses under review
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {underReviewBusinesses ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Reviews under review
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {underReviewReviews ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Confirmed scams
              </p>
              <p className="mt-1 text-sm">
                <span className="font-semibold">
                  Businesses: {confirmedScamBusinesses ?? "—"}
                </span>
                <span className="ml-2 text-muted-foreground">
                  • Numbers (Confirmed Scam): {confirmedScamNumbers ?? "—"}
                </span>
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Top business categories</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Categories with the most businesses (top 10).
              </p>
              <div className="mt-3">
                {categoryStats
                  ? renderBarList(
                      categoryStats.map((row) => ({
                        label: row.category || "Uncategorized",
                        value: row.count,
                      }))
                    )
                  : (
                    <p className="text-xs text-muted-foreground">No data.</p>
                  )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Most frequent reviewers</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Reviewer phones with the most reviews (top 10).
              </p>
              <div className="mt-3">
                {reviewerStats
                  ? renderBarList(
                      reviewerStats.map((row) => ({
                        label: row.reviewer_name || "Unknown",
                        value: row.count,
                        hint: row.reviewer_phone,
                      }))
                    )
                  : (
                    <p className="text-xs text-muted-foreground">No data.</p>
                  )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Recent reviews</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Latest 10 reviews.
              </p>
              <div className="mt-3 space-y-2">
                {!recentReviews || recentReviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No recent reviews.</p>
                ) : (
                  recentReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-md border border-border/60 bg-background p-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-medium">
                          {(rev.businesses && rev.businesses.name) || "Unknown"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          ⭐ {rev.rating}
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {rev.body}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {rev.reviewer_phone || "—"} ·{" "}
                        {new Date(rev.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Recent businesses</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Latest 10 businesses.
              </p>
              <div className="mt-3 space-y-2">
                {!recentBusinesses || recentBusinesses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No recent businesses.</p>
                ) : (
                  recentBusinesses.map((biz) => (
                    <div
                      key={biz.id}
                      className="rounded-md border border-border/60 bg-background p-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-medium">{biz.name}</div>
                        {biz.status && (
                          <span className="inline-flex max-w-full items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                            {biz.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {biz.phone} · {biz.category || "Uncategorized"}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(biz.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminDashboardPage;