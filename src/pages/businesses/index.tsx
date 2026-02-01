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
  UNDER_REVIEW:
    "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
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
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-700/60">
                                  Verified
                                </span>
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
                            {biz.status ? (
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                  statusBadgeClass[biz.status]
                                }`}
                              >
                                {statusLabel[biz.status] ?? biz.status}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                No status
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}