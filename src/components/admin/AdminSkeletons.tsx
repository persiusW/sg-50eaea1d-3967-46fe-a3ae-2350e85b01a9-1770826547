import { Skeleton } from "@/components/ui/skeleton";

export function AdminAuthSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

interface AdminTableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function AdminTableSkeleton({ rows = 8, cols = 7 }: AdminTableSkeletonProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-2 px-3 text-left">
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border/60 last:border-0">
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex} className="py-3 px-3">
                    <Skeleton
                      className={`h-4 ${
                        colIndex === 0 ? "w-24" : colIndex === cols - 1 ? "w-16" : "w-20"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

export function AdminReviewCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-md border border-border bg-background p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface AdminReportRowSkeletonProps {
  rows?: number;
}

export function AdminReportRowSkeleton({ rows = 8 }: AdminReportRowSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border/60 last:border-0">
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-3 py-2">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-7 w-32" />
          </td>
          <td className="px-3 py-2 text-right">
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-20" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
