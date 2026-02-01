import React, { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";

const AdminLoginPage: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const session = await authService.getCurrentSession();
      if (session) {
        router.replace("/admin/businesses");
      }
    };
    void checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Email and password are required.");
      setSubmitting(false);
      return;
    }

    const { user, error: signInError } = await authService.signIn(
      trimmedEmail,
      trimmedPassword,
    );

    if (signInError || !user) {
      setError(signInError?.message || "Invalid credentials.");
      setSubmitting(false);
      return;
    }

    router.replace("/admin/businesses");
  };

  return (
    <>
      <SEO
        title="Admin login – Transparent Turtle"
        description="Sign in to the Transparent Turtle admin dashboard."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen items-center justify-center py-8">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold tracking-tight">
              Admin login
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Restricted area. Only authorized admins may sign in.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-4 text-sm"
              noValidate
            >
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-destructive-foreground">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-4 text-xs text-muted-foreground">
              Public users do not need an account. This login is only for
              moderation and data stewardship.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminLoginPage;