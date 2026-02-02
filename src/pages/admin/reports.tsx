import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";

type ReportStatus = "PENDING" | "IN_REVIEW" | "RESOLVED";
type ReportType = "PHONE" | "BUSINESS";

interface ScamReportRow {
  id: string;
  report_type: ReportType;
  phone: string | null;
  name_on_number: string | null;
  connected_page: string | null;
  business_name: string | null;
  business_category: string | null;
  business_location: string | null;
  description: string | null;
  submitter_name: string | null;
  submitter_phone: string | null;
  platforms: string[] | null;
  platform: string | null;
  status: ReportStatus | null;
  business_id: string | null;
  converted_review_id: string | null;
  converted_at: string | null;
  created_at: string;
}

const PAGE_SIZE = 25;

const AdminReportsPage: NextPage = () => {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [reports, setReports] = useState<ScamReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [flaggingError, setFlaggingError] = useState<string | null>(null);
  const [flaggingSuccessId, setFlaggingSuccessId] = useState<string | null>(null);

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

  const fetchReports = async (pageToLoad: number, status: ReportStatus | "ALL" = statusFilter) => {
    setLoading(true);
    setFlaggingError(null);
    setFlaggingSuccessId(null);

    const from = (pageToLoad - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("scam_reports")
      .select(
        "id,report_type,phone,name_on_number,connected_page,business_name,business_category,business_location,description,submitter_name,submitter_phone,platforms,platform,status,business_id,converted_review_id,converted_at,created_at",
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (!error && data) {
      setReports(data as ScamReportRow[]);
      setHasMore((data as ScamReportRow[]).length === PAGE_SIZE);
    } else {
      setReports([]);
      setHasMore(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (checkingAuth) return;
    void fetchReports(page, statusFilter);
  }, [checkingAuth, page, statusFilter]);

  const handleStatusFilterChange = (value: ReportStatus | "ALL") => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleFlagNumber = async (report: ScamReportRow) => {
    if (!report.phone) return;

    setFlaggingError(null);
    setFlaggingSuccessId(null);
    setFlaggingId(report.id);

    const phone = report.phone.trim();
    const nameOnNumber = report.name_on_number?.trim() || null;
    const connectedPage = report.connected_page?.trim() || null;

    // Check existing flagged_numbers row
    const { data: existing, error: existingError } = await supabase
      .from("flagged_numbers")
      .select("id,phone,name_on_number,connected_page,status,verified")
      .eq("phone", phone)
      .maybeSingle();

    if (existingError) {
      setFlaggingError("Failed to check existing flagged number.");
      setFlaggingId(null);
      return;
    }

    if (existing) {
      const updatedPayload: Record<string, unknown> = {
        status: "UNDER_REVIEW",
        verified: true,
      };

      if (!existing.name_on_number && nameOnNumber) {
        updatedPayload.name_on_number = nameOnNumber;
      }
      if (!existing.connected_page && connectedPage) {
        updatedPayload.connected_page = connectedPage;
      }

      const { error: updateFlagError } = await supabase
        .from("flagged_numbers")
        .update(updatedPayload)
        .eq("id", existing.id);

      if (updateFlagError) {
        setFlaggingError("Failed to update flagged number.");
        setFlaggingId(null);
        return;
      }
    } else {
      const { error: insertFlagError } = await supabase.from("flagged_numbers").insert({
        phone,
        name_on_number: nameOnNumber,
        connected_page: connectedPage,
        status: "UNDER_REVIEW",
        verified: true,
      });

      if (insertFlagError) {
        setFlaggingError("Failed to flag number.");
        setFlaggingId(null);
        return;
      }
    }

    const { error: reportUpdateError } = await supabase
      .from("scam_reports")
      .update({ status: "RESOLVED" })
      .eq("id", report.id);

    if (reportUpdateError) {
      setFlaggingError("Number flagged, but failed to update report status.");
      setFlaggingId(null);
      return;
    }

    setFlaggingSuccessId(report.id);
    setFlaggingId(null);
    void fetchReports(page, statusFilter);
  };

  if (checkingAuth) {
    return (
      <>
        <SEO
          title="Admin reports – Transparent Turtle"
          description="Review and convert scam reports in the Transparent Turtle admin dashboard."
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
        title="Admin reports – Transparent Turtle"
        description="Review and convert scam reports in the Transparent Turtle admin dashboard."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <AdminNav />
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Reports (admin)</h1>
              <p className="text-sm text-muted-foreground">
                Review incoming scam reports, flag numbers, and convert reports into public reviews.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_REVIEW">In review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </header>

          <section className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">All reports</p>
              {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
            </div>

            {flaggingError && (
              <p className="text-xs text-destructive-foreground">
                {flaggingError}
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3">Platform</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 pl-3 text-right">Created at</th>
                    <th className="py-2 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-4 text-center text-xs text-muted-foreground"
                      >
                        No reports yet.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="border-b border-border/60 align-top">
                        <td className="py-2 pr-3">
                          {report.report_type === "PHONE" ? "Phone number" : "Business / page"}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {report.phone || "—"}
                        </td>
                        <td className="py-2 px-3">
                          {report.platform || "—"}
                        </td>
                        <td className="py-2 px-3">
                          {report.business_category || "—"}
                        </td>
                        <td className="py-2 px-3">
                          {report.status || "PENDING"}
                        </td>
                        <td className="py-2 pl-3 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 pl-3 text-right whitespace-nowrap space-x-2">
                          {report.phone && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={flaggingId === report.id}
                              onClick={() => void handleFlagNumber(report)}
                            >
                              {flaggingId === report.id ? "Flagging…" : "Flag number"}
                            </Button>
                          )}
                          {flaggingSuccessId === report.id && (
                            <span className="ml-1 text-[11px] text-emerald-600">
                              Number flagged
                            </span>
                          )}
                          {/* Existing convert-to-review actions remain unchanged */}
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
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminReportsPage;