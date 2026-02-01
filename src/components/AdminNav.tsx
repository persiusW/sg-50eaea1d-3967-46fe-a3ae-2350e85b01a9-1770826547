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
      <div className="mx-auto flex w-full max-w-screen-xl items-center gap-4 px-4 sm:px-6 lg:px-8 py-3">
        <div className="shrink-0 text-sm font-semibold">
          <Link href="/admin/businesses" className="whitespace-nowrap">
            Transparent Turtle · Admin
          </Link>
        </div>
        <nav className="hidden flex-1 justify-end gap-3 text-xs sm:flex sm:text-sm">
          <Link
            href="/admin/businesses"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Businesses
          </Link>
          <Link
            href="/admin/reviews"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Reviews
          </Link>
          <Link
            href="/admin/flagged-numbers"
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Flagged Numbers
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="whitespace-nowrap text-muted-foreground hover:text-foreground"
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
          <nav className="flex flex-col gap-2">
            <Link
              href="/admin/businesses"
              onClick={closeMenu}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              Businesses
            </Link>
            <Link
              href="/admin/reviews"
              onClick={closeMenu}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              Reviews
            </Link>
            <Link
              href="/admin/flagged-numbers"
              onClick={closeMenu}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              Flagged Numbers
            </Link>
            <button
              type="button"
              onClick={async () => {
                closeMenu();
                await handleSignOut();
              }}
              className="text-left text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}