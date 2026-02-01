import React from "react";
import Link from "next/link";

export interface BusinessSummaryCardProps {
  id: string;
  name: string;
  phone: string;
  category: string | null;
  verified: boolean;
  status: string | null;
  avgRating: number | null;
  reviewsCount: number | null;
  location?: string | null;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: "⚠️ Under Review",
  MULTIPLE_REPORTS: "🚩 Multiple Independent Reports",
  PATTERN_MATCH_SCAM: "❗ Pattern Match: Known Scam Method",
  SCAM: "⛔ Confirmed Scam",
};

export function BusinessSummaryCard({
  id,
  name,
  phone,
  category,
  verified,
  status,
  avgRating,
  reviewsCount,
  location,
  className,
}: BusinessSummaryCardProps) {
  const normalizedStatus = status ?? "";
  const hasRiskStatus = Boolean(STATUS_LABELS[normalizedStatus]);

  const showRating =
    !hasRiskStatus && avgRating !== null && reviewsCount !== null && reviewsCount > 0;

  return (
    <Link
      href={`/businesses/${id}`}
      className={`block rounded-lg border border-border bg-card p-4 text-sm transition-colors hover:border-primary/60 ${className ?? ""}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold">{name}</h2>
            {verified && (
              <span className="inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Verified
              </span>
            )}
            {hasRiskStatus && (
              <span className="inline-flex items-center rounded-full border border-amber-500/60 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200">
                {STATUS_LABELS[normalizedStatus]}
              </span>
            )}
            {!hasRiskStatus && showRating && (
              <span className="inline-flex items-center rounded-full border border-muted-foreground/40 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                ⭐ {avgRating?.toFixed(1)} · {reviewsCount} review
                {reviewsCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="truncate">{phone}</span>
            {category && (
              <span className="truncate">
                Category: <span className="font-medium text-foreground">{category}</span>
              </span>
            )}
            {location && (
              <span className="truncate">
                Location: <span className="font-medium text-foreground">{location}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}