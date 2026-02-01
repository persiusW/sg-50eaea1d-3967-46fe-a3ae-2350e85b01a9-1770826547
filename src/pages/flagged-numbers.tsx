import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface FlaggedNumber {
  id: string;
  phone: string;
  name_on_number: string;
  connected_scam: string;
  verified: boolean;
}

export default function FlaggedNumbersPage() {
  const [query, setQuery] = useState("");
  const [flagged, setFlagged] = useState<FlaggedNumber[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFlagged = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("flagged_numbers")
        .select("id,phone,name_on_number,connected_scam,verified")
        .order("created_at", { ascending: false });
      if (data) {
        setFlagged(data as FlaggedNumber[]);
      }
      setLoading(false);
    };
    fetchFlagged();
  }, []);

  const filtered = flagged.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.phone.toLowerCase().includes(q) ||
      item.name_on_number.toLowerCase().includes(q) ||
      item.connected_scam.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <SEO
        title="Flagged numbers – Transparent Turtle"
        description="Browse a public, read-only list of phone numbers linked to scams or high-risk activity."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Flagged numbers
              </h1>
              <p className="text-sm text-muted-foreground">
                A read-only, admin-curated list of phone numbers linked to scam
                activity or high-risk patterns.
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
            <Input
              type="search"
              placeholder="Search by phone number, name on number, or scam description"
              className="max-w-md"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              {loading && (
                <p className="text-muted-foreground">Loading flagged numbers…</p>
              )}
              {!loading && filtered.length === 0 && (
                <p className="text-muted-foreground">
                  No flagged numbers match this search yet.
                </p>
              )}
              {!loading && filtered.length > 0 && (
                <div className="space-y-2 text-xs sm:text-sm">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-1 rounded-md border border-border/70 bg-background/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{item.phone}</p>
                        {item.verified && (
                          <Badge className="bg-emerald-600 text-emerald-50">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Name on number: {item.name_on_number}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Connected scam/page: {item.connected_scam}
                      </p>
                    </div>
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