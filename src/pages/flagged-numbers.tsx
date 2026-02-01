import React, { useEffect, useState } from "react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";

type FlagStatus =
  | "UNDER_REVIEW"
  | "MULTIPLE_REPORTS"
  | "PATTERN_MATCH_SCAM"
  | "VERIFIED";

interface PublicFlaggedNumber {
  id: string;
  phone: string;
  name_on_number: string | null;
  connected_page: string | null;
  status: FlagStatus;
}

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<FlagStatus, string> = {
  UNDER_REVIEW: "Under Review",
  MULTIPLE_REPORTS: "Multiple Reports",
  PATTERN_MATCH_SCAM: "Pattern Match",
  VERIFIED: "Confirmed Scam",
};

const STATUS_CLASS: Record<FlagStatus, string> = {
  UNDER_REVIEW:
    "border-slate-400/40 bg-slate-100 text-slate-700 dark:border-slate-500/50 dark:bg-slate-900/40 dark:text-slate-100",
  MULTIPLE_REPORTS:
    "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:border-orange-400/60 dark:bg-orange-900/30 dark:text-orange-200",
  PATTERN_MATCH_SCAM:
    "border-amber-600/60 bg-amber-500/15 text-amber-800 dark:border-amber-400/70 dark:bg-amber-900/40 dark:text-amber-100",
  VERIFIED:
    "border-red-600 bg-red-600/15 text-red-800 dark:border-red-500 dark:bg-red-900/50 dark:text-red-100",
};

const STATUS_PREFIX: Partial<Record<FlagStatus, string>> = {
  MULTIPLE_REPORTS: "🚩 ",
  PATTERN_MATCH_SCAM: "❗ ",
  VERIFIED: "⛔ ",
};

export default function FlaggedNumbersPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PublicFlaggedNumber[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);

  const fetchPage = async (pageNumber: number, currentQuery: string) => {
    setLoading(true);
    setLoadingPage(true);

    const from = (pageNumber - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const queryBuilder = supabase
      .from("flagged_numbers")
      .select("id, phone, name_on_number, connected_page, status")
      .order("created_at", { ascending: false })
      .range(from, to);

    const trimmed = currentQuery.trim();
    if (trimmed) {
      const lowered = trimmed.toLowerCase();
      // client-side filter after page fetch to keep logic simple
      const { data } = await queryBuilder;
      if (data) {
        const mapped = data.map((row) => ({
          ...row,
          status: (row.status || "UNDER_REVIEW") as FlagStatus,
        })) as PublicFlaggedNumber[];

        const filtered = mapped.filter((item) => {
          const phone = item.phone.toLowerCase();
          const name = (item.name_on_number ?? "").toLowerCase();
          return (
            phone.includes(lowered) ||
            name.includes(lowered)
          );
        });

        setItems(filtered);
        setIsLastPage(filtered.length < PAGE_SIZE || data.length < PAGE_SIZE);
      } else {
        setItems([]);
        setIsLastPage(true);
      }
    } else {
      const { data } = await queryBuilder;
      if (data) {
        const mapped = data.map((row) => ({
          ...row,
          status: (row.status || "UNDER_REVIEW") as FlagStatus,
        })) as PublicFlaggedNumber[];

        setItems(mapped);
        setIsLastPage(data.length < PAGE_SIZE);
      } else {
        setItems([]);
        setIsLastPage(true);
      }
    }

    setLoading(false);
    setLoadingPage(false);
  };

  useEffect(() => {
    fetchPage(1, "");
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    const trimmed = value.trim();
    // Reset to page 1 on new search and fetch
    const nextPage = 1;
    setPage(nextPage);
    fetchPage(nextPage, trimmed);
  };

  const handlePrevious = () => {
    if (page === 1 || loadingPage) return;
    const nextPage = page - 1;
    setPage(nextPage);
    fetchPage(nextPage, query.trim());
  };

  const handleNext = () => {
    if (isLastPage || loadingPage) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, query.trim());
  };

  const filtered = items;

  return (
    <>
      <SEO
        title="Flagged numbers – Transparent Turtle"
        description="Search flagged phone numbers connected to scams and high-risk activity."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Flagged numbers
              </h1>
              <p className="text-sm text-muted-foreground">
                A public list of phone numbers connected to scams or high-risk
                activity. Each entry has a status badge set by admins.
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                placeholder="Search by phone number or name on number"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:max-w-md"
                value={query}
                onChange={handleSearchChange}
              />
            </div>

            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              {loading && (
                <p className="text-xs text-muted-foreground">
                  Loading flagged numbers…
                </p>
              )}

              {!loading && filtered.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No flagged numbers match your search.
                </p>
              )}

              {!loading && filtered.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Phone</th>
                        <th className="py-2 px-3 font-medium">Name</th>
                        <th className="py-2 px-3 font-medium">
                          Connected scam/page
                        </th>
                        <th className="py-2 px-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-2 pr-3 align-middle">
                            <div className="text-sm font-medium">
                              {item.phone}
                            </div>
                          </td>
                          <td className="py-2 px-3 align-middle">
                            {item.name_on_number || (
                              <span className="text-[11px] text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 align-middle">
                            {item.connected_page || (
                              <span className="text-[11px] text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 align-middle">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[item.status]}`}
                            >
                              {STATUS_PREFIX[item.status] ?? ""}
                              {item.status === "VERIFIED"
                                ? "Confirmed Scam"
                                : STATUS_LABEL[item.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={page === 1 || loadingPage}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground disabled:opacity-50"
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLastPage || loadingPage}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {/* Existing legend (unchanged content) */}
              {!loading && (
                <div className="mt-4 rounded-md border border-dashed border-border/60 bg-background/60 p-3 text-[11px] text-muted-foreground">
                  <p className="font-medium">Status Guide</p>
                  <ul className="mt-1 space-y-0.5">
                    <li>
                      ⚠️ <span className="font-medium">Under Review</span> — Reports received and currently being assessed
                    </li>
                    <li>
                      🚩 <span className="font-medium">Multiple Reports</span> — Reported by multiple independent sources
                    </li>
                    <li>
                      ❗ <span className="font-medium">Pattern Match</span> — Matches known scam or fraud patterns
                    </li>
                    <li>
                      ⛔ <span className="font-medium">Confirmed Scam</span> — High confidence of fraudulent activity
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}