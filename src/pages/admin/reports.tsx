import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { AdminNav } from "@/components/AdminNav";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { AdminReportRowSkeleton } from "@/components/admin/AdminSkeletons";

interface ScamReportRow {
  id: string;
  report_type: string | null;
  phone: string | null;
  name_on_number: string | null;
  connected_page: string | null;
  description: string | null;
  platform: string | null;
  status: string | null;
  submitter_name: string | null;
  submitter_phone: string | null;
  business_category: string | null;
  business_location: string | null;
  created_at: string | null;
  business_id: string | null;
  converted_review_id: string | null;
  converted_at: string | null;
}

const PAGE_SIZE = 20;

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  return trimmed.replace(/[^\d+]/g, "");
}

const buildReviewInsert = (params: {
  businessId: string;
  reviewerName: string | null;
  reviewerPhone: string | null;
  body: string | null;
}) => {
  const { businessId, reviewerName, reviewerPhone, body } = params;

  return {
    business_id: businessId,
    reviewer_name: reviewerName,
    reviewer_phone: reviewerPhone,
    rating: 1,
    body,
  };
};

const AdminReportsPage: NextPage = () => {
  const [reports, setReports] = useState<ScamReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [businessSearchTerm, setBusinessSearchTerm] = useState("");
  const [businessSearchResults, setBusinessSearchResults] = useState<
    { id: string; name: string; phone: string | null }[]
  >([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertSuccessId, setConvertSuccessId] = useState<string | null>(null);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [flaggingError, setFlaggingError] = useState<string | null>(null);
  const [flaggingSuccessId, setFlaggingSuccessId] = useState<string | null>(null);
  const [reusedBusinessIds, setReusedBusinessIds] = useState<Record<string, boolean>>({});

  const notifyConvertError = (message: string) => {
    setConvertError(message);
    toast({
      title: "Conversion failed",
      description: message,
      variant: "destructive",
    });
  };

  const notifyFlaggingError = (message: string) => {
    setFlaggingError(message);
    toast({
      title: "Flagging failed",
      description: message,
      variant: "destructive",
    });
  };

  const fetchReports = async (pageIndex: number) => {
    setLoading(true);
    setFlaggingError(null);
    setConvertError(null);
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("scam_reports")
      .select(
        [
          "id",
          "report_type",
          "phone",
          "name_on_number",
          "connected_page",
          "description",
          "platform",
          "status",
          "submitter_name",
          "submitter_phone",
          "business_category",
          "business_location",
          "created_at",
          "business_id",
          "converted_review_id",
          "converted_at",
        ].join(","),
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching scam reports", error);
      setReports([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    // Happy path: normalize null to [] and explicitly narrow type.
    const safeData = (data ?? []) as unknown as ScamReportRow[];
    setReports(safeData);
    setTotalCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    void fetchReports(page);
  }, [page]);

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    setStatusUpdatingId(reportId);
    const { error } = await supabase
      .from("scam_reports")
      .update({ status: newStatus })
      .eq("id", reportId);

    if (error) {
      console.error("Failed to update report status", error);
      toast({
        title: "Status update failed",
        description: "Could not update the report status.",
        variant: "destructive",
      });
      setStatusUpdatingId(null);
      return;
    }

    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)),
    );
    setStatusUpdatingId(null);
  };

  const handleToggleView = (reportId: string) => {
    setConvertError(null);
    setConvertSuccessId(null);
    if (expandedReportId === reportId) {
      setExpandedReportId(null);
      setBusinessSearchTerm("");
      setBusinessSearchResults([]);
      setSelectedBusinessId(null);
      return;
    }
    setExpandedReportId(reportId);
    setBusinessSearchTerm("");
    setBusinessSearchResults([]);
    setSelectedBusinessId(null);
  };

  const handleBusinessSearch = async (term: string) => {
    setBusinessSearchTerm(term);
    setBusinessSearchResults([]);

    const trimmed = term.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("businesses")
      .select("id,name,phone")
      .or(`name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
      .order("name", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Error searching businesses for report conversion", error);
      return;
    }

    setBusinessSearchResults(
      (data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        phone: b.phone ?? null,
      })),
    );
  };

  type ConvertMode = "USE_EXISTING" | "CREATE_NEW";

  const handleConvertToReview = async (report: ScamReportRow, mode: ConvertMode) => {
    setConvertError(null);
    setConvertSuccessId(null);
    setConvertLoading(true);

    try {
      let businessId: string | null = null;
      let reusedExisting = false;

      if (mode === "USE_EXISTING") {
        if (!selectedBusinessId) {
          notifyConvertError("Select a business before converting.");
          setConvertLoading(false);
          return;
        }
        businessId = selectedBusinessId;
      } else {
        const rawPhone = report.phone ?? "";
        const normalized = normalizePhone(rawPhone);

        const nameCandidate =
          report.connected_page?.trim() ||
          report.name_on_number?.trim() ||
          "Unnamed business from report";

        if (normalized) {
          const { data: existingBiz, error: existingBizError } = await supabase
            .from("businesses")
            .select("id")
            .eq("phone", normalized)
            .maybeSingle();

          if (existingBizError) {
            console.error(
              "Error checking existing business by phone during report conversion",
              existingBizError,
            );
            notifyConvertError("Failed to check existing business for this phone.");
            setConvertLoading(false);
            return;
          }

          if (existingBiz) {
            businessId = existingBiz.id as string;
            reusedExisting = true;
          }
        }

        if (!businessId) {
          if (!normalized) {
            notifyConvertError("Cannot create business: Phone number is missing.");
            setConvertLoading(false);
            return;
          }

          // Schema requires a non-null category string.
          const category = report.business_category?.trim() || "Uncategorized";
          
          type BusinessInsert = Database["public"]["Tables"]["businesses"]["Insert"];

          const insertPayload: BusinessInsert = {
            name: nameCandidate,
            phone: normalized,
            category: category,
            location: report.business_location?.trim() || null,
            status: "UNDER_REVIEW",
            created_by_admin: true,
            verified: false,
          };

          const { data: createdBusiness, error: createBusinessError } = await supabase
            .from("businesses")
            .insert(insertPayload)
            .select("id")
            .single();

          if (createBusinessError || !createdBusiness) {
            console.error("Failed to create business during report conversion", createBusinessError);
            notifyConvertError("Failed to create business for this report.");
            setConvertLoading(false);
            return;
          }

          businessId = createdBusiness.id;
        }

        if (reusedExisting) {
          setReusedBusinessIds((prev) => ({
            ...prev,
            [report.id]: true,
          }));
        }
      }

      if (!businessId) {
        notifyConvertError("Could not determine business to attach review to.");
        setConvertLoading(false);
        return;
      }

      const description = (report.description ?? "").trim();
      const convertedBody = description
        ? `Converted from report submission — ${description}`
        : "Converted from report submission";

      const reviewerPhoneRaw = report.submitter_phone?.trim() || "";
      const reviewerPhoneNormalized = reviewerPhoneRaw
        ? normalizePhone(reviewerPhoneRaw)
        : "";

      const reviewPayload = buildReviewInsert({
        businessId,
        reviewerName: report.submitter_name?.trim() || null,
        reviewerPhone: reviewerPhoneNormalized || null,
        body: convertedBody,
      });

      const { data: insertedReview, error: insertReviewError } = await supabase
        .from("reviews")
        .insert(reviewPayload)
        .select("id")
        .single();

      if (insertReviewError || !insertedReview) {
        console.error("Failed to create review from report conversion", insertReviewError);
        notifyConvertError("Failed to create review from this report.");
        setConvertLoading(false);
        return;
      }

      const { error: linkError } = await supabase
        .from("scam_reports")
        .update({
          converted_review_id: insertedReview.id,
        })
        .eq("id", report.id);

      if (linkError) {
        console.error("Failed to link review to scam report", linkError);
        notifyConvertError("Review created, but failed to link to report.");
        setConvertLoading(false);
        return;
      }

      const { error: updateReportError } = await supabase
        .from("scam_reports")
        .update({
          status: "RESOLVED",
          business_id: businessId,
          converted_review_id: insertedReview.id,
          converted_at: new Date().toISOString(),
        })
        .eq("id", report.id);

      if (updateReportError) {
        console.error("Failed to update scam report after conversion", updateReportError);
        notifyConvertError("Review created, but failed to update report status.");
        setConvertLoading(false);
        return;
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status: "RESOLVED",
                business_id: businessId,
                converted_review_id: insertedReview.id as string,
                converted_at: new Date().toISOString(),
              }
            : r,
        ),
      );

      setConvertSuccessId(report.id);
      toast({
        title: "Report converted",
        description: "Review created and report marked as resolved.",
      });
    } finally {
      setConvertLoading(false);
    }
  };

  const handleFlagNumber = async (report: ScamReportRow) => {
    if (!report.phone) return;

    setFlaggingError(null);
    setFlaggingSuccessId(null);
    setFlaggingId(report.id);

    const phone = normalizePhone(report.phone);
    const nameOnNumber = report.name_on_number?.trim() || null;
    const connectedPage = report.connected_page?.trim() || null;

    const { data: existing, error: existingError } = await supabase
      .from("flagged_numbers")
      .select("id,phone,name_on_number,connected_page,status,verified")
      .eq("phone", phone)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing flagged number", existingError);
      notifyFlaggingError("Failed to flag number. Please try again.");
      setFlaggingId(null);
      return;
    }

    if (existing) {
        type FlaggedUpdate = Database["public"]["Tables"]["flagged_numbers"]["Update"];

        const updatedPayload: FlaggedUpdate = {
            status: "UNDER_REVIEW",
            verified: true,
            name_on_number: !existing.name_on_number && nameOnNumber ? nameOnNumber : undefined,
            connected_page: !existing.connected_page && connectedPage ? connectedPage : undefined,
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
        console.error("Error updating existing flagged number", updateFlagError);
        notifyFlaggingError("Failed to flag number. Please try again.");
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
        console.error("Error inserting new flagged number", insertFlagError);
        notifyFlaggingError("Failed to flag number. Please try again.");
        setFlaggingId(null);
        return;
      }
    }

    const { error: reportUpdateError } = await supabase
      .from("scam_reports")
      .update({ status: "RESOLVED" })
      .eq("id", report.id);

    if (reportUpdateError) {
      console.error("Failed to update scam report after flagging number", reportUpdateError);
      notifyFlaggingError("Number flagged, but failed to update report status.");
      setFlaggingId(null);
      return;
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id ? { ...r, status: "RESOLVED" } : r,
      ),
    );

    setFlaggingSuccessId(report.id);
    toast({
      title: "Number flagged",
      description: "The report has been marked as resolved.",
    });
    setFlaggingId(null);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <SEO title="Admin – Reports – Transparent Turtle" />
      <AdminNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4">
        <header className="flex items-center justify-between gap-2">
          <h1 className="text-base font-semibold tracking-tight">Scam reports</h1>
          {loading ? (
            <div className="h-4 w-20 rounded bg-accent animate-pulse" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {totalCount} reports
            </p>
          )}
        </header>

        {convertError && (
          <p className="text-xs text-destructive-foreground">{convertError}</p>
        )}
        {flaggingError && (
          <p className="text-xs text-destructive-foreground">{flaggingError}</p>
        )}

        <div className="overflow-x-auto rounded-md border border-border/60 bg-background">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-xs font-medium">
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Business name</th>
                <th className="px-3 py-2 text-left">Submitted by</th>
                <th className="px-3 py-2 text-left">Platform</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {loading && reports.length === 0 ? (
                <AdminReportRowSkeleton rows={8} />
              ) : (
                reports.map((report) => {
                const isExpanded = expandedReportId === report.id;
                const businessName =
                  report.connected_page?.trim() ||
                  report.name_on_number?.trim() ||
                  "—";

                return (
                  <React.Fragment key={report.id}>
                    <tr className="align-top">
                      <td className="px-3 py-2">
                        {report.report_type === "BUSINESS" ? "Business/page" : "Phone"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="block break-all">
                          {report.phone ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="line-clamp-1 break-all">{businessName}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span>{report.submitter_name ?? "—"}</span>
                          {report.submitter_phone && (
                            <span className="text-[10px] text-muted-foreground">
                              {report.submitter_phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="line-clamp-2 break-words">
                          {report.platform ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={report.status ?? "PENDING"}
                          onValueChange={(value) =>
                            void handleStatusChange(report.id, value)
                          }
                          disabled={statusUpdatingId === report.id}
                        >
                          <SelectTrigger className="h-7 w-[150px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
                            <SelectItem value="MULTIPLE_REPORTS">
                              Multiple independent reports
                            </SelectItem>
                            <SelectItem value="PATTERN_MATCH_SCAM">
                              Pattern match: known scam method
                            </SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleView(report.id)}
                          >
                            {isExpanded ? "Hide" : "View"}
                          </Button>
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
                        </div>
                        {convertSuccessId === report.id && (
                          <p className="mt-1 text-[10px] text-emerald-600">
                            Converted to review.
                          </p>
                        )}
                        {flaggingSuccessId === report.id && (
                          <p className="mt-1 text-[10px] text-emerald-600">
                            Number flagged.
                          </p>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-b border-border/60 bg-muted/30">
                        <td colSpan={7} className="px-3 py-3">
                          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                            <div className="space-y-2 text-xs">
                              <h3 className="font-medium">Report details</h3>
                              <dl className="space-y-1">
                                <div className="flex justify-between gap-2">
                                  <dt className="text-muted-foreground">Name on number</dt>
                                  <dd className="text-right">
                                    {report.name_on_number ?? "—"}
                                  </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-muted-foreground">Connected page</dt>
                                  <dd className="text-right break-all">
                                    {report.connected_page ?? "—"}
                                  </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-muted-foreground">Location</dt>
                                  <dd className="text-right">
                                    {report.business_location ?? "—"}
                                  </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-muted-foreground">Category</dt>
                                  <dd className="text-right">
                                    {report.business_category ?? "—"}
                                  </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-muted-foreground">Submitted by</dt>
                                  <dd className="text-right">
                                    {report.submitter_name ?? "—"}
                                  </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-muted-foreground">Submitter phone</dt>
                                  <dd className="text-right">
                                    {report.submitter_phone ?? "—"}
                                  </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-muted-foreground">Platform</dt>
                                  <dd className="text-right">
                                    {report.platform ?? "—"}
                                  </dd>
                                </div>
                              </dl>
                              <div className="mt-2">
                                <div className="mb-1 text-xs font-medium">Description</div>
                                <p className="whitespace-pre-wrap text-xs">
                                  {report.description ?? "—"}
                                </p>
                              </div>
                            </div>

                            {report.report_type === "BUSINESS" && (
                              <div className="space-y-3 text-xs">
                                <h3 className="font-medium">Convert to review</h3>
                                {reusedBusinessIds[report.id] && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Business already exists for this phone — linking to existing business.
                                  </p>
                                )}
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">
                                    Search existing businesses
                                  </label>
                                  <input
                                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                                    value={businessSearchTerm}
                                    onChange={(e) =>
                                      void handleBusinessSearch(e.target.value)
                                    }
                                    placeholder="Search by name or phone"
                                  />
                                  {businessSearchResults.length > 0 && (
                                    <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-background">
                                      {businessSearchResults.map((b) => (
                                        <button
                                          key={b.id}
                                          type="button"
                                          onClick={() => setSelectedBusinessId(b.id)}
                                          className={`flex w-full items-center justify-between px-2 py-1 text-left text-xs hover:bg-muted ${
                                            selectedBusinessId === b.id
                                              ? "bg-muted"
                                              : ""
                                          }`}
                                        >
                                          <span className="line-clamp-1">{b.name}</span>
                                          {b.phone && (
                                            <span className="ml-2 text-[10px] text-muted-foreground">
                                              {b.phone}
                                            </span>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {selectedBusinessId && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={convertLoading}
                                      onClick={() =>
                                        void handleConvertToReview(report, "USE_EXISTING")
                                      }
                                    >
                                      {convertLoading
                                        ? "Converting…"
                                        : "Convert to review (use selected business)"}
                                    </Button>
                                  )}
                                  <div>
                                    <div className="mb-1 text-xs font-medium">
                                      Or create new business and convert
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={convertLoading}
                                      onClick={() =>
                                        void handleConvertToReview(report, "CREATE_NEW")
                                      }
                                    >
                                      {convertLoading
                                        ? "Creating & converting…"
                                        : "Create new business and convert"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }))}
              {!loading && reports.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-xs text-muted-foreground"
                  >
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <section className="flex items-center justify-between gap-3 text-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </section>
        )}
      </main>
    </>
  );
};

export default AdminReportsPage;