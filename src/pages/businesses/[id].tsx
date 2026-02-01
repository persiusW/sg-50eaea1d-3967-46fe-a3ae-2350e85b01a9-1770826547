import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type BusinessStatus =
  | "UNDER_REVIEW"
  | "MULTIPLE_REPORTS"
  | "PATTERN_MATCH_SCAM"
  | "VERIFIED";

interface Business {
  id: string;
  name: string;
  phone: string;
  location: string | null;
  branches_count: number | null;
  category: string;
  status: BusinessStatus | null;
  verified: boolean;
  created_at: string;
}

interface Review {
  id: string;
  business_id: string;
  reviewer_name: string;
  reviewer_phone: string;
  rating: number;
  body: string;
  created_at: string;
}

interface ReviewFormState {
  reviewer_name: string;
  reviewer_phone: string;
  rating: string;
  body: string;
}

const statusLabel: Record<BusinessStatus, string> = {
  UNDER_REVIEW: "Under Review",
  MULTIPLE_REPORTS: "Multiple Independent Reports",
  PATTERN_MATCH_SCAM: "Pattern Match: Known Scam Method",
  VERIFIED: "Verified",
};

const statusBadgeClass: Record<BusinessStatus, string> = {
  UNDER_REVIEW: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  MULTIPLE_REPORTS:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40",
  PATTERN_MATCH_SCAM:
    "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/40",
  VERIFIED: "bg-emerald-600 text-emerald-50",
};

const BusinessProfilePage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewFormState>({
    reviewer_name: "",
    reviewer_phone: "",
    rating: "5",
    body: "",
  });

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchBusiness = async () => {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        setLoadError("Failed to load business. Please try again.");
        setLoading(false);
        return;
      }

      if (!data) {
        setLoadError("Business not found.");
        setLoading(false);
        return;
      }

      setBusiness(data as Business);
      setLoading(false);
    };

    const fetchReviews = async () => {
      setLoadingReviews(true);
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReviews(data as Review[]);
      }
      setLoadingReviews(false);
    };

    fetchBusiness();
    fetchReviews();
  }, [id]);

  const handleFormChange = (
    field: keyof ReviewFormState,
    value: string,
  ): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setSubmitting(true);
    setSubmitError(null);

    const ratingNumber = parseInt(form.rating, 10);
    if (Number.isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      setSubmitError("Rating must be between 1 and 5.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      business_id: business.id,
      reviewer_name: form.reviewer_name.trim() || "Anonymous",
      reviewer_phone: form.reviewer_phone.trim(),
      rating: ratingNumber,
      body: form.body.trim(),
    });

    if (error) {
      setSubmitError("Failed to submit review. Please try again.");
      setSubmitting(false);
      return;
    }

    setForm({
      reviewer_name: "",
      reviewer_phone: "",
      rating: "5",
      body: "",
    });

    const { data: refreshed, error: refreshError } = await supabase
      .from("reviews")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (!refreshError && refreshed) {
      setReviews(refreshed as Review[]);
    }

    setSubmitting(false);
  };

  const title =
    business?.name ?? "Business profile – Transparent Turtle";

  return (
    <>
      <SEO
        title={title}
        description="View business details, status, and community reviews on Transparent Turtle."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Business profile
              </h1>
              <p className="text-sm text-muted-foreground">
                Public, read-only record of this business and its reported
                experiences.
              </p>
            </div>
            <Link
              href="/businesses"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Back to search
            </Link>
          </header>

          {loading ? (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading business…
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-destructive bg-destructive/5 p-4 text-sm text-destructive-foreground">
              {loadError}
            </div>
          ) : business ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <section className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">
                        {business.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Phone: {business.phone}
                      </p>
                      {business.location && (
                        <p className="text-xs text-muted-foreground">
                          Location: {business.location}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {business.status && (
                        <Badge
                          className={
                            "border " +
                            (statusBadgeClass[
                              business.status
                            ] || "bg-muted text-foreground")
                          }
                        >
                          {statusLabel[business.status] ?? "Status"}
                        </Badge>
                      )}
                      {business.verified && (
                        <Badge className="bg-emerald-600 text-emerald-50">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{business.category}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">
                        Number of branches
                      </p>
                      <p className="font-medium">
                        {business.branches_count ?? 1}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    This profile is public and read-only. Only admins can edit
                    or remove business details or status badges.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-medium">Leave a review</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your review is public and cannot be edited later. Do not
                    include sensitive personal information.
                  </p>

                  <form
                    onSubmit={handleSubmit}
                    className="mt-3 space-y-3 text-sm"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor="reviewer_name"
                          className="block text-xs font-medium"
                        >
                          Your name
                        </label>
                        <Input
                          id="reviewer_name"
                          value={form.reviewer_name}
                          onChange={(e) =>
                            handleFormChange(
                              "reviewer_name",
                              e.target.value,
                            )
                          }
                          placeholder="Name or alias"
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="reviewer_phone"
                          className="block text-xs font-medium"
                        >
                          Your phone (temporary identifier)
                        </label>
                        <Input
                          id="reviewer_phone"
                          value={form.reviewer_phone}
                          onChange={(e) =>
                            handleFormChange(
                              "reviewer_phone",
                              e.target.value,
                            )
                          }
                          placeholder="+1 (___) ___-____"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="rating"
                        className="block text-xs font-medium"
                      >
                        Rating (1–5)
                      </label>
                      <Input
                        id="rating"
                        type="number"
                        min={1}
                        max={5}
                        value={form.rating}
                        onChange={(e) =>
                          handleFormChange("rating", e.target.value)
                        }
                        className="max-w-[120px]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="body"
                        className="block text-xs font-medium"
                      >
                        Review
                      </label>
                      <Textarea
                        id="body"
                        value={form.body}
                        onChange={(e) =>
                          handleFormChange("body", e.target.value)
                        }
                        rows={4}
                        placeholder="Describe your experience. Avoid sharing passwords, account numbers, or other sensitive data."
                        required
                      />
                    </div>

                    {submitError && (
                      <p className="text-xs text-destructive-foreground">
                        {submitError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      size="sm"
                      disabled={submitting}
                      className="mt-1"
                    >
                      {submitting ? "Submitting…" : "Publish review"}
                    </Button>
                  </form>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Reviews</p>
                    <p className="text-[11px] text-muted-foreground">
                      Newest first
                    </p>
                  </div>

                  {loadingReviews ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Loading reviews…
                    </p>
                  ) : reviews.length === 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      No reviews yet. Be the first to share your
                      experience.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3 text-xs">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-md border border-border/70 bg-background/70 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">
                              {review.reviewer_name || "Anonymous"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Rating: {review.rating}/5
                            </p>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {review.body}
                          </p>
                          <p className="mt-2 text-[10px] text-muted-foreground">
                            Reviewer phone: {review.reviewer_phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
};

export default BusinessProfilePage;