import React from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function BusinessesPage() {
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                type="search"
                placeholder="Search by business name or phone number"
                className="w-full sm:max-w-md"
              />
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Results will appear here once the search is connected to the
              database.
            </div>
            <div className="rounded-lg border border-dashed border-border/70 bg-background/70 p-4 text-xs">
              <p className="font-medium">Status badges (preview)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">Under review</Badge>
                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  Multiple independent reports
                </Badge>
                <Badge className="bg-red-500/10 text-red-700 dark:text-red-300">
                  Pattern match: known scam method
                </Badge>
                <Badge className="bg-emerald-600 text-emerald-50">
                  Verified
                </Badge>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}