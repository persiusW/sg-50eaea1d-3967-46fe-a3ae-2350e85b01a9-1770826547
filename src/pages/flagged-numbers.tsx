import React from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function FlaggedNumbersPage() {
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
              placeholder="Search by phone number or name on number"
              className="max-w-md"
            />

            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              The live list of flagged numbers will appear here once connected
              to the database.
            </div>

            <div className="rounded-lg border border-dashed border-border/70 bg-background/70 p-4 text-xs">
              <p className="font-medium">Example record (design preview)</p>
              <div className="mt-3 flex flex-col gap-1 rounded-md bg-card p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">+1 (555) 990-1234</p>
                  <Badge className="bg-emerald-600 text-emerald-50">
                    Verified
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Name on number: &quot;Bank Support&quot; Caller
                </p>
                <p className="text-muted-foreground">
                  Connected scam/page: Phishing calls impersonating a major
                  bank&apos;s fraud department.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}