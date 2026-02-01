import React from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <SEO
        title="Transparent Turtle – Public Business Reviews & Scam Awareness"
        description="Transparent Turtle is a public, account-free platform for business reviews, scam awareness, and verified flagged numbers. Built for transparency and trust."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col py-10 gap-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-xl font-semibold">TT</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Transparent Turtle
                </h1>
                <p className="text-xs text-muted-foreground">
                  See through scams. Reward honest businesses.
                </p>
              </div>
            </div>
            <nav className="hidden text-sm md:flex items-center gap-6 text-muted-foreground">
              <Link href="/businesses" className="hover:text-foreground">
                Search
              </Link>
              <Link href="/businesses/add" className="hover:text-foreground">
                Add business
              </Link>
              <Link href="/flagged-numbers" className="hover:text-foreground">
                Flagged numbers
              </Link>
            </nav>
          </header>

          <section className="grid flex-1 gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                Public. Transparent. No user accounts.
              </p>
              <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                A public ledger for{" "}
                <span className="underline decoration-primary decoration-2 underline-offset-4">
                  honest businesses
                </span>{" "}
                and known scams.
              </h2>
              <p className="max-w-xl text-sm sm:text-base text-muted-foreground">
                Transparent Turtle lets anyone look up a business or phone
                number, share real experiences, and see patterns in reported
                scams. No accounts. No dark patterns. Just a clear record the
                community and admins can trust.
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
                    className="w-full sm:w-auto text-primary"
                  >
                    <Link href="/flagged-numbers">View flagged numbers</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 text-xs sm:text-sm">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="font-medium">No accounts, no friction</p>
                  <p className="mt-1 text-muted-foreground">
                    Anyone can leave a review or report with just a name and
                    phone. Admins handle moderation and verification.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="font-medium">Status &amp; verification badges</p>
                  <p className="mt-1 text-muted-foreground">
                    Clear labels like “Under review”, “Pattern match: scam”, and
                    “Verified” show the current risk level at a glance.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="font-medium">Public flagged numbers</p>
                  <p className="mt-1 text-muted-foreground">
                    A searchable list of phone numbers linked to scams or
                    high-risk activity, managed by trusted admins.
                  </p>
                </div>
              </div>
            </div>

            <aside className="relative">
              <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-b from-primary/5 via-transparent to-primary/10" />
              <div className="rounded-3xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur">
                <h3 className="text-sm font-semibold tracking-tight text-muted-foreground">
                  Live snapshot
                </h3>
                <div className="mt-4 space-y-4 text-xs">
                  <div className="flex items-start justify-between gap-3 rounded-xl bg-muted/60 p-3">
                    <div>
                      <p className="font-medium">Sample Logistics Ltd</p>
                      <p className="text-[11px] text-muted-foreground">
                        Category: Delivery • Phone: +1 (555) 201-8890
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 p-3">
                    <div>
                      <p className="font-medium">
                        &quot;Bank Support&quot; Caller
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Number: +1 (555) 990-1234
                      </p>
                      <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                        Multiple independent reports of phishing calls.
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 text-right">
                      Pattern match:
                      <br />
                      known scam
                    </span>
                  </div>

                  <div className="rounded-xl border border-dashed border-border/70 bg-background/70 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Transparent Turtle combines public reports with
                      admin-controlled verification. Businesses created by admins
                      start Verified; suspicious patterns escalate risk badges.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <footer className="mt-2 flex flex-col items-start justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} Transparent Turtle. Built for
              transparency and scam awareness.
            </p>
            <p>
              Admin access only. Public users cannot edit or delete existing
              records.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}