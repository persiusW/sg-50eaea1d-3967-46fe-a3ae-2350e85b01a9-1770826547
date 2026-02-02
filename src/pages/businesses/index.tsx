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

const PAGE_SIZE = 25;

type StatusFilter =
  | "ALL"
  | "UNDER_REVIEW"
  | "MULTIPLE_REPORTS"
  | "PATTERN_MATCH_SCAM"
  | "SCAM"
  | "NONE";

type SortOption = "NEWEST" | "HIGHEST_RATED" | "MOST_REVIEWED";

const BusinessesPage: NextPage = () => {
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
  const [anyBusinessesExist, setAnyBusinessesExist] = useState<boolean | null>(null);

  const fetchBusinesses = async (search: string, pageToLoad: number) => {
    setLoading(true);

    const from = (pageToLoad - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let baseQuery = supabase
      .from("businesses_with_ratings")
      .select(
        "id,name,phone,category,location,status,verified,created_at,avg_rating,reviews_count"
      );

    const trimmed = search.trim();
    if (trimmed.length > 0) {
      baseQuery = baseQuery.or(
        `name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`
      );
    }

    if (selectedCategory !== "ALL") {
      baseQuery = baseQuery.eq("category", selectedCategory);
    }

    if (verifiedOnly) {
      baseQuery = baseQuery.eq("verified", true);
    }

    if (statusFilter === "NONE") {
      baseQuery = baseQuery.is("status", null);
    } else if (statusFilter !== "ALL") {
      baseQuery = baseQuery.eq("status", statusFilter);
    }

    if (sortBy === "HIGHEST_RATED") {
      baseQuery = baseQuery.order("avg_rating", { ascending: false, nullsFirst: false });
    } else if (sortBy === "MOST_REVIEWED") {
      baseQuery = baseQuery.order("reviews_count", { ascending: false, nullsFirst: false });
    } else {
      baseQuery = baseQuery.order("created_at", { ascending: false });
    }

    const { data, error } = await baseQuery.range(from, to);

    if (error) {
      setBusinesses([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    if (data) {
      setBusinesses(data as BusinessListItem[]);
      setHasMore(data.length === PAGE_SIZE);
      if (anyBusinessesExist === null) {
        setAnyBusinessesExist(data.length > 0);
      }
    } else {
      setBusinesses([]);
      setHasMore(false);
      if (anyBusinessesExist === null) {
        setAnyBusinessesExist(false);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    void fetchBusinesses("", 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextPage = 1;
    setPage(nextPage);
    await fetchBusinesses(query, nextPage);
  };

  const handleFilterChange = async (
    nextCategory: string | null,
    nextVerifiedOnly: boolean | null,
    nextStatusFilter: StatusFilter | null,
    nextSortBy: SortOption | null
  ) => {
    const newCategory = nextCategory === null ? selectedCategory : nextCategory;
    const newVerifiedOnly =
      nextVerifiedOnly === null ? verifiedOnly : nextVerifiedOnly;
    const newStatus = nextStatusFilter === null ? statusFilter : nextStatusFilter;
    const newSort = nextSortBy === null ? sortBy : nextSortBy;

    setSelectedCategory(newCategory);
    setVerifiedOnly(newVerifiedOnly);
    setStatusFilter(newStatus);
    setSortBy(newSort);

    const nextPage = 1;
    setPage(nextPage);
    await fetchBusinesses(query, nextPage);
  };

  const handlePageChange = async (direction: "next" | "prev") => {
    const nextPage = direction === "next" ? page + 1 : page - 1;
    if (nextPage < 1) return;
    setPage(nextPage);
    await fetchBusinesses(query, nextPage);
  };

  const showNoBusinessesYet =
    !loading &&
    businesses.length === 0 &&
    anyBusinessesExist === false &&
    !query.trim() &&
    selectedCategory === "ALL" &&
    !verifiedOnly &&
    statusFilter === "ALL";

  const showNoMatches =
    !loading &&
    businesses.length === 0 &&
    (anyBusinessesExist === true ||
      query.trim() ||
      selectedCategory !== "ALL" ||
      verifiedOnly ||
      statusFilter !== "ALL");

  return (
    <>
      <SEO
        title="Search businesses – Transparent Turtle"
        description="Search for businesses by name or phone and see their status and review summary."
      />

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

            <div className="flex flex-col gap-2 rounded-md border border-border bg-card/50 p-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs">Category</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) =>
                      void handleFilterChange(e.target.value, null, null, null)
                    }
                    className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] sm:text-xs"
                  >
                    <option value="ALL">All</option>
                    <option value="Health / Clinic">Health / Clinic</option>
                    <option value="Retail">Retail</option>
                    <option value="Online Store">Online Store</option>
                    <option value="Service">Service</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) =>
                      void handleFilterChange(null, e.target.checked, null, null)
                    }
                    className="h-3 w-3 sm:h-4 sm:w-4"
                  />
                  <span className="text-[11px] sm:text-xs">Verified only</span>
                </label>

                <label className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      void handleFilterChange(
                        null,
                        null,
                        e.target.value as StatusFilter,
                        null
                      )
                    }
                    className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] sm:text-xs"
                  >
                    <option value="ALL">All</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="MULTIPLE_REPORTS">Multiple Reports</option>
                    <option value="PATTERN_MATCH_SCAM">Pattern Match Scam</option>
                    <option value="SCAM">Confirmed Scam</option>
                    <option value="NONE">No status</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1">
                  <span className="text-[11px] sm:text-xs">Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      void handleFilterChange(
                        null,
                        null,
                        null,
                        e.target.value as SortOption
                      )
                    }
                    className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] sm:text-xs"
                  >
                    <option value="NEWEST">Newest</option>
                    <option value="HIGHEST_RATED">Highest rated</option>
                    <option value="MOST_REVIEWED">Most reviewed</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Mobile list */}
            <div className="space-y-2 sm:hidden">
              {loading && businesses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Loading businesses…
                </p>
              ) : showNoBusinessesYet ? (
                <p className="text-xs text-muted-foreground">
                  No businesses yet. Add the first business record.
                </p>
              ) : showNoMatches ? (
                <p className="text-xs text-muted-foreground">
                  No matches found. Try a different search or add a business.
                </p>
              ) : businesses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No businesses found. Try a different search.
                </p>
              ) : (
                <div className="space-y-2">
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

            {/* Desktop list using cards */}
            <div className="hidden sm:block">
              {loading && businesses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Loading businesses…
                </p>
              ) : showNoBusinessesYet ? (
                <p className="text-xs text-muted-foreground">
                  No businesses yet. Add the first business record.
                </p>
              ) : showNoMatches ? (
                <p className="text-xs text-muted-foreground">
                  No matches found. Try a different search or add a business.
                </p>
              ) : businesses.length === 0 ? (
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

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
              <div>
                {page > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handlePageChange("prev")}
                  >
                    Previous
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground">
                Page {page}
              </p>
              <div>
                {hasMore && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handlePageChange("next")}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    </>
  );
};

export default BusinessesPage;