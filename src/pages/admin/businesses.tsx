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
import { AdminAuthSkeleton, AdminTableSkeleton } from "@/components/admin/AdminSkeletons";

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
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [form, setForm] = useState<BusinessFormState>({
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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [deleteIdToConfirm, setDeleteIdToConfirm] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

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
            try {
                const { data, error } = await supabase
                    .from("businesses")
                    .select("category");

                if (error) {
                    console.error("Failed to load categories:", error);
                    setCategoryOptions(TOP_CATEGORIES);
                    return;
                }

                const existing: string[] = data
                    ? Array.from(
                        new Set(
                            data
                                .map((row: { category: string | null }) => row.category?.trim())
                                .filter((c): c is string => !!c && c.length > 0),
                        ),
                    )
                    : [];

                const all = [...TOP_CATEGORIES, ...existing];

                const uniqueByLower = new Map<string, string>();
                for (const cat of all) {
                    const key = cat.toLowerCase();
                    if (!uniqueByLower.has(key)) {
                        uniqueByLower.set(key, cat);
                    }
                }

                setCategoryOptions(Array.from(uniqueByLower.values()));
            } catch (error) {
                console.error("Category load exception:", error);
                setCategoryOptions(TOP_CATEGORIES);
            }
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
        });
        setFormError(null);
    };

    const handleFormChange = (
        field: keyof BusinessFormState,
        value: string | boolean,
    ) => {
        setForm((prev) => ({ ...prev, [field]: value } as BusinessFormState));
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
            const message = "Name and phone are required.";
            setFormError(message);
            toast({
                title: "Missing required fields",
                description: message,
                variant: "destructive",
            });
            setSaving(false);
            return;
        }

        if (!categoryResolved) {
            const message =
                form.category === OTHER_VALUE
                    ? "Please specify a category."
                    : "Category is required.";
            setFormError(message);
            toast({
                title: "Category required",
                description: message,
                variant: "destructive",
            });
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
                .insert(payload);
            error = insertError;
        }

        if (error) {
            const message = "Failed to save business. Please try again.";
            setFormError(message);
            toast({
                title: "Save failed",
                description: message,
                variant: "destructive",
            });
            setSaving(false);
            return;
        }

        const wasEditing = Boolean(editingId);
        await fetchBusinessesPage(page);
        resetForm();
        toast({
            title: wasEditing ? "Business updated" : "Business created",
            description: "Your changes have been saved.",
        });
        setSaving(false);
    };

    const handleDelete = (id: string) => {
        setDeleteIdToConfirm(id);
    };
    const confirmDelete = async () => {
        const id = deleteIdToConfirm;
        if (!id) return;

        setDeletingId(id);

        const { error } = await supabase.from("businesses").delete().eq("id", id);

        setDeletingId(null);
        setDeleteIdToConfirm(null); // close immediately

        if (error) {
            toast({
                title: "Delete failed",
                description: error.message || "Could not delete business.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Business deleted",
                description: "The business was removed successfully.",
            });
            await fetchBusinessesPage(page);
        }

        setDeletingId(null);
        setDeleteIdToConfirm(null);
    };

    // const handleSignOut = async () => {
    //     await authService.signOut();
    //     router.replace("/admin/login");
    // };

    if (checkingAuth) {
        return (
            <>
                <SEO
                    title="Admin businesses – Transparent Turtle"
                    description="Manage businesses in the Transparent Turtle admin dashboard."
                />
                <AdminAuthSkeleton />
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
                                            value={form.branchesCount}
                                            onChange={(e) =>
                                                handleFormChange("branchesCount", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={form.category}
                                            onValueChange={(value: string) =>
                                                handleFormChange("category", value)
                                            }
                                        >
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categoryOptions.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value={OTHER_VALUE}>
                                                    Other
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.category === OTHER_VALUE && (
                                        <div className="space-y-1 sm:col-span-2">
                                            <Label htmlFor="customCategory">
                                                Specify category
                                            </Label>
                                            <Input
                                                id="customCategory"
                                                value={form.customCategory}
                                                onChange={(e) =>
                                                    handleFormChange(
                                                        "customCategory",
                                                        e.target.value,
                                                    )
                                                }
                                                maxLength={50}
                                                placeholder="e.g. Legal Services, Pet Store"
                                            />
                                            <p className="text-[11px] text-muted-foreground">
                                                If the category isn&apos;t listed, you can specify a
                                                short label (max 50 characters).
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-1 sm:col-span-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={form.status}
                                            onValueChange={(value: BusinessStatus | "__NONE__") =>
                                                handleFormChange("status", value === "__NONE__" ? "" : value)
                                            }
                                        >
                                            <SelectTrigger id="status">
                                                <SelectValue placeholder="No status (null) or select one" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__NONE__">
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
                                                <SelectItem value="SCAM">
                                                    Confirmed Scam
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="verified"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-border"
                                                checked={form.verified}
                                                onChange={(e) =>
                                                    handleFormChange("verified", e.target.checked)
                                                }
                                            />
                                            <Label htmlFor="verified">Verified</Label>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Admin-only flag. New businesses default to verified but can be turned off if needed.
                                        </p>
                                    </div>
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
                                        {loading && businesses.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-0">
                                                    <AdminTableSkeleton rows={8} cols={7} />
                                                </td>
                                            </tr>
                                        ) : businesses.length === 0 ? (
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
                                                            disabled={Boolean(deletingId)}
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

                            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((prev) =>
                                            prev > 1 && !loading ? prev - 1 : prev
                                        )
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
                                        setPage((prev) =>
                                            hasMore && !loading ? prev + 1 : prev
                                        )
                                    }
                                    disabled={!hasMore || loading}
                                    className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>

                            <p className="text-[11px] text-muted-foreground">
                                Deleting a business will also remove its reviews if your
                                database is configured with cascading deletes on the
                                reviews table.
                            </p>
                        </div>
                    </section>
                </div>
                <ConfirmDialog
                    isOpen={deleteIdToConfirm !== null}
                    onOpenChange={(open) => {
                        if (!open) setDeleteIdToConfirm(null);
                    }}
                    title="Delete Business"
                    description="Delete this business? This will also remove its reviews."
                    confirmText={deletingId ? "Deleting..." : "Delete"}
                    confirmDisabled={Boolean(deletingId)}
                    onConfirm={confirmDelete}
                />
            </main>
        </>
    );
};

export default AdminBusinessesPage;