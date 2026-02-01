import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/components/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { StatusLegend } from "@/components/StatusLegend";
import { BusinessSummaryCard } from "@/components/BusinessSummaryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BusinessStatus =
"UNDER_REVIEW" |
"MULTIPLE_REPORTS" |
"PATTERN_MATCH_SCAM" |
"VERIFIED" |
"SCAM";

interface BusinessListItem {
  id: string;
  name: string;
  phone: string;
  category: string;
  status: BusinessStatus | null;
  verified: boolean;
  avg_rating: number;
  reviews_count: number;
  location?: string | null;
}

const statusLabel: Record<Exclude<BusinessStatus, "VERIFIED">, string> = {
  UNDER_REVIEW: "Under Review",
  MULTIPLE_REPORTS: "Multiple Independent Reports",
  PATTERN_MATCH_SCAM: "Pattern Match: Known Scam Method",
  SCAM: "Confirmed Scam"
};

const statusBadgeClass: Record<Exclude<BusinessStatus, "VERIFIED">, string> = {
  UNDER_REVIEW:
  "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-300/70 dark:border-slate-600/70",
  MULTIPLE_REPORTS:
  "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40",
  PATTERN_MATCH_SCAM:
  "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/40",
  SCAM:
  "bg-red-600 text-red-50 border border-red-700 dark:bg-red-900 dark:text-red-100"
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

    let baseQuery = supabase.
    from("businesses_with_ratings").
    select(
      "id,name,phone,category,location,status,verified,created_at,avg_rating,reviews_count"
    ).
    order("created_at", { ascending: false });

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
        description="Search for businesses by name or phone and see their status and review summary." />

      <PublicLayout>
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              Search businesses
            </h1>
            <p className="text-sm text-muted-foreground">
              Look up businesses by name or phone to see public reports and status signals.
            </p>
          </header>

          <div className="mt-4 space-y-4">
            <StatusLegend className="max-w-2xl" />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <form onSubmit={handleSearch} className="flex flex-1 flex-col gap-2 sm:flex-row">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by business name or phone"
                  className="flex-1"
                />
                <Button type="submit" size="sm" className="shrink-0">
                  Search
                </Button>
              </form>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/businesses/add">Add a business</Link>
              </Button>
            </div>

            {/* Mobile list (unchanged) */}
            <div className="space-y-2 sm:hidden">
              {businesses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No businesses found. Try a different search.
                </p>
              ) : (
                businesses.map((biz) => (
                  <Link
                    key={biz.id}
                    href={`/businesses/${biz.id}`}
                    className="block rounded-lg border border-border bg-card p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{biz.name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {biz.phone} · {biz.category || "Uncategorized"}
                        </p>
                      </div>
                      {biz.verified && (
                        <span className="inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                          Verified
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Desktop list using cards */}
            <div className="hidden sm:block">
              {businesses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No businesses found. Try a different search.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {businesses.map((biz) => (
                    <BusinessSummaryCard
                      key={biz.id}
                      id={biz.id}
                      name={biz.name}
                      phone={biz.phone}
                      category={biz.category}
                      verified={biz.verified ?? false}
                      status={biz.status ?? null}
                      avgRating={biz.avg_rating ?? null}
                      reviewsCount={biz.reviews_count ?? null}
                      location={biz.location ?? null}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </PublicLayout>
    </>);
};

export default BusinessesPage;