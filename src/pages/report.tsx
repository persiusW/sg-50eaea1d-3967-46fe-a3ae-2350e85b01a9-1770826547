import React, { useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/components/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ReportType = "PHONE" | "BUSINESS";

interface ReportFormState {
  report_type: ReportType;
  phone: string;
  connected_page: string;
  name_on_number: string;
  platform: string;
  description: string;
  evidence_url: string;
  business_location: string;
  business_category: string;
  business_category_other: string;
  submitter_name: string;
  submitter_phone: string;
  business_type: string;
  business_type_other: string;
  platforms: string[];
  platform_other: string;
}

const COMMON_CATEGORIES: string[] = [
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

const PLATFORM_OPTIONS = [
  "Instagram",
  "WhatsApp",
  "Facebook",
  "TikTok",
  "Website",
  "Other",
] as const;
type PlatformOption = (typeof PLATFORM_OPTIONS)[number];

const ReportPage: NextPage = () => {
  const [form, setForm] = useState<ReportFormState>({
    report_type: "PHONE",
    phone: "",
    connected_page: "",
    name_on_number: "",
    platform: "",
    description: "",
    evidence_url: "",
    business_location: "",
    business_category: "",
    business_category_other: "",
    submitter_name: "",
    submitter_phone: "",
    business_type: "",
    business_type_other: "",
    platforms: [],
    platform_other: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("category")
        .not("category", "is", null);

      if (error || !data) {
        setDbCategories([]);
        return;
      }

      const values = Array.from(
        new Set(
          (data as { category: string | null }[])
            .map((row) => row.category?.trim())
            .filter((c): c is string => !!c && c.length > 0),
        ),
      );
      setDbCategories(values);
    };

    void loadCategories();
  }, []);

  const mergedCategories: string[] = useMemo(() => {
    const set = new Set<string>();

    COMMON_CATEGORIES.forEach((c) => {
      if (c.trim().length > 0) {
        set.add(c.trim());
      }
    });

    dbCategories.forEach((c) => {
      const trimmed = c.trim();
      if (trimmed.length > 0) {
        set.add(trimmed);
      }
    });

    // ensure 'Other' exists exactly once at the end
    set.delete("Other");
    const base = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [...base, "Other"];
  }, [dbCategories]);

  const handlePlatformToggle = (option: PlatformOption) => {
    setForm((prev) => {
      const exists = prev.platforms.includes(option);
      const next = exists
        ? prev.platforms.filter((p) => p !== option)
        : [...prev.platforms, option];
      return { ...prev, platforms: next };
    });
  };

  const handleChange = (field: keyof ReportFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "report_type") {
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const locationToStore =
      form.business_location.trim().length > 0
        ? form.business_location.trim()
        : null;

    const selectedPlatforms = [...form.platforms];
    if (
      selectedPlatforms.includes("Other") &&
      form.platform_other.trim().length > 0
    ) {
      selectedPlatforms.push(form.platform_other.trim());
    }
    const platformsArray = selectedPlatforms
      .filter((p) => p !== "Other")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const businessCategory =
      form.business_type === "Other"
        ? form.business_type_other.trim() || null
        : form.business_type.trim();

    const { error } = await supabase.from("scam_reports").insert({
      report_type: form.report_type,
      phone: form.phone.trim() || null,
      connected_page: form.connected_page.trim() || null,
      name_on_number: form.name_on_number.trim() || null,
      platform: form.platform.trim() || null,
      description: form.description.trim(),
      evidence_url: form.evidence_url.trim() || null,
      business_category: businessCategory,
      business_location: locationToStore,
      platforms: platformsArray.length > 0 ? platformsArray : null,
      submitter_name: form.submitter_name.trim() || null,
      submitter_phone: form.submitter_phone.trim() || null,
    });

    if (error) {
      setSubmitError("Unable to submit report. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitSuccess(true);
    setSubmitting(false);
    setForm((prev) => ({
      ...prev,
      phone: "",
      connected_page: "",
      name_on_number: "",
      platform: "",
      description: "",
      evidence_url: "",
      business_location: "",
      business_category: "",
      business_category_other: "",
      submitter_name: "",
      submitter_phone: "",
      business_type: "",
      business_type_other: "",
      platforms: [],
      platform_other: "",
    }));
  };

  const showBusinessFields = form.report_type === "BUSINESS";

  return (
    <>
      <SEO
        title="Report a suspicious business or phone number – Transparent Turtle"
        description="Share a suspicious interaction so others can see patterns and stay safe."
      />

      <PublicLayout>
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <header className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Report a suspicious business or phone number
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Share details about a suspicious call, message, or interaction.
              Your report helps others see patterns and make safer decisions.
            </p>
          </header>

          <main className="max-w-2xl space-y-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 text-sm"
              noValidate
            >
              {/* Type of report */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Type of report
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                      form.report_type === "PHONE"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-border bg-background text-foreground"
                    }`}
                    onClick={() => handleChange("report_type", "PHONE")}
                  >
                    Phone number
                  </button>
                  <button
                    type="button"
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                      form.report_type === "BUSINESS"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-border bg-background text-foreground"
                    }`}
                    onClick={() => handleChange("report_type", "BUSINESS")}
                  >
                    Business / Page
                  </button>
                </div>
              </div>

              {/* Phone involved + Name on number */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    Phone number involved{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+1 (___) ___-____"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    Name on number{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    type="text"
                    value={form.name_on_number}
                    onChange={(e) =>
                      handleChange("name_on_number", e.target.value)
                    }
                    placeholder="Name used in messages or calls"
                  />
                </div>
              </div>

              {/* Connected page / business name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Connected page / business name{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  type="text"
                  value={form.connected_page}
                  onChange={(e) =>
                    handleChange("connected_page", e.target.value)
                  }
                  placeholder="Website, social profile, or business name"
                />
              </div>

              {/* Business fields */}
              {showBusinessFields && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-foreground">
                      Business / Scam location{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Input
                      type="text"
                      value={form.business_location}
                      onChange={(e) =>
                        handleChange("business_location", e.target.value)
                      }
                      placeholder="City, area, or country"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium">
                      Business type
                    </label>
                    <select
                      value={form.business_type}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          business_type: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option value="">
                        Select business type (optional)
                      </option>
                      {mergedCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {form.business_type === "Other" && (
                      <input
                        type="text"
                        value={form.business_type_other}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            business_type_other: e.target.value,
                          }))
                        }
                        placeholder="Specify category"
                        className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium">Platforms involved</p>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORM_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-1 text-[11px]"
                        >
                          <input
                            type="checkbox"
                            className="h-3 w-3"
                            checked={form.platforms.includes(opt)}
                            onChange={() => handlePlatformToggle(opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                    {form.platforms.includes("Other") && (
                      <input
                        type="text"
                        value={form.platform_other}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            platform_other: e.target.value,
                          }))
                        }
                        placeholder="Specify platform"
                        className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Legacy single platform text field remains for non-business reports */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Platform{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  type="text"
                  value={form.platform}
                  onChange={(e) => handleChange("platform", e.target.value)}
                  placeholder="WhatsApp, SMS, Instagram, Facebook, etc."
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    handleChange("description", e.target.value)
                  }
                  rows={4}
                  placeholder="Describe what happened, including dates, amounts, and any important details."
                />
              </div>

              {/* Your name + phone */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    Your name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={form.submitter_name}
                    onChange={(e) =>
                      handleChange("submitter_name", e.target.value)
                    }
                    placeholder="Used only for internal review"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    Your phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={form.submitter_phone}
                    onChange={(e) =>
                      handleChange("submitter_phone", e.target.value)
                    }
                    placeholder="Used internally, never shown publicly"
                  />
                </div>
              </div>

              {/* Evidence link */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Evidence link{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  type="text"
                  value={form.evidence_url}
                  onChange={(e) =>
                    handleChange("evidence_url", e.target.value)
                  }
                  placeholder="Link to screenshots, posts, or other evidence (optional)"
                />
              </div>

              {submitError && (
                <p className="text-xs text-destructive-foreground">
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p className="text-xs text-emerald-600">
                  Thank you. Your report has been submitted.
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit report"}
                </Button>
              </div>
            </form>
          </main>
        </div>
      </PublicLayout>
    </>
  );
};

export default ReportPage;