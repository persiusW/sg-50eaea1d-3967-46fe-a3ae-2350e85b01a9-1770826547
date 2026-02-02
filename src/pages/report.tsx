import React, { useState } from "react";
import type { NextPage } from "next";
import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/components/PublicLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type ReportType = "PHONE" | "BUSINESS";

const PLATFORM_OPTIONS = ["Instagram", "WhatsApp", "Facebook", "TikTok", "Website"];

const BUSINESS_CATEGORY_OPTIONS: string[] = [
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

interface FormState {
  reportType: ReportType;
  phone: string;
  nameOnNumber: string;
  connectedPage: string;
  businessName: string;
  businessCategory: string;
  customCategory: string;
  businessLocation: string;
  description: string;
  submitterName: string;
  submitterPhone: string;
  platforms: string[];
  otherPlatform: string;
}

const initialState: FormState = {
  reportType: "PHONE",
  phone: "",
  nameOnNumber: "",
  connectedPage: "",
  businessName: "",
  businessCategory: "",
  customCategory: "",
  businessLocation: "",
  description: "",
  submitterName: "",
  submitterPhone: "",
  platforms: [],
  otherPlatform: "",
};

const ReportPage: NextPage = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const phone = form.phone.trim();
    if (!phone) {
      setError("Phone number is required.");
      setSubmitting(false);
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      setSubmitting(false);
      return;
    }

    const basePlatforms = form.platforms.filter((p) => p !== "Other");
    const trimmedOther = form.otherPlatform.trim();
    const allPlatforms = trimmedOther.length > 0 ? [...basePlatforms, trimmedOther] : basePlatforms;
    const platformsArray = allPlatforms.length > 0 ? allPlatforms : [];
    const legacyPlatform = platformsArray.length > 0 ? platformsArray.join(", ") : null;

    const businessCategoryResolved =
      form.businessCategory === "OTHER"
        ? form.customCategory.trim() || null
        : form.businessCategory.trim() || null;

    const { error: insertError } = await supabase.from("scam_reports").insert({
      report_type: form.reportType,
      phone,
      name_on_number: form.nameOnNumber.trim() || null,
      connected_page: form.connectedPage.trim() || null,
      business_name: form.businessName.trim() || null,
      business_category: businessCategoryResolved,
      business_location: form.businessLocation.trim() || null,
      description: form.description.trim(),
      submitter_name: form.submitterName.trim() || null,
      submitter_phone: form.submitterPhone.trim() || null,
      platforms: platformsArray.length > 0 ? platformsArray : null,
      platform: legacyPlatform,
    });

    if (insertError) {
      setError("Failed to submit report. Please try again.");
      setSubmitting(false);
      return;
    }

    setSuccess("Report submitted. Thank you for contributing.");
    setForm(initialState);
    setSubmitting(false);
  };

  return (
    <>
      <SEO
        title="Report a scam or suspicious business – Transparent Turtle"
        description="Help others stay safe by reporting suspicious phone numbers or businesses."
      />
      <PublicLayout>
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-6">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Report a scam or suspicious activity</h1>
            <p className="text-sm text-muted-foreground">
              Reports are reviewed by the Transparent Turtle team. Please only share information you are comfortable
              making public.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm" noValidate>
            <div className="space-y-1">
              <Label htmlFor="reportType">What are you reporting?</Label>
              <Select
                value={form.reportType}
                onValueChange={(value: ReportType) => handleChange("reportType", value)}
              >
                <SelectTrigger id="reportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHONE">Phone number</SelectItem>
                  <SelectItem value="BUSINESS">Business or page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="phone">Phone number being reported</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+234..."
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nameOnNumber">Name on this number (optional)</Label>
                <Input
                  id="nameOnNumber"
                  value={form.nameOnNumber}
                  onChange={(e) => handleChange("nameOnNumber", e.target.value)}
                  placeholder="Name the scammer or business uses"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="connectedPage">Connected page / link (optional)</Label>
              <Input
                id="connectedPage"
                value={form.connectedPage}
                onChange={(e) => handleChange("connectedPage", e.target.value)}
                placeholder="Instagram handle, website, listing URL, etc."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="businessName">Business or page name (optional)</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="If there is a name they use"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="businessCategory">Business type (optional)</Label>
                <Select
                  value={form.businessCategory}
                  onValueChange={(value: string) => handleChange("businessCategory", value)}
                >
                  <SelectTrigger id="businessCategory">
                    <SelectValue placeholder="Select or leave empty" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.businessCategory === "OTHER" && (
                <div className="space-y-1">
                  <Label htmlFor="customCategory">Specify business type</Label>
                  <Input
                    id="customCategory"
                    value={form.customCategory}
                    onChange={(e) => handleChange("customCategory", e.target.value)}
                    placeholder="Short label, e.g. 'Crypto investment'"
                    maxLength={50}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="businessLocation">Where is this based? (optional)</Label>
              <Input
                id="businessLocation"
                value={form.businessLocation}
                onChange={(e) => handleChange("businessLocation", e.target.value)}
                placeholder="City, region, country if known"
              />
            </div>

            <div className="space-y-2">
              <Label>Platforms involved (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((platform) => (
                  <label key={platform} className="flex items-center gap-1 text-xs text-foreground">
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
                <Input
                  id="otherPlatform"
                  value={form.otherPlatform}
                  onChange={(e) => handleChange("otherPlatform", e.target.value)}
                  className="mt-1 h-7 text-xs"
                  placeholder="Specify platform"
                />
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">What happened?</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={5}
                placeholder="Describe what happened in clear, factual terms."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="submitterName">Your name (optional)</Label>
                <Input
                  id="submitterName"
                  value={form.submitterName}
                  onChange={(e) => handleChange("submitterName", e.target.value)}
                  placeholder="First name or alias is fine"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="submitterPhone">Your phone (optional)</Label>
                <Input
                  id="submitterPhone"
                  value={form.submitterPhone}
                  onChange={(e) => handleChange("submitterPhone", e.target.value)}
                  placeholder="We use this to detect patterns, not to contact you"
                />
              </div>
            </div>

            {error && <p className="text-xs text-destructive-foreground">{error}</p>}
            {success && <p className="text-xs text-emerald-600">{success}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit report"}
            </Button>
          </form>
        </main>
      </PublicLayout>
    </>
  );
};

export default ReportPage;