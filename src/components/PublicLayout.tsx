import React from "react";
import { PublicNav } from "./PublicNav";
import { PublicFooter } from "./PublicFooter";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicNav />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}