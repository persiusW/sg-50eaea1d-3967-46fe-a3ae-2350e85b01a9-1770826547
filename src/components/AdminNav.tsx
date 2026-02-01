import React from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";

interface NavLink {
  href: string;
  label: string;
}

const links: NavLink[] = [
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/flagged-numbers", label: "Flagged Numbers" },
];

export const AdminNav: React.FC = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authService.signOut();
    router.replace("/admin/login");
  };

  return (
    <nav className="mb-4 flex flex-col gap-2 border-b border-border pb-3 pt-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => {
          const isActive = router.pathname === link.href;
          return (
            <button
              key={link.href}
              type="button"
              onClick={() => {
                if (!isActive) {
                  void router.push(link.href);
                }
              }}
              className={`rounded px-2 py-1 text-xs sm:text-sm ${
                isActive
                  ? "font-semibold text-primary underline underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </nav>
  );
};