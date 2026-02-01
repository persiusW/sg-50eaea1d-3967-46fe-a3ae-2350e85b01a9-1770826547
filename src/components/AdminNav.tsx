import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export function AdminNav(): JSX.Element {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const closeMenu = () => setOpen(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await router.push("/admin/login");
  };

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="shrink-0 text-sm font-semibold">
          <Link href="/admin" className="whitespace-nowrap">
            Transparent Turtle · Admin (NAV-TEST)
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-end gap-4 text-sm font-medium text-foreground/90 sm:flex">
          <Link href="/admin" className="whitespace-nowrap hover:text-primary">
            Overview
          </Link>
          <Link href="/admin/businesses" className="whitespace-nowrap hover:text-primary">
            Businesses
          </Link>
          <Link href="/admin/reviews" className="whitespace-nowrap hover:text-primary">
            Reviews
          </Link>
          <Link href="/admin/flagged-numbers" className="whitespace-nowrap hover:text-primary">
            Flagged numbers
          </Link>
          <Link href="/admin/reports" className="whitespace-nowrap hover:text-primary">
            Reports
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="whitespace-nowrap text-sm font-medium text-muted-foreground hover:text-destructive"
          >
            Sign out
          </button>
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
          <nav className="mt-4 flex flex-col gap-2 text-sm font-medium">
            <Link href="/admin" className="hover:text-primary">
              Overview
            </Link>
            <Link href="/admin/businesses" className="hover:text-primary">
              Businesses
            </Link>
            <Link href="/admin/reviews" className="hover:text-primary">
              Reviews
            </Link>
            <Link href="/admin/flagged-numbers" className="hover:text-primary">
              Flagged numbers
            </Link>
            <Link href="/admin/reports" className="hover:text-primary">
              Reports
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 text-left text-sm font-medium text-muted-foreground hover:text-destructive"
            >
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}