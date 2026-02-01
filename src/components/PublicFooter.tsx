import React from "react";

export function PublicFooter(): JSX.Element {
  return (
    <footer className="border-t border-border bg-background/80">
      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
        <p className="mb-2" style={{ fontWeight: "800" }}>Transparent Turtle is a public review and reporting platform.


        </p>
        <p className="mb-2">Content is contributed by the community and reflects personal experiences.
We moderate submissions for safety and misuse, but do not guarantee accuracy.
Always exercise your own judgment when engaging with businesses or individuals.

        </p>
        <p className="text-[11px] sm:text-xs">
          © {new Date().getFullYear()} Transparent Turtle. All rights reserved.
        </p>
      </div>
    </footer>);

}