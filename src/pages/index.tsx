import React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/PublicLayout";

const HomePage: NextPage = () => {
  return (
    <>
      <SEO
        title="Transparent Turtle – Public business reviews and scam awareness"
        description="Search businesses, read reviews, and see flagged phone numbers to stay ahead of scams."
      />
      <PublicLayout>
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <section className="space-y-6">
            <section className="border-b border-border bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_55%)]">
              <div className="py-10 md:py-12">
                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2.2fr)]">
                  <div className="max-w-2xl space-y-5">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-700/60">
                      Public. Transparent. Verified records.
                    </span>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                      Ghana’s Trusted Business Directory
                    </h1>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 sm:text-base">
                      Discover trusted businesses across Ghana.
                    </p>
                    <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
                      Read authentic reviews, avoid scams, and make informed decisions. Transparent Turtle helps you verify businesses, check flagged numbers, and spot fraud patterns before you pay.
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button asChild size="lg" className="w-full sm:w-auto">
                        <Link href="/businesses">Search businesses</Link>
                      </Button>
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                        <Button
                          asChild
                          variant="outline"
                          size="lg"
                          className="w-full sm:w-auto"
                        >
                          <Link href="/businesses/add">Add a business</Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="lg"
                          className="w-full text-primary sm:w-auto"
                        >
                          <Link href="/flagged-numbers">View flagged numbers</Link>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <aside className="mt-4 w-full max-w-md rounded-lg border border-emerald-100 bg-card/70 p-4 shadow-sm backdrop-blur-sm dark:border-emerald-900/60 dark:bg-emerald-950/20 lg:mt-0 lg:ml-auto">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Live snapshot · Example records
                    </h2>

                    <div className="mt-3 space-y-3 text-xs sm:text-sm">
                      <div className="rounded-md border border-border bg-background p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">Food Scape</p>
                          <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-emerald-50">
                            Verified
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Category: Catering · Phone: +233 538 530 352
                        </p>
                      </div>

                      <div className="rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-700/60 dark:bg-amber-900/20">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            “Lottery Number” Caller
                          </p>
                          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-500/40 dark:bg-amber-900/40 dark:text-amber-200">
                            Pattern match: known scam
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Number: +233 555 990 1234
                        </p>
                        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-200">
                          Multiple independent reports of phishing calls.
                        </p>
                      </div>

                      <p className="mt-2 rounded-md border border-dashed border-border bg-background/60 p-2 text-[11px] text-muted-foreground">
                        Transparent Turtle combines public reports with structured verification. Trusted businesses appear as Verified, while suspicious patterns trigger risk badges over time.
                      </p>
                    </div>
                  </aside>
                </div>
              </div>
            </section>

            <section className="border-b border-border bg-card/40">
              <div className="py-8 md:py-10">
                <div className="grid gap-4 md:grid-cols-3">
                  <article className="rounded-lg border border-border bg-background p-3 shadow-sm">
                    <h3 className="text-sm font-semibold">Public reviews</h3>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      Read and share real experiences from people across Ghana. Reviews publish openly, with safeguards in place to prevent abuse and false reporting.
                    </p>
                  </article>
                  <article className="rounded-lg border border-border bg-background p-3 shadow-sm">
                    <h3 className="text-sm font-semibold">Status &amp; verification</h3>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      Clear badges like Verified, Under Review, Multiple Reports, and Pattern Match show a business’s current trust level at a glance.
                    </p>
                  </article>
                  <article className="rounded-lg border border-border bg-background p-3 shadow-sm">
                    <h3 className="text-sm font-semibold">Flagged numbers</h3>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      A searchable list of phone numbers linked to scams or high-risk activity, surfaced through reports and verification signals.
                    </p>
                  </article>
                </div>
              </div>
            </section>
          </section>
        </div>
      </PublicLayout>
    </>
  );
};

export default HomePage;