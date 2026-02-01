import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

interface FlaggedNumber {
  id: string;
  phone: string;
  name_on_number: string | null;
  connected_scam: string | null;
  admin_note: string | null;
  verified: boolean;
  created_at: string;
}

interface FlaggedFormState {
  id?: string;
  phone: string;
  name_on_number: string;
  connected_scam: string;
  admin_note: string;
}

const AdminFlaggedNumbersPage: NextPage = () => {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [flagged, setFlagged] = useState<FlaggedNumber[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FlaggedFormState>({
    phone: "",
    name_on_number: "",
    connected_scam: "",
    admin_note: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const fetchFlagged = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("flagged_numbers")
        .select(
          "id,phone,name_on_number,connected_scam,admin_note,verified,created_at"
        )
        .order("created_at", { ascending: false });

      if (data) {
        setFlagged(data as FlaggedNumber[]);
      }
      setLoading(false);
    };

    void fetchFlagged();
  }, [checkingAuth]);

  const resetForm = () => {
    setForm({
      phone: "",
      name_on_number: "",
      connected_scam: "",
      admin_note: "",
    });
    setEditingId(null);
    setFormError(null);
  };

  const startCreate = () => {
    resetForm();
  };

  const startEdit = (item: FlaggedNumber) => {
    setEditingId(item.id);
    setForm({
      id: item.id,
      phone: item.phone,
      name_on_number: item.name_on_number ?? "",
      connected_scam: item.connected_scam ?? "",
      admin_note: item.admin_note ?? "",
    });
    setFormError(null);
  };

  const handleFormChange = (
    field: keyof FlaggedFormState,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const phone = form.phone.trim();
    const name = form.name_on_number.trim();
    const scam = form.connected_scam.trim();
    const note = form.admin_note.trim();

    if (!phone) {
      setFormError("Phone number is required.");
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      phone,
      name_on_number: name || null,
      connected_scam: scam || null,
      admin_note: note || null,
      verified: true,
    };

    let error = null;

    if (editingId) {
      const { error: updateError } = await supabase
        .from("flagged_numbers")
        .update(payload)
        .eq("id", editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("flagged_numbers")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      setFormError("Failed to save flagged number. Please try again.");
      setSaving(false);
      return;
    }

    const { data } = await supabase
      .from("flagged_numbers")
      .select(
        "id,phone,name_on_number,connected_scam,admin_note,verified,created_at"
      )
      .order("created_at", { ascending: false });

    if (data) {
      setFlagged(data as FlaggedNumber[]);
    }

    resetForm();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this flagged number? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(id);
    await supabase.from("flagged_numbers").delete().eq("id", id);

    const { data } = await supabase
      .from("flagged_numbers")
      .select(
        "id,phone,name_on_number,connected_scam,admin_note,verified,created_at"
      )
      .order("created_at", { ascending: false });

    if (data) {
      setFlagged(data as FlaggedNumber[]);
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
          title="Admin flagged numbers – Transparent Turtle"
          description="Manage flagged numbers in the Transparent Turtle admin dashboard."
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
        title="Admin flagged numbers – Transparent Turtle"
        description="Manage flagged numbers in the Transparent Turtle admin dashboard."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Flagged numbers (admin)
              </h1>
              <p className="text-sm text-muted-foreground">
                Add, edit, and delete flagged numbers. All entries here are
                treated as verified and admin-created. Admin notes are not
                shown on the public page.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/businesses")}
              >
                Businesses
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/reviews")}
              >
                Reviews
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
                {editingId ? "Edit flagged number" : "Create flagged number"}
              </p>
              <p className="text-xs text-muted-foreground">
                All flagged numbers created or edited here will be marked as
                verified. Admin notes are for internal context only.
              </p>

              <form
                onSubmit={handleSave}
                className="mt-3 space-y-4 text-sm"
                noValidate
              >
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone number</Label>
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
                  <Label htmlFor="name_on_number">Name on number</Label>
                  <Input
                    id="name_on_number"
                    value={form.name_on_number}
                    onChange={(e) =>
                      handleFormChange("name_on_number", e.target.value)
                    }
                    placeholder="e.g. John Doe, 'Support Line', etc."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="connected_scam">
                    Connected scam/page
                  </Label>
                  <Input
                    id="connected_scam"
                    value={form.connected_scam}
                    onChange={(e) =>
                      handleFormChange("connected_scam", e.target.value)
                    }
                    placeholder="e.g. 'Phishing bank calls', case ID, URL"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admin_note">Admin note</Label>
                  <Textarea
                    id="admin_note"
                    value={form.admin_note}
                    onChange={(e) =>
                      handleFormChange("admin_note", e.target.value)
                    }
                    placeholder="Internal context for admins only. Not shown publicly."
                    rows={4}
                  />
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
                      : "Create flagged number"}
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
                <p className="text-sm font-medium">All flagged numbers</p>
                {loading && (
                  <p className="text-xs text-muted-foreground">
                    Loading…
                  </p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Phone number</th>
                      <th className="py-2 px-3">Name on number</th>
                      <th className="py-2 px-3">Connected scam/page</th>
                      <th className="py-2 px-3">Verified</th>
                      <th className="py-2 px-3 text-right">
                        Created at
                      </th>
                      <th className="py-2 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flagged.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-4 text-center text-xs text-muted-foreground"
                        >
                          No flagged numbers yet.
                        </td>
                      </tr>
                    ) : (
                      flagged.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/60 align-top"
                        >
                          <td className="py-2 pr-3 font-medium">
                            {item.phone}
                          </td>
                          <td className="py-2 px-3">
                            {item.name_on_number || "—"}
                          </td>
                          <td className="py-2 px-3">
                            {item.connected_scam || "—"}
                          </td>
                          <td className="py-2 px-3">
                            {item.verified ? "Yes" : "No"}
                          </td>
                          <td className="py-2 px-3 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                            {new Date(
                              item.created_at
                            ).toLocaleString()}
                          </td>
                          <td className="py-2 pl-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="mr-2 text-xs text-primary hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="text-xs text-destructive-foreground hover:underline disabled:opacity-50"
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id
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
                This list powers the public flagged numbers page. Admin notes
                are only visible here in the dashboard and are not shown
                publicly.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminFlaggedNumbersPage;