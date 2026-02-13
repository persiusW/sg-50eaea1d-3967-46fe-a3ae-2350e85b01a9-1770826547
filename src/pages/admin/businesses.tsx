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
import { AdminNav } from "@/components/AdminNav";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
const TOP_CATEGORIES: string[] = [
    "Restaurant",
    "Fast Food Restaurant",
    "Cafe",
    "Bakery",
    "Bar / Lounge",
    "Hotel",
    "Grocery Store",
    "Supermarket",
    "Pharmacy",
    "Hospital / Clinic",
    "Dentist",
    "Beauty Salon",
    "Hair Salon / Barber",
    "Gym / Fitness Center",
    "School / Training Center",
    "Bank",
    "ATM",
    "Gas Station",
    "Car Repair / Auto Service",
    "Electronics Store",
    "Clothing Store",
    "Hardware Store",
    "Shopping Mall / Retail Center",
    "Real Estate Agency",
    "Logistics / Delivery Service",
];
const OTHER_VALUE = "__OTHER__";
const PLATFORM_OPTIONS = ["Instagram", "WhatsApp", "Facebook", "TikTok", "Website"];
function normalizePhone(s: string): string {
    const trimmed = s.trim();
    if (!trimmed) return "";
    return trimmed.replace(/[^\d+]/g, "");
}
type BusinessStatus =
    | "UNDER_REVIEW"
    | "MULTIPLE_REPORTS"
    | "PATTERN_MATCH_SCAM"
    | "VERIFIED"
    | "SCAM";
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
    platforms: string[] | null;
}
interface BusinessRow {
    id: string;
    name: string;
    phone: string;
    location: string | null;
    category: string | null;
    branches_count: number | null;
    status: BusinessStatus | null;
    verified: boolean;
    created_by_admin: boolean | null;
    platforms: string[] | null;
    created_at: string;
}
interface BusinessFormState {
    name: string;
    phone: string;
    location: string;
    branchesCount: string;
    category: string;
    status: BusinessStatus | "";
    verified: boolean;
    createdByAdmin: boolean;
    platforms: string[];
    otherPlatform: string;
    customCategory: string;
}
const statusLabel: Record<BusinessStatus, string> = {
    UNDER_REVIEW: "Under Review",
    MULTIPLE_REPORTS: "Multiple Independent Reports",
    PATTERN_MATCH_SCAM: "Pattern Match: Known Scam Method",
    VERIFIED: "Verified",
    SCAM: "Confirmed Scam",
};
const PAGE_SIZE = 25;
const AdminBusinessesPage: NextPage = () => {
    const router = useRouter();
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [businesses, setBusinesses] = useState < Business[] > ([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState < BusinessFormState > ({
        name: "",
        phone: "",
        location: "",
        branchesCount: "",
        category: "",
        status: "",
        verified: false,
        createdByAdmin: true,
        platforms: [],
        otherPlatform: "",
        customCategory: "",
    });
    const [editingId, setEditingId] = useState < string | null > (null);
    const [formError, setFormError] = useState < string | null > (null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState < string | null > (null);
    const [deleteIdToConfirm, setDeleteIdToConfirm] = useState < string | null > (null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState < string[] > ([]);
    const { toast } = useToast();
    const handlePlatformToggle = (platform: string) => {
        setForm((prev) => {
            const exists = prev.platforms.includes(platform);
            return {
                ...prev,
                platforms: exists
                    ? prev.platforms.filter((p) => p !== platform)
                    : [...prev.platforms, platform],
            };
        });
    };
    const handleOtherPlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, otherPlatform: e.target.value }));
    };
    const buildPlatformsPayload = () => {
        const base = form.platforms;
        const trimmedOther = form.otherPlatform.trim();
        const all = trimmedOther.length > 0 ? [...base, trimmedOther] : base;
        return all.length > 0 ? all : null;
    };
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
    const fetchBusinessesPage = async (pageToLoad: number) => {
        setLoading(true);
        const from = (pageToLoad - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await supabase
            .from("businesses")
            .select(
                "id,name,phone,location,branches_count,category,status,verified,created_at",
            )
            .order("created_at", { ascending: false })
            .range(from, to);
        if (!error && data) {
            setBusinesses(data as Business[]);
            setHasMore(data.length === PAGE_SIZE);
        } else {
            setBusinesses([]);
            setHasMore(false);
        }
        setLoading(false);
    };
    useEffect(() => {
        const loadCategories = async () => {
            const { data, error } = await supabase
                .from("businesses")
                .select("category");
            const existing: string[] = !error && data
                ? Array.from(
                    new Set(
                        (data as { category: string | null }[])
                            .map((row) => row.category?.trim())
                            .filter((c): c is string => !!c && c.length > 0)
                    ),
                )
        )
      : [];
const all = [...TOP_CATEGORIES, ...existing];
const uniqueByLower = new Map < string, string> ();
for (const cat of all) {
    const key = cat.toLowerCase();
    if (!uniqueByLower.has(key)) {
        uniqueByLower.set(key, cat);
    }
}
setCategoryOptions(Array.from(uniqueByLower.values()));
    };
void loadCategories();
  }, []);
useEffect(() => {
    if (checkingAuth) return;
    void fetchBusinessesPage(page);
}, [checkingAuth, page]);
const resetForm = () => {
    setForm({
        name: "",
        phone: "",
        location: "",
        branchesCount: "",
        category: "",
        status: "",
        verified: false,
        createdByAdmin: true,
        platforms: [],
        otherPlatform: "",
        customCategory: "",
    });
    setEditingId(null);
    setFormError(null);
};
const startCreate = () => {
    resetForm();
};
const startEdit = (biz: Business) => {
    setEditingId(biz.id);
    const matchedCategory = categoryOptions.find(
        (opt) => opt.toLowerCase() === (biz.category || "").toLowerCase(),
    );
    setForm({
        name: biz.name,
        phone: biz.phone,
        location: biz.location ?? "",
        branchesCount: biz.branches_count ? String(biz.branches_count) : "",
        category: matchedCategory || OTHER_VALUE,
        customCategory: matchedCategory ? "" : biz.category || "",
        status: biz.status ?? "",
        verified: biz.verified,
        createdByAdmin: true,
        platforms: biz.platforms ?? [],
        otherPlatform: "",
        setFormError(null);
    };
    const handleFormChange = (
        field: keyof BusinessFormState,
        value: string | boolean,
    ) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const resolveCategory = (): string | null => {
        if (form.category === OTHER_VALUE) {
            const trimmed = form.customCategory.trim();
            if (!trimmed) return null;
            if (trimmed.length > 50) {
                return trimmed.slice(0, 50);
            }
            return trimmed;
        }
        const trimmed = form.category.trim();
        return trimmed || null;
    };
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError(null);
        const name = form.name.trim();
        const phoneRaw = form.phone.trim();
        const phone = normalizePhone(phoneRaw);
        const location = form.location.trim();
        const branchesStr = form.branchesCount.trim();
        const status = form.status;
        const verified = form.verified;
        const categoryResolved = resolveCategory();
        if (!name || !phone) {
            setFormError("Name and phone are required.");
            setSaving(false);
            return;
        }
        if (!categoryResolved) {
            setFormError(
                form.category === OTHER_VALUE
                    ? "Please specify a category."
                    : "Category is required.",
            );
            setSaving(false);
            return;
        }
        const branchesCountNumber = branchesStr
            ? Number.parseInt(branchesStr, 10)
            : null;
        const platformsPayload = buildPlatformsPayload();
        const payload: Record<string, unknown> = {
            name,
            phone,
            location: location || null,
            branches_count: Number.isNaN(branchesCountNumber)
                ? null
                : branchesCountNumber,
            category: categoryResolved,
            status: status || null,
            verified,
            created_by_admin: true,
            platforms: platformsPayload,
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
                .insert([payload]);
            error = insertError;
        }
        if (error) {
            setFormError("Failed to save business. Please try again.");
            setSaving(false);
            return;
        }
        toast({
            title: "Success!",
            description: editingId ? "Business updated successfully." : "Business created successfully.",
        });
        await fetchBusinessesPage(page);
        resetForm();
        setSaving(false);
    };
    const handleDelete = (id: string) => {
        setDeleteIdToConfirm(id);
    };
    const confirmDelete = async (id: string) => {
        setDeletingId(id);
        const { error } = await supabase.from("businesses").delete().eq("id", id);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to delete business. Please try again.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success!",
                description: "Business deleted successfully.",
            });
        }

        await fetchBusinessesPage(page);
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
                    <AdminNav />
                    <header className="space-y-1">
                        <h1 className="text-xl font-semibold tracking-tight">Businesses (admin)</h1>
                        <p className="text-sm text-muted-foreground">
                            Add, edit, or remove businesses.
                        </p>
                    </header>
                    <section className="grid gap-6 md:grid-cols-[minmax(0,2.5fr)_minmax(0,3fr)]">
                        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
                            <form
                                onSubmit={handleSave}
                                className="space-y-4"
                            >
                                <h2 className="text-sm font-semibold">
                                    {editingId ? "Edit business" : "Add new business"}
                                </h2>
                                {formError && (
                                    <p className="text-xs text-destructive-foreground">
                                        {formError}
                                    </p>
                                )}
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="name">Business name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, name: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="phone">Phone number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, phone: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="location">Location (optional)</Label>
                                        <Input
                                            id="location"
                                            type="text"
                                            value={form.location}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, location: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="branchesCount">
                                            Number of branches (optional)
                                        </Label>
                                        <Input
                                            id="branchesCount"
                                            type="number"
                                            min="0"
                                            value={form.branchesCount}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    branchesCount: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={form.category}
                                            onValueChange={(value) =>
                                                setForm((prev) => ({ ...prev, category: value ?? "" }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categoryOptions.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.category === OTHER_VALUE && (
                                            <Input
                                                type="text"
                                                placeholder="Enter category name"
                                                value={form.customCategory}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        customCategory: e.target.value,
                                                    }))
                                                }
                                                required
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status (optional)</Label>
                                        <Select
                                            value={form.status}
                                            onValueChange={(value) =>
                                                setForm((prev) => ({ ...prev, status: value ?? "" }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">No status</SelectItem>
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
                                                <SelectItem value="SCAM">
                                                    Confirmed Scam
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label
                                            htmlFor="verified"
                                            className="flex-shrink-0"
                                        >
                                            Verified
                                        </Label>
                                        <input
                                            id="verified"
                                            type="checkbox"
                                            checked={form.verified}
                                            onChange={(e) =>
                                                setForm((prev) => ({ ...prev, verified: e.target.checked }))
                                            }
                                            className="h-4 w-4 accent-emerald-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-foreground">
                                            Platforms involved (optional)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {PLATFORM_OPTIONS.map((platform) => (
                                                <label
                                                    key={platform}
                                                    className="flex items-center gap-1 text-xs text-foreground"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="h-3 w-3"
                                                        checked={form.platforms.includes(platform)}
                                                        onChange={() => handlePlatformToggle(platform)}
                                                    />
                                                    <span>{platform}</span>
                                                </label>
                                            ))}
                                            <label
                                                className="flex items-center gap-1 text-xs text-foreground"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-3 w-3"
                                                    checked={form.platforms.includes("Other")}
                                                    onChange={() => handlePlatformToggle("Other")}
                                                />
                                                <span>Other</span>
                                            </label>
                                        </div>
                                        {form.platforms.includes("Other") && (
                                            <input
                                                type="text"
                                                className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                placeholder="Specify platform"
                                                value={form.otherPlatform}
                                                onChange={handleOtherPlatformChange}
                                            />
                                        )}
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
                                                    <td
                                                        className="py-2 pl-3 text-right text-[11px] text-muted-foreground whitespace-nowrap"
                                                    >
                                                        {new Date(biz.created_at).toLocaleDateString()}
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
                                                            {deletingId === biz.id ? "Deleting…" : "Delete"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((prev) => (prev > 1 && !loading ? prev - 1 : prev))
                                    }
                                    disabled={page === 1 || loading}
                                    className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <p className="text-[11px] text-muted-foreground">
                                    Page {page}
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((prev) => (hasMore && !loading ? prev + 1 : prev))
                                    }
                                    disabled={!hasMore || loading}
                                    className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Deleting a business will also remove its reviews if your database is
                                configured with cascading deletes on reviews table.
                            </p>
                        </div>
                </div>
            </section>
        </div >
      </main >
    <ConfirmDialog
        isOpen={deleteIdToConfirm !== null}
        onOpenChange={(open) => !open && setDeleteIdToConfirm(null)}
        title="Delete Business"
        description="Delete this business? This will also remove its reviews."
        onConfirm={() => {
            const id = deleteIdToConfirm;
            setDeleteIdToConfirm(null);
            if (id) confirmDelete(id);
        }}
    />
    </>
  );
};
export default AdminBusinessesPage;