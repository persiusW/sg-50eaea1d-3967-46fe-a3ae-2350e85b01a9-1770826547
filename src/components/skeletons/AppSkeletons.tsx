import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TableRowSkeletonProps {
  columns: number;
  rows?: number;
  widths?: string[];
}

export function TableRowSkeleton({ 
  columns, 
  rows = 6,
  widths 
}: TableRowSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border/60">
          {Array.from({ length: columns }).map((_, colIndex) => {
            const width = widths?.[colIndex] || "w-32";
            const isRightAligned = colIndex === columns - 1;
            return (
              <td key={colIndex} className={`py-2 px-3 ${isRightAligned ? "text-right" : ""}`}>
                <Skeleton className={`h-4 ${width}`} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

interface TableBodySkeletonProps {
  columns: number;
  rows?: number;
  widths?: string[];
}

export function TableBodySkeleton({ columns, rows = 6, widths }: TableBodySkeletonProps) {
  return <TableRowSkeleton columns={columns} rows={rows} widths={widths} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Skeleton className="h-3 w-24" />
      </p>
      <p className="mt-1 text-2xl font-semibold">
        <Skeleton className="h-8 w-16" />
      </p>
    </div>
  );
}

interface StatCardsGridSkeletonProps {
  count?: number;
}

export function StatCardsGridSkeleton({ count = 8 }: StatCardsGridSkeletonProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </section>
  );
}

export function BusinessCardSkeleton() {
  return (
    <div className="block rounded-lg border border-border bg-card p-4 text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface BusinessCardsGridSkeletonProps {
  count?: number;
}

export function BusinessCardsGridSkeleton({ count = 6 }: BusinessCardsGridSkeletonProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <BusinessCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="rounded-md border border-border/60 bg-background p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  );
}

interface ReviewCardsListSkeletonProps {
  count?: number;
}

export function ReviewCardsListSkeleton({ count = 5 }: ReviewCardsListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 6 }: ListSkeletonProps) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}
