import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
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
              className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              Back to home
            </Link>
          </header>

          <section className="space-y-4">
            <header className="flex items-center justify-between gap-3">
              <h1 className="text-xl font-semibold tracking-tight">
                Search businesses
              </h1>
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
              >
                Back to home
              </Link>
            </header>

            <p className="text-sm text-muted-foreground">
              Search by business name or phone number. Results are ordered by
              relevance, then recent activity.
            </p>

            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-2 rounded-md border border-border bg-card/40 p-3 sm:flex-row sm:items-center sm:gap-3"
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

            {/* Desktop/table view */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Business</th>
                    <th className="px-2 py-2 font-medium">Phone</th>
                    <th className="px-2 py-2 font-medium">Category</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-2 py-4 text-center text-xs text-muted-foreground"
                      >
                        No businesses found. Try a different search or add a
                        new business.
                      </td>
                    </tr>
                  ) : (
                    businesses.map((business) => (
                      <tr
                        key={business.id}
                        className="border-b border-border/60 align-top text-xs last:border-b-0 hover:bg-muted/40"
                      >
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/businesses/${business.id}`}
                                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                              >
                                {business.name}
                              </Link>
                              {business.verified && (
                                <span className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 align-top text-[11px] text-muted-foreground">
                          {business.phone}
                        </td>
                        <td className="px-2 py-2 align-top text-[11px] text-muted-foreground">
                          {business.category || "—"}
                        </td>
                        <td className="px-2 py-2 align-top">
                          {business.status ? (
                            <span
                              className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                statusBadgeClass[business.status] ||
                                "border border-border bg-muted/60 text-foreground"
                              }`}
                            >
                              <span className="truncate">
                                {statusLabel[business.status as Exclude<
                                  BusinessStatus,
                                  "VERIFIED"
                                >] || business.status}
                              </span>
                            </span>
                          ) : business.reviews_count > 0 ? (
                            <span className="inline-flex items-center text-[11px] text-muted-foreground">
                              <span className="mr-1 text-xs">⭐</span>
                              {business.avg_rating.toFixed(1)} ·{" "}
                              {business.reviews_count} review
                              {business.reviews_count === 1 ? "" : "s"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              No reviews yet
                            </span>
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
              {businesses.length === 0 ? (
                <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                  No businesses found. Try a different search or add a new
                  business.
                </div>
              ) : (
                businesses.map((business) => (
                  <div
                    key={business.id}
                    className="rounded-md border border-border bg-background p-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/businesses/${business.id}`}
                            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {business.name}
                          </Link>
                          {business.verified && (
                            <span className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {business.phone}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {business.category || "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-right">
                        {business.status ? (
                          <span
                            className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              statusBadgeClass[business.status] ||
                              "border border-border bg-muted/60 text-foreground"
                            }`}
                          >
                            <span className="truncate">
                              {statusLabel[business.status as Exclude<
                                BusinessStatus,
                                "VERIFIED"
                              >] || business.status}
                            </span>
                          </span>
                        ) : business.reviews_count > 0 ? (
                          <span className="inline-flex items-center text-[11px] text-muted-foreground whitespace-nowrap">
                            <span className="mr-1 text-xs">⭐</span>
                            {business.avg_rating.toFixed(1)} ·{" "}
                            {business.reviews_count} review
                            {business.reviews_count === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            No reviews yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </PublicLayout>
    </>
  );
};

export default BusinessesPage;