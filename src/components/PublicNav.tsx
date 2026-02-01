import React, { useState } from "react";
import Link from "next/link";

export function PublicNav(): JSX.Element {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-screen-xl items-center gap-4 px-4 sm:px-6 lg:px-8 py-3">
        <div className="shrink-0 text-sm font-semibold">
          <Link href="/" className="whitespace-nowrap">
            Transparent Turtle
          </Link>
        </div>
        <nav className="hidden flex-1 justify-end gap-3 text-xs sm:flex sm:text-sm">
          <Link
            href="/"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/businesses"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Search
          </Link>
          <Link
            href="/businesses/add"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Add business
          </Link>
          <Link
            href="/flagged-numbers"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Flagged numbers
          </Link>
          <Link
            href="/report"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Report
          </Link>
        </nav>
        <button
          type="button"
          className="ml-auto inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground sm:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          Menu
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-4 pb-3 pt-2 text-sm sm:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={closeMenu}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/businesses"
              onClick={closeMenu}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              Search
            </Link>
            <Link
              href="/businesses/add"
              onClick={closeMenu}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              Add business
            </Link>
            <Link
              href="/flagged-numbers"
              onClick={closeMenu}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              Flagged numbers
            </Link>
            <Link
              href="/report"
              onClick={closeMenu}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              Report
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}