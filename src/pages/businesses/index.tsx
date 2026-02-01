import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type BusinessStatus =
  | "UNDER_REVIEW"
  | "MULTIPLE_REPORTS"
  | "PATTERN_MATCH_SCAM"
  | "VERIFIED";

interface BusinessListItem {
  id: string;
  name: string;
  phone: string;
  category: string;
  status: BusinessStatus | null;
  verified: boolean;
}

const statusLabel: Record<BusinessStatus, string> = {
  UNDER_REVIEW: "Under Review",
  MULTIPLE_REPORTS: "Multiple Independent Reports",
  PATTERN_MATCH_SCAM: "Pattern Match: Known Scam Method",
  VERIFIED: "Verified",
};

const statusBadgeClass: Record<BusinessStatus, string> = {
  UNDER_REVIEW: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  MULTIPLE_REPORTS:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40",
  PATTERN_MATCH_SCAM:
    "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/40",
  VERIFIED: "bg-emerald-600 text-emerald-50",
};

export default function BusinessesPage() {
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("businesses")
        .select("id,name,phone,category,status,verified")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setBusinesses(data as BusinessListItem[]);
      }
      setLoading(false);
    };
    fetchInitial();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmed = query.trim();
    if (!trimmed) {
      const { data } = await supabase
        .from("businesses")
        .select("id,name,phone,category,status,verified")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setBusinesses(data as BusinessListItem[]);
      }
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("businesses")
      .select("id,name,phone,category,status,verified")
      .or(`name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
      .order("created_at", { ascending: false });

    if (data) {
      setBusinesses(data as BusinessListItem[]);
    }
    setLoading(false);
  };

  return (
    <>
      <SEO
        title="Search businesses – Transparent Turtle"
        description="Search for businesses by name or phone on Transparent Turtle."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
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
                <div className="space-y-2 text-xs sm:text-sm">
                  {businesses.map((biz) => (
                    <Link
                      key={biz.id}
                      href={`/businesses/${biz.id}`}
                      className="flex flex-col gap-1 rounded-md border border-border/70 bg-background/70 p-3 transition hover:bg-muted/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{biz.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {biz.status && (
                            <Badge
                              className={
                                "border " +
                                (statusBadgeClass[
                                  biz.status
                                ] || "bg-muted text-foreground")
                              }
                            >
                              {statusLabel[biz.status] ?? "Status"}
                            </Badge>
                          )}
                          {biz.verified && (
                            <Badge className="bg-emerald-600 text-emerald-50">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Category: {biz.category} • Phone: {biz.phone}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}