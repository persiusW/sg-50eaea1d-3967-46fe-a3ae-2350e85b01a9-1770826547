import React from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddBusinessPage() {
  return (
    <>
      <SEO
        title="Add a business – Transparent Turtle"
        description="Suggest a new business for public review on Transparent Turtle."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Add or find a business
              </h1>
              <p className="text-sm text-muted-foreground">
                Start typing a business name or phone. If it already exists,
                we&apos;ll send you to its page instead of creating a duplicate.
              </p>
            </div>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Back to home
            </Link>
          </header>

          <section className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <p className="text-sm font-medium">
                1. Search existing records
              </p>
              <Input
                type="search"
                placeholder="Start with business name or phone number"
              />
              <p className="text-xs text-muted-foreground">
                In the full version, this will show a live dropdown of existing
                businesses. Selecting one will redirect you to its profile.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <p className="text-sm font-medium">
                2. Add a new business (if no match)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="name">Business name</Label>
                  <Input id="name" placeholder="e.g. Honest Repairs Co." />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Primary phone (unique)</Label>
                  <Input id="phone" placeholder="+1 (___) ___-____" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="City, region, country" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="branches">Number of branches</Label>
                  <Input id="branches" type="number" min={1} placeholder="1" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="logistics">Logistics</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-2 w-full sm:w-auto">
                Submit business
              </Button>
              <p className="text-xs text-muted-foreground">
                Phone numbers are unique identifiers. If the phone already
                exists in Transparent Turtle, this flow will redirect to the
                existing business instead of creating a duplicate entry.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}