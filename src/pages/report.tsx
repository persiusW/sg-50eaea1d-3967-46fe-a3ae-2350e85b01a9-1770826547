import React, { useState } from "react";
import type { NextPage } from "next";
import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/components/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ReportType = "PHONE" | "BUSINESS";

const PLATFORMS = [
  "Instagram",
  "WhatsApp",
  "Facebook",
  "TikTok",
  "Website",
  "Other",
];

const ReportPage: NextPage = () => {
  const [reportType, setReportType] = useState<ReportType>("PHONE");
  const [phone, setPhone] = useState("");
  const [nameOnNumber, setNameOnNumber] = useState("");
  const [connectedPage, setConnectedPage] = useState("");
  const [platform, setPlatform] = useState<string>("Instagram");
  const [description, setDescription] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim() || !submitterName.trim() || !submitterPhone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (reportType === "PHONE" && !phone.trim()) {
      setError("Phone number is required for phone reports.");
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await supabase.from("scam_reports").insert({
      report_type: reportType,
      phone: phone.trim() || null,
      name_on_number: nameOnNumber.trim() || null,
      connected_page: connectedPage.trim() || null,
      platform: platform || null,
      description: description.trim(),
      submitter_name: submitterName.trim(),
      submitter_phone: submitterPhone.trim(),
      evidence_url: evidenceUrl.trim() || null,
      status: "NEW",
    });

    if (insertError) {
      setError("Could not submit report. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <>
        <SEO
          title="Report received – Transparent Turtle"
          description="Thank you for submitting a report to help keep the community safer."
        />
        <PublicLayout>
          <div className="container flex min-h-screen items-center justify-center py-12">
            <div className="max-w-md rounded-lg border border-border bg-card p-6 text-sm">
              <h1 className="text-lg font-semibold tracking-tight">
                Report received
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you for helping keep the community safer. Reports are
                reviewed for safety and accuracy before any information appears
                publicly.
              </p>
            </div>
          </div>
        </PublicLayout>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Report a scam – Transparent Turtle"
        description="Submit information about a suspected scam so it can be reviewed for safety and accuracy."
      />
      <PublicLayout>
        <div className="container min-h-screen py-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <header className="space-y-2">
              <h1 className="text-xl font-semibold tracking-tight">
                Report a scam
              </h1>
              <p className="text-sm text-muted-foreground">
                Use this form to share information about a suspected scam or
                risky business. Reports are reviewed for safety and accuracy
                before any information appears publicly.
              </p>
              <p className="text-xs text-muted-foreground">
                Do not include passwords, OTP codes, or bank details.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">
                  Type of report <span className="text-red-500">*</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="radio"
                      name="report_type"
                      value="PHONE"
                      checked={reportType === "PHONE"}
                      onChange={() => setReportType("PHONE")}
                    />
                    <span>Phone number</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="radio"
                      name="report_type"
                      value="BUSINESS"
                      checked={reportType === "BUSINESS"}
                      onChange={() => setReportType("BUSINESS")}
                    />
                    <span>Business / Page</span>
                  </label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    Phone number {reportType === "PHONE" && <span className="text-red-500">*</span>}
                  </label>
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Number involved in the scam"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    Name on number
                  </label>
                  <Input
                    type="text"
                    value={nameOnNumber}
                    onChange={(e) => setNameOnNumber(e.target.value)}
                    placeholder="If known"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground">
                    Connected page / business name
                  </label>
                  <Input
                    type="text"
                    value={connectedPage}
                    onChange={(e) => setConnectedPage(e.target.value)}
                    placeholder="Business, page, or profile name"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground">
                    Platform
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what happened, including dates, amounts, and any important details."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    Your name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    placeholder="Used only for internal review"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    Your phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={submitterPhone}
                    onChange={(e) => setSubmitterPhone(e.target.value)}
                    placeholder="Used internally, never shown publicly"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Evidence link
                </label>
                <Input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="Link to screenshots, posts, or other evidence (optional)"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive-foreground">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit report"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </PublicLayout>
    </>
  );
};

export default ReportPage;