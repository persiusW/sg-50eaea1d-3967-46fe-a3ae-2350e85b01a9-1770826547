import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/PublicLayout";

type BusinessStatus =
  | "UNDER_REVIEW"
  | "MULTIPLE_REPORTS"
  | "PATTERN_MATCH_SCAM"
  | "VERIFIED"
  | "SCAM";

interface BusinessListItem {
  id: string;
  name: string;
  phone: string;
  category: string;
  status: BusinessStatus | null;
  verified: boolean;
  avg_rating: number;
  reviews_count: number;
}

const statusLabel: Record<Exclude<BusinessStatus, "VERIFIED">, string> = {
  UNDER_REVIEW: "Under Review",
  MULTIPLE_REPORTS: "Multiple Independent Reports",
  PATTERN_MATCH_SCAM: "Pattern Match: Known Scam Method",
  SCAM: "Confirmed Scam",
};

const statusBadgeClass: Record<Exclude<BusinessStatus, "VERIFIED">, string> = {
  UNDER_REVIEW:
    "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-300/70 dark:border-slate-600/70",
  MULTIPLE_REPORTS:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40",
  PATTERN_MATCH_SCAM:
    "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/40",
  SCAM:
    "bg-red-600 text-red-50 border border-red-700 dark:bg-red-900 dark:text-red-100",
};

const PAGE_SIZE = 25;

const BusinessesPage: NextPage = () => {
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchBusinesses = async (search: string, pageToLoad: number) => {
    setLoading(true);

    const from = (pageToLoad - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let baseQuery = supabase
      .from("businesses_with_ratings")
      .select(
        "id,name,phone,category,status,verified,created_at,avg_rating,reviews_count"
      )
      .order("created_at", { ascending: false });

    const trimmed = search.trim();
    if (trimmed.length > 0) {
      baseQuery = baseQuery.or(
        `name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`
      );
    }

    const { data } = await baseQuery.range(from, to);

    if (data) {
      setBusinesses(data as BusinessListItem[]);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setBusinesses([]);
      setHasMore(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    void fetchBusinesses("", 1);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextPage = 1;
    setPage(nextPage);
    await fetchBusinesses(query, nextPage);
  };

  const renderStatusCell = (biz: BusinessListItem) => {
    const status = biz.status;

    const shouldShowRating =
      status === null || status === "VERIFIED";

    if (!shouldShowRating && status) {
      if (status === "SCAM") {
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass.SCAM}`}
          >
            ⛔ {statusLabel.SCAM}
          </span>
        );
      }

      if (
        status === "UNDER_REVIEW" ||
        status === "MULTIPLE_REPORTS" ||
        status === "PATTERN_MATCH_SCAM"
      ) {
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              statusBadgeClass[status]
            }`}
          >
            {statusLabel[status]}
          </span>
        );
      }
    }

    if (biz.reviews_count > 0) {
      return (
        <span className="text-[11px] text-muted-foreground">
          ⭐ {biz.avg_rating.toFixed(1)} • {biz.reviews_count}
        </span>
      );
    }

    return (
      <span className="text-[11px] text-muted-foreground">
        No reviews yet
      </span>
    );
  };

  return (
    <>
      <SEO
        title="Search businesses – Transparent Turtle"
        description="Search for businesses by name or phone and see their status and review summary."
      />
      <PublicLayout>
        <div className="flex min-h-screen flex-col gap-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Business search
              </h1>
              <p className="text-sm text-muted-foreground">
                Look up a business by name or phone. Reviews and risk badges
                help you understand who you are dealing with.
              </p>
            </div>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Back to home
            </Link>
          </header>

          <section className="space-y-4">
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Input
                type="search"
                placeholder="Search by business name or phone number"
                className="w-full sm:max-w-md"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                {loading ? "Searching…" : "Search"}
              </button>
            </form>

            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              {loading && (
                <p className="text-muted-foreground">Loading results…</p>
              )}

              {!loading && businesses.length === 0 && (
                <p className="text-muted-foreground">
                  No businesses found yet. Try a different search or{" "}
                  <Link
                    href="/businesses/add"
                    className="underline underline-offset-4"
                  >
                    add a new business
                  </Link>
                  .
                </p>
              )}

              {!loading && businesses.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 pr-3 font-medium">Business</th>
                          <th className="py-2 px-3 font-medium">Category</th>
                          <th className="py-2 px-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {businesses.map((biz) => (
                          <tr
                            key={biz.id}
                            className="border-b border-border/60 last:border-0"
                          >
                            <td className="py-2 pr-3 align-middle">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/businesses/${biz.id}`}
                                  className="text-sm font-medium hover:underline"
                                >
                                  {biz.name}
                                </Link>
                                {biz.verified && (
                                  <Badge className="bg-emerald-600 text-emerald-50">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-0.5 text-[11px] text-muted-foreground">
                                {biz.phone}
                              </div>
                            </td>
                            <td className="py-2 px-3 align-middle">
                              {biz.category}
                            </td>
                            <td className="py-2 px-3 align-middle">
                              {renderStatusCell(biz)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={async () => {
                        const nextPage = Math.max(1, page - 1);
                        if (nextPage !== page) {
                          setPage(nextPage);
                          await fetchBusinesses(query, nextPage);
                        }
                      }}
                      disabled={page === 1}
                      className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <p className="text-[11px] text-muted-foreground">
                      Page {page}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!hasMore) return;
                        const nextPage = page + 1;
                        setPage(nextPage);
                        await fetchBusinesses(query, nextPage);
                      }}
                      disabled={!hasMore}
                      className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </PublicLayout>
    </>
  );
};

export default BusinessesPage;