import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

type BusinessStatus =
  | "UNDER_REVIEW"
  | "MULTIPLE_REPORTS"
  | "PATTERN_MATCH_SCAM"
  | "VERIFIED";

interface Business {
  id: string;
  name: string;
  phone: string;
  location: string | null;
  branches_count: number | null;
  category: string;
  status: BusinessStatus | null;
  verified: boolean;
  created_at: string;
}

interface FormState {
  id?: string;
  name: string;
  phone: string;
  location: string;
  branches_count: string;
  category: string;
  status: BusinessStatus | "";
}

const statusLabel: Record<BusinessStatus, string> = {
  UNDER_REVIEW: "Under Review",
  MULTIPLE_REPORTS: "Multiple Independent Reports",
  PATTERN_MATCH_SCAM: "Pattern Match: Known Scam Method",
  VERIFIED: "Verified",
};

const AdminBusinessesPage: NextPage = () => {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    location: "",
    branches_count: "",
    category: "",
    status: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Simple auth guard: redirect unauthenticated users to /admin/login
  useEffect(() => {
    const checkAuth = async () => {
      const session = await authService.getCurrentSession();
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      setCheckingAuth(false);
    };
    void checkAuth();
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return;
    const fetchBusinesses = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("businesses")
        .select(
          "id,name,phone,location,branches_count,category,status,verified,created_at",
        )
        .order("created_at", { ascending: false });
      if (data) {
        setBusinesses(data as Business[]);
      }
      setLoading(false);
    };
    void fetchBusinesses();
  }, [checkingAuth]);

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      location: "",
      branches_count: "",
      category: "",
      status: "",
    });
    setEditingId(null);
    setFormError(null);
  };

  const startCreate = () => {
    resetForm();
  };

  const startEdit = (biz: Business) => {
    setEditingId(biz.id);
    setForm({
      id: biz.id,
      name: biz.name,
      phone: biz.phone,
      location: biz.location ?? "",
      branches_count: biz.branches_count
        ? String(biz.branches_count)
        : "",
      category: biz.category,
      status: biz.status ?? "",
    });
    setFormError(null);
  };

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const name = form.name.trim();
    const phone = form.phone.trim();
    const location = form.location.trim();
    const branchesStr = form.branches_count.trim();
    const category = form.category.trim();
    const status = form.status;

    if (!name || !phone || !category) {
      setFormError("Name, phone, and category are required.");
      setSaving(false);
      return;
    }

    const branchesCountNumber = branchesStr ? parseInt(branchesStr, 10) : null;

    const payload: Record<string, unknown> = {
      name,
      phone,
      location: location || null,
      branches_count: Number.isNaN(branchesCountNumber)
        ? null
        : branchesCountNumber,
      category,
      status: status || null,
      verified: true,
      created_by_admin: true,
    };

    let error = null;

    if (editingId) {
      const { error: updateError } = await supabase
        .from("businesses")
        .update(payload)
        .eq("id", editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("businesses")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      setFormError("Failed to save business. Please try again.");
      setSaving(false);
      return;
    }

    // Refresh list
    const { data } = await supabase
      .from("businesses")
      .select(
        "id,name,phone,location,branches_count,category,status,verified,created_at",
      )
      .order("created_at", { ascending: false });
    if (data) {
      setBusinesses(data as Business[]);
    }

    resetForm();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this business? This will also remove its reviews.",
    );
    if (!confirmed) return;

    setDeletingId(id);
    await supabase.from("businesses").delete().eq("id", id);

    const { data } = await supabase
      .from("businesses")
      .select(
        "id,name,phone,location,branches_count,category,status,verified,created_at",
      )
      .order("created_at", { ascending: false });
    if (data) {
      setBusinesses(data as Business[]);
    }
    setDeletingId(null);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    router.replace("/admin/login");
  };

  if (checkingAuth) {
    return (
      <>
        <SEO
          title="Admin businesses – Transparent Turtle"
          description="Manage businesses in the Transparent Turtle admin dashboard."
        />
        <main className="min-h-screen bg-background text-foreground">
          <div className="container flex min-h-screen items-center justify-center">
            <p className="text-sm text-muted-foreground">Checking access…</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Admin businesses – Transparent Turtle"
        description="Manage businesses in the Transparent Turtle admin dashboard."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Businesses (admin)
              </h1>
              <p className="text-sm text-muted-foreground">
                Create, edit, and delete businesses. All changes here are
                treated as verified and admin-created.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={startCreate}
              >
                New business
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="space-y-4 rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium">
                {editingId ? "Edit business" : "Create business"}
              </p>
              <p className="text-xs text-muted-foreground">
                Any business saved here will be marked as Verified and
                created by an admin. You can adjust the status at any time.
              </p>

              <form
                onSubmit={handleSave}
                className="mt-3 space-y-4 text-sm"
                noValidate
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) =>
                        handleFormChange("name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) =>
                        handleFormChange("phone", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) =>
                        handleFormChange("location", e.target.value)
                      }
                      placeholder="City, region, country"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="branches_count">Branches count</Label>
                    <Input
                      id="branches_count"
                      type="number"
                      min={1}
                      value={form.branches_count}
                      onChange={(e) =>
                        handleFormChange("branches_count", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={form.category}
                      onChange={(e) =>
                        handleFormChange("category", e.target.value)
                      }
                      placeholder="e.g. Logistics, Retail, Finance"
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value: BusinessStatus | "") =>
                        handleFormChange("status", value)
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="No status (null) or select one" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          No status (null)
                        </SelectItem>
                        <SelectItem value="UNDER_REVIEW">
                          Under Review
                        </SelectItem>
                        <SelectItem value="MULTIPLE_REPORTS">
                          Multiple Independent Reports
                        </SelectItem>
                        <SelectItem value="PATTERN_MATCH_SCAM">
                          Pattern Match: Known Scam Method
                        </SelectItem>
                        <SelectItem value="VERIFIED">
                          Verified
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-destructive-foreground">
                    {formError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving…"
                      : editingId
                      ? "Save changes"
                      : "Create business"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                    >
                      Cancel edit
                    </Button>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">All businesses</p>
                {loading && (
                  <p className="text-xs text-muted-foreground">
                    Loading…
                  </p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Verified</th>
                      <th className="py-2 pl-3 text-right">
                        Created at
                      </th>
                      <th className="py-2 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-4 text-center text-xs text-muted-foreground"
                        >
                          No businesses yet.
                        </td>
                      </tr>
                    ) : (
                      businesses.map((biz) => (
                        <tr
                          key={biz.id}
                          className="border-b border-border/60"
                        >
                          <td className="py-2 pr-3 font-medium">
                            {biz.name}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {biz.phone}
                          </td>
                          <td className="py-2 px-3">
                            {biz.category}
                          </td>
                          <td className="py-2 px-3">
                            {biz.status
                              ? statusLabel[biz.status] ?? biz.status
                              : "—"}
                          </td>
                          <td className="py-2 px-3">
                            {biz.verified ? "Yes" : "No"}
                          </td>
                          <td className="py-2 pl-3 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                            {new Date(
                              biz.created_at,
                            ).toLocaleDateString()}
                          </td>
                          <td className="py-2 pl-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => startEdit(biz)}
                              className="mr-2 text-xs text-primary hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(biz.id)}
                              className="text-xs text-destructive-foreground hover:underline disabled:opacity-50"
                              disabled={deletingId === biz.id}
                            >
                              {deletingId === biz.id
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Deleting a business will also remove its reviews if your
                database is configured with cascading deletes on the
                reviews table.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminBusinessesPage;