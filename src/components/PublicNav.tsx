import React from "react";
import Link from "next/link";

export function PublicNav(): JSX.Element {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Transparent Turtle
        </Link>
        <nav className="flex items-center gap-4 text-xs sm:text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Home
          </Link>
          <Link
            href="/businesses"
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Search
          </Link>
          <Link
            href="/businesses/add"
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Add business
          </Link>
          <Link
            href="/flagged-numbers"
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Flagged numbers
          </Link>
        </nav>
      </div>
    </header>
  );
}