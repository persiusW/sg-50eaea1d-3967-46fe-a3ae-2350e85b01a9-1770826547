import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicLayout } from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { StatusLegend } from "@/components/StatusLegend";
import { PublicNav } from "@/components/PublicNav";

type BusinessStatus =
"UNDER_REVIEW" |
"MULTIPLE_REPORTS" |
"PATTERN_MATCH_SCAM" |
"VERIFIED" |
"SCAM";

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
  SCAM: "Confirmed Scam"
};

const statusBadgeClass: Record<BusinessStatus, string> = {
  UNDER_REVIEW:
  "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  MULTIPLE_REPORTS:
  "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40",
  PATTERN_MATCH_SCAM:
  "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/40",
  VERIFIED: "bg-emerald-600 text-emerald-50",
  SCAM:
  "bg-red-600 text-red-50 border border-red-700 dark:bg-red-900 dark:text-red-100"
};

const BusinessDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewMeta, setReviewMeta] = useState<Record<string, {earliestCreatedAt: string;count: number;}>>({});
  const [flaggedPhones, setFlaggedPhones] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewFormState>({
    reviewer_name: "",
    reviewer_phone: "",
    rating: "5",
    body: ""
  });

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchBusinessAndReviews = async () => {
      setLoading(true);
      setLoadError(null);

      const { data: businessData, error: businessError } = await supabase.
      from("businesses").
      select("*").
      eq("id", id).
      maybeSingle();

      if (businessError) {
        setLoadError("Failed to load business. Please try again.");
        setLoading(false);
        return;
      }

      if (!businessData) {
        setLoadError("Business not found.");
        setLoading(false);
        return;
      }

      setBusiness(businessData as Business);
      setLoading(false);

      setLoadingReviews(true);
      const { data: reviewData, error: reviewError } = await supabase.
      from("reviews").
      select("*").
      eq("business_id", id).
      order("created_at", { ascending: false });

      if (!reviewError && reviewData) {
        setReviews(reviewData as Review[]);
      }

      setLoadingReviews(false);
    };

    void fetchBusinessAndReviews();
  }, [id]);

  useEffect(() => {
    if (!reviews.length) {
      setReviewMeta({});
      setFlaggedPhones(new Set());
      return;
    }

    const metaMap = new Map<string, {earliestCreatedAt: string;count: number;}>();

    reviews.forEach((rev) => {
      const phoneKey = rev.reviewer_phone?.trim();
      if (!phoneKey) return;

      const existing = metaMap.get(phoneKey);
      if (!existing) {
        metaMap.set(phoneKey, { earliestCreatedAt: rev.created_at, count: 1 });
      } else {
        const earliest =
        new Date(rev.created_at) < new Date(existing.earliestCreatedAt) ?
        rev.created_at :
        existing.earliestCreatedAt;
        metaMap.set(phoneKey, {
          earliestCreatedAt: earliest,
          count: existing.count + 1
        });
      }
    });

    const metaObj: Record<string, {earliestCreatedAt: string;count: number;}> = {};
    metaMap.forEach((value, key) => {
      metaObj[key] = value;
    });
    setReviewMeta(metaObj);

    const uniquePhones = Array.from(
      new Set(
        reviews.
        map((rev) => rev.reviewer_phone?.trim()).
        filter((p): p is string => !!p)
      )
    );

    const checkFlagged = async () => {
      if (!uniquePhones.length) {
        setFlaggedPhones(new Set());
        return;
      }

      const { data, error } = await supabase.
      from("flagged_numbers").
      select("phone").
      in("phone", uniquePhones);

      if (error || !data) {
        setFlaggedPhones(new Set());
        return;
      }

      const flaggedSet = new Set<string>();
      (data as any[]).forEach((row) => {
        const p = (row.phone as string | null)?.trim();
        if (p) flaggedSet.add(p);
      });
      setFlaggedPhones(flaggedSet);
    };

    void checkFlagged();
  }, [reviews]);

  const handleFormChange = (
  field: keyof ReviewFormState,
  value: string)
  : void => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "reviewer_name") {
      setNameError(null);
    }
    if (field === "body" || field === "reviewer_phone" || field === "rating") {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    const trimmedName = form.reviewer_name.trim();
    if (!trimmedName) {
      setNameError("Name is required.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const ratingNumber = parseInt(form.rating, 10);
    if (Number.isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      setSubmitError("Rating must be between 1 and 5.");
      setSubmitting(false);
      return;
    }

    const phone = form.reviewer_phone.trim();

    const { data: existingNames, error: existingNamesError } = await supabase.
    from("reviews").
    select("reviewer_name,created_at").
    eq("reviewer_phone", phone).
    not("reviewer_name", "is", null).
    neq("reviewer_name", "").
    order("created_at", { ascending: true }).
    limit(1);

    let nameToSave = trimmedName;
    if (!existingNamesError && existingNames && existingNames.length > 0) {
      const existing = existingNames[0] as {reviewer_name: string | null;};
      const existingName = existing.reviewer_name?.trim();
      if (existingName) {
        nameToSave = existingName;
      }
    }

    const { error } = await supabase.from("reviews").insert({
      business_id: business.id,
      reviewer_name: nameToSave,
      reviewer_phone: phone,
      rating: ratingNumber,
      body: form.body.trim()
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("LIMIT_PER_BUSINESS_PHONE")) {
        setSubmitError(
          "Limit reached: you can post up to 5 reviews for this business per phone number."
        );
      } else if (msg.includes("LIMIT_PER_DAY_PHONE")) {
        setSubmitError(
          "Daily limit reached: you can post up to 5 reviews per day per phone number."
        );
      } else if (msg.includes("REVIEW_PHONE_REQUIRED")) {
        setSubmitError("Phone number is required.");
      } else {
        setSubmitError("Unable to submit review. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    setForm({
      reviewer_name: "",
      reviewer_phone: "",
      rating: "5",
      body: ""
    });
    setNameError(null);

    const { data: refreshed, error: refreshError } = await supabase.
    from("reviews").
    select("*").
    eq("business_id", business.id).
    order("created_at", { ascending: false });

    if (!refreshError && refreshed) {
      setReviews(refreshed as Review[]);
    }

    setSubmitting(false);
  };

  const reviewsCount = reviews.length;
  const avgRating =
  reviewsCount > 0 ?
  reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount :
  0;

  const title =
  business?.name ?? "Business profile – Transparent Turtle";

  return (
    <>
      <SEO
        title={title}
        description="View business details, status, and community reviews on Transparent Turtle." />

      <PublicLayout>
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Business profile
              </h1>
              <p className="text-sm text-muted-foreground">
                Public, read-only record of this business and its reported experiences.
              </p>
            </div>
            <Link
              href="/businesses"
              className="whitespace-nowrap text-xs text-muted-foreground hover:text-foreground"
            >
              Back to search
            </Link>
          </header>

          <StatusLegend className="max-w-2xl" />

          {loading ?
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading business…
            </div> :
          loadError ?
          <div className="rounded-lg border border-destructive bg-destructive/5 p-4 text-sm text-destructive-foreground">
              {loadError}
            </div> :
          business ?
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <section className="space-y-4">
                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight">
                          {business.name}
                        </h2>
                        {business.verified &&
                      <Badge className="bg-emerald-600 text-emerald-50">
                            Verified
                          </Badge>
                      }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Phone: {business.phone}
                      </p>
                      {business.location &&
                    <p className="text-xs text-muted-foreground">
                          Location: {business.location}
                        </p>
                    }
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {business.status &&
                    business.status !== "VERIFIED" &&
                    <Badge
                      className={
                      business.status === "SCAM" ?
                      "border bg-red-600 text-red-50 dark:bg-red-900 dark:text-red-100" :
                      "border " + (
                      statusBadgeClass[business.status] ||
                      "bg-muted text-foreground")
                      }>

                            {business.status === "SCAM" ?
                      "⛔ Confirmed Scam" :
                      statusLabel[business.status] ??
                      business.status}
                          </Badge>
                    }

                      {(!business.status ||
                    business.status === "VERIFIED") &&
                    <p className="text-[11px] text-muted-foreground">
                          {reviewsCount > 0 ?
                      `⭐ ${avgRating.toFixed(
                        1
                      )} • ${reviewsCount} review${
                      reviewsCount === 1 ? "" : "s"}` :

                      "No reviews yet"}
                        </p>
                    }
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

                  <p className="text-[11px] text-muted-foreground">Reviews on this page are shared publicly by individuals based on their experiences.
Please keep contributions respectful, factual, and constructive.

                </p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-medium">Leave a review</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your review is public and cannot be edited later. Do not
                    include sensitive personal information. Your phone number is
                    used only as an internal identifier and is not shown
                    publicly.
                  </p>

                  <form
                  onSubmit={handleSubmit}
                  className="mt-3 space-y-3 text-sm"
                  noValidate>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label
                        htmlFor="reviewer_name"
                        className="block text-xs font-medium">

                          Your name
                        </label>
                        <Input
                        id="reviewer_name"
                        value={form.reviewer_name}
                        onChange={(e) =>
                        handleFormChange(
                          "reviewer_name",
                          e.target.value
                        )
                        }
                        placeholder="Name or alias"
                        required />

                        {nameError &&
                      <p className="text-[11px] text-destructive-foreground">
                            {nameError}
                          </p>
                      }
                      </div>
                      <div className="space-y-1">
                        <label
                        htmlFor="reviewer_phone"
                        className="block text-xs font-medium">

                          Your phone (temporary identifier, not shown
                          publicly)
                        </label>
                        <Input
                        id="reviewer_phone"
                        value={form.reviewer_phone}
                        onChange={(e) =>
                        handleFormChange(
                          "reviewer_phone",
                          e.target.value
                        )
                        }
                        placeholder="+1 (___) ___-____"
                        required />

                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                      htmlFor="rating"
                      className="block text-xs font-medium">

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
                      required />

                    </div>

                    <div className="space-y-1">
                      <label
                      htmlFor="body"
                      className="block text-xs font-medium" style={{ textDecoration: "none", fontWeight: "500" }}>Review • 


                    </label>
                      <Textarea
                      id="body"
                      value={form.body}
                      onChange={(e) =>
                      handleFormChange("body", e.target.value)
                      }
                      rows={4}
                      placeholder="Describe your experience. Avoid sharing passwords, account numbers, or other sensitive data."
                      required />

                    </div>

                    {submitError &&
                  <p className="text-xs text-destructive-foreground">
                        {submitError}
                      </p>
                  }

                    <div className="mt-2 rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      <p className="font-medium text-xs">Review guidelines:</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        <li>Be respectful and factual</li>
                        <li>Share your direct experience only</li>
                        <li>Avoid personal or sensitive information</li>
                      </ul>
                    </div>

                    <div className="mt-2 rounded-md bg-muted/30 p-2 text-[11px] text-muted-foreground">
                      <p className="font-medium text-xs">How reviews work</p>
                      <p className="mt-1">
                        Reviews are tied to a phone number to help reduce misuse (phone numbers are not
                        shown publicly).
                      </p>
                      <p className="mt-1">
                        Review frequency is limited to help prevent spam.
                      </p>
                      <p className="mt-1">
                        Status labels highlight patterns over time and may change as new reports come in.
                      </p>
                    </div>

                    <Button
                    type="submit"
                    size="sm"
                    disabled={submitting}
                    className="mt-2">

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
                      {reviews.map((review) => {
                        const phoneKey = review.reviewer_phone?.trim() || "";
                        let transparencyLabel:
                          | "First review"
                          | "Updated opinion"
                          | null = null;

                        if (phoneKey && reviewMeta[phoneKey]) {
                          const meta = reviewMeta[phoneKey];
                          if (meta.count > 0) {
                            if (review.created_at === meta.earliestCreatedAt) {
                              transparencyLabel = "First review";
                            } else {
                              transparencyLabel = "Updated opinion";
                            }
                          }
                        }

                        const isFlagged =
                          !!phoneKey && flaggedPhones.has(phoneKey);

                        return (
                          <div
                            key={review.id}
                            className="rounded-md border border-border/70 bg-background/70 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-medium">
                                  {review.reviewer_name?.trim() ||
                                    "Unnamed reviewer"}
                                </p>
                                {transparencyLabel && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {transparencyLabel}
                                  </p>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                Rating: {review.rating}/5
                              </p>
                            </div>
                            <p className="mt-1 text-muted-foreground">
                              {review.body}
                            </p>
                            {isFlagged && (
                              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                                This number has been reported in other cases.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div> :
          null}
        </div>
      </PublicLayout>
    </>);

};

export default BusinessDetailPage;