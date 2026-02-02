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
import { PublicLayout } from "@/components/PublicLayout";

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

const PLATFORM_OPTIONS = ["Instagram", "WhatsApp", "Facebook", "TikTok", "Website"];

function normalizePhone(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return "";
  return trimmed.replace(/[^\d+]/g, "");
}

type FormState = {
  name: string;
  phone: string;
  location: string;
  branchesCount: string;
  category: string; // holds either a predefined category or "__OTHER__"
  customCategory: string;
  platforms: string[];
  otherPlatform: string;
};

const OTHER_VALUE = "__OTHER__";

const AddBusinessPage: NextPage = () => {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    location: "",
    branchesCount: "",
    category: "",
    customCategory: "",
    platforms: [],
    otherPlatform: "",
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    const loadCategories = async () => {
      setLoadingCategories(true);

      const { data, error } = await supabase
        .from("businesses")
        .select("category");

      const existing: string[] = !error && data
        ? Array.from(
            new Set(
              (data as { category: string | null }[])
                .map((row) => row.category?.trim())
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

      setCategories(Array.from(uniqueByLower.values()));
      setLoadingCategories(false);
    };

    void loadCategories();
  }, []);

  const handleChange = (field: keyof FormState, value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const name = form.name.trim();
    const phoneRaw = form.phone.trim();
    const phone = normalizePhone(phoneRaw);
    const location = form.location.trim();
    const branchesStr = form.branchesCount.trim();
    const categoryResolved = resolveCategory();
    const platforms = buildPlatformsPayload();

    if (!name || !phone) {
      setFormError("Name and phone are required.");
      setSubmitting(false);
      return;
    }

    if (!categoryResolved) {
      setFormError(
        form.category === OTHER_VALUE
          ? "Please specify a category."
          : "Category is required.",
      );
      setSubmitting(false);
      return;
    }

    const branchesCountNumber = branchesStr
      ? Number.parseInt(branchesStr, 10)
      : null;

    const { data: existing, error: existingError } = await supabase
      .from("businesses")
      .select("id")
      .eq("phone", phone);

    if (!existingError && existing && existing.length > 0) {
      const existingId = existing[0]?.id as string | undefined;
      if (existingId) {
        void router.push(`/businesses/${existingId}`);
        setSubmitting(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        name,
        phone,
        location: location || null,
        branches_count: Number.isNaN(branchesCountNumber)
          ? null
          : branchesCountNumber,
        category: categoryResolved,
        verified: false,
        created_by_admin: false,
        platforms,
      })
      .select("id")
      .maybeSingle();

    if (error || !data?.id) {
      setFormError("Failed to add business. Please try again.");
      setSubmitting(false);
      return;
    }

    void router.push(`/businesses/${data.id as string}`);
    setSubmitting(false);
  };

  const isOtherSelected = form.category === OTHER_VALUE;

  return (
    <>
      <SEO
        title="Add business – Transparent Turtle"
        description="Add a business to Transparent Turtle."
      />
      <PublicLayout>
        <div className="container flex min-h-screen flex-col gap-8 py-8">
          <header className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Add a business
            </h1>
            <p className="text-sm text-muted-foreground">
              Check if the business already exists as you type. If it does,
              you&apos;ll be redirected to its page instead of creating a
              duplicate.
            </p>
          </header>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-4 rounded-lg border border-border bg-card p-4">
              <form
                onSubmit={handleSubmit}
                className="space-y-4 text-sm"
                noValidate
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) =>
                        handleChange("name", e.target.value)
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
                        handleChange("phone", e.target.value)
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
                        handleChange("location", e.target.value)
                      }
                      placeholder="City, region, country"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="branches">Number of branches</Label>
                    <Input
                      id="branches"
                      type="number"
                      min={1}
                      value={form.branchesCount}
                      onChange={(e) =>
                        handleChange("branchesCount", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        handleChange("category", value)
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue
                          placeholder={
                            loadingCategories
                              ? "Loading categories…"
                              : "Select a category"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
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

                  {isOtherSelected && (
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="customCategory">
                        Specify category
                      </Label>
                      <Input
                        id="customCategory"
                        value={form.customCategory}
                        onChange={(e) =>
                          handleChange("customCategory", e.target.value)
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

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
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
                      <label className="flex items-center gap-1 text-xs text-foreground">
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
                </div>

                {formError && (
                  <p className="text-xs text-destructive-foreground">
                    {formError}
                  </p>
                )}

                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Add business"}
                </Button>
              </form>
            </div>

            {/* existing live search / suggestion panel remains unchanged */}
          </section>
        </div>
      </PublicLayout>
    </>
  );
};

export default AddBusinessPage;
