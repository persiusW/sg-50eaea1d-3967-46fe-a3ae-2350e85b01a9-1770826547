import React from "react";

export function PublicFooter(): JSX.Element {
  return (
    <footer className="border-t border-border bg-background/80">
      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
        <p className="mb-2">
          Transparent Turtle is a public accountability project. It does not
          replace law enforcement, financial regulators, or your own judgment.
        </p>
        <p className="mb-2">
          Information on this site is contributed by the public and may be
          incomplete or out of date. Always verify details independently before
          sending money or sharing sensitive information.
        </p>
        <p className="text-[11px] sm:text-xs">
          © {new Date().getFullYear()} Transparent Turtle. All rights reserved.
        </p>
      </div>
    </footer>
  );
}