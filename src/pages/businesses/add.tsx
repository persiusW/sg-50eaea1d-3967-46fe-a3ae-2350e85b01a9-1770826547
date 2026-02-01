import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface FormState {
  name: string;
  phone: string;
  location: string;
  branches_count: string;
  category: string;
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

export default function AddBusinessPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BusinessListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    location: "",
    branches_count: "",
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live search by name or phone with simple debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,phone,category,status,verified")
        .or(`name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setSearchResults(data as BusinessListItem[]);
      } else {
        setSearchResults([]);
      }
      setSearchLoading(false);
    }, 250);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectExisting = (id: string) => {
    router.push(`/businesses/${id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const name = form.name.trim();
    const phone = form.phone.trim();
    const location = form.location.trim();
    const branches = form.branches_count.trim();
    const category = form.category;

    if (!name || !phone || !category) {
      setSubmitError("Name, phone, and category are required.");
      setSubmitting(false);
      return;
    }

    // Check if a business with this phone already exists
    const { data: existing, error: checkError } = await supabase
      .from("businesses")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (!checkError && existing) {
      router.push(`/businesses/${existing.id}`);
      setSubmitting(false);
      return;
    }

    // Insert new business
    const branchesCountNumber = branches ? parseInt(branches, 10) : null;

    const { data: inserted, error: insertError } = await supabase
      .from("businesses")
      .insert({
        name,
        phone,
        location: location || null,
        branches_count: Number.isNaN(branchesCountNumber)
          ? null
          : branchesCountNumber,
        category,
        // Public created: not verified, not created_by_admin
        verified: false,
        created_by_admin: false,
      })
      .select("id")
      .maybeSingle();

    if (insertError || !inserted) {
      setSubmitError(
        "Failed to create business. Please check the details and try again.",
      );
      setSubmitting(false);
      return;
    }

    router.push(`/businesses/${inserted.id}`);
    setSubmitting(false);
  };

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
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium">1. Search existing records</p>
              <Input
                type="search"
                placeholder="Start with business name or phone number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Results update as you type. Select an existing business to go
                straight to its profile.
              </p>

              <div className="space-y-2 text-xs sm:text-sm">
                {searchLoading && (
                  <p className="text-muted-foreground">Searching…</p>
                )}
                {!searchLoading && searchQuery.trim() !== "" && (
                  <>
                    {searchResults.length === 0 ? (
                      <p className="text-muted-foreground">
                        No existing businesses match this search. You can add a
                        new one below.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((biz) => (
                          <button
                            key={biz.id}
                            type="button"
                            onClick={() => handleSelectExisting(biz.id)}
                            className="flex w-full flex-col gap-1 rounded-md border border-border/70 bg-background/70 p-3 text-left transition hover:bg-muted/70"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{biz.name}</p>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {biz.status && (
                                  <span
                                    className={
                                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium " +
                                      (statusBadgeClass[biz.status] ||
                                        "bg-muted text-foreground")
                                    }
                                  >
                                    {statusLabel[biz.status] ?? "Status"}
                                  </span>
                                )}
                                {biz.verified && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-emerald-50">
                                    Verified
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Category: {biz.category} • Phone: {biz.phone}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium">
                2. Add a new business (if no match)
              </p>
              <form
                onSubmit={handleSubmit}
                className="space-y-4 text-sm"
                noValidate
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="name">Business name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Honest Repairs Co."
                      value={form.name}
                      onChange={(e) =>
                        handleFormChange("name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Primary phone (unique)</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (___) ___-____"
                      value={form.phone}
                      onChange={(e) =>
                        handleFormChange("phone", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, region, country"
                      value={form.location}
                      onChange={(e) =>
                        handleFormChange("location", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="branches">Number of branches</Label>
                    <Input
                      id="branches"
                      type="number"
                      min={1}
                      placeholder="1"
                      value={form.branches_count}
                      onChange={(e) =>
                        handleFormChange("branches_count", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        handleFormChange("category", value)
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="logistics">Logistics</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs text-destructive-foreground">
                    {submitError}
                  </p>
                )}

                <Button
                  type="submit"
                  className="mt-2 w-full sm:w-auto"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit business"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Phone numbers are unique identifiers. If the phone already
                  exists in Transparent Turtle, this flow will redirect to the
                  existing business instead of creating a duplicate entry.
                </p>
              </form>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}