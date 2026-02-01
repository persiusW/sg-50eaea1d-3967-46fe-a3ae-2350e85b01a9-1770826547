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

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("flagged_numbers")
      .select("id, phone, name_on_number, connected_page, status")
      .order("created_at", { ascending: false });

    if (data) {
      setItems(
        data.map((row) => ({
          ...row,
          status: (row.status || "UNDER_REVIEW") as FlagStatus,
        })),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.phone.toLowerCase().includes(q) ||
      (item.name_on_number ?? "").toLowerCase().includes(q)
    );
  });

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
                onChange={(e) => setQuery(e.target.value)}
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
                        <th className="py-2 px-3 font-medium">Connected scam/page</th>
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
            </div>
          </section>
        </div>
      </main>
    </>
  );
}