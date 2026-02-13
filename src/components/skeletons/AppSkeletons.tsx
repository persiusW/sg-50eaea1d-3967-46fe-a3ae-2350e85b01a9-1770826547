import React from "react";

interface ListSkeletonProps {
  count?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 10 }) => {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-md border border-border bg-background p-3 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 rounded-md bg-accent animate-pulse" />
                <div className="h-5 w-24 rounded-full rounded-md bg-accent animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                <div className="h-3 w-40 rounded-md bg-accent animate-pulse" />
                <div className="h-3 w-36 rounded-md bg-accent animate-pulse" />
              </div>
              <div className="h-4 w-48 rounded-md bg-accent animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
