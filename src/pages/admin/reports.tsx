import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { AdminNav } from "@/components/AdminNav";

type ReportStatus = "NEW" | "REVIEWING" | "RESOLVED" | "REJECTED";
type ReportType = "PHONE" | "BUSINESS";

type ScamReportRow = {
  id: string;
  report_type: ReportType;
  platform: string | null;
  connected_page: string | null;
  description: string;
  evidence_url: string | null;
  submitter_name: string | null;
  submitter_phone: string | null;
  phone: string | null;
  status: ReportStatus;
  business_id: string | null;
  created_at: string;
  converted_review_id: string | null;
  converted_at: string | null;
  name_on_number: string | null;
};

interface BusinessOption {
  id: string;
  name: string;
  phone: string | null;
}

const PAGE_SIZE = 25;

const STATUS_OPTIONS: ReportStatus[] = ["NEW", "REVIEWING", "RESOLVED", "REJECTED"];

interface ConvertState {
  expandedId: string | null;
  selectedBusinessId: string | null;
  businessSearch: string;
  businessOptions: BusinessOption[];
  conversionSavingId: string | null;
  conversionErrorById: Record<string, string | null>;
  createBusinessNameById: Record<string, string>;
  createBusinessPhoneById: Record<string, string>;
}

const AdminReportsPage: NextPage = () => {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [reports, setReports] = useState<ScamReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [convertState, setConvertState] = useState<ConvertState>({
    expandedId: null,
    selectedBusinessId: null,
    businessSearch: "",
    businessOptions: [],
    conversionSavingId: null,
    conversionErrorById: {},
    createBusinessNameById: {},
    createBusinessPhoneById: {},
  });

  const {
    expandedId,
    selectedBusinessId,
    businessSearch,
    businessOptions,
    conversionSavingId,
    conversionErrorById,
    createBusinessNameById,
    createBusinessPhoneById,
  } = convertState;

  const setExpandedId = (id: string | null) =>
    setConvertState((prev) => ({
      ...prev,
      expandedId: id,
      // reset selection when toggling rows to avoid cross-row leaks
      selectedBusinessId: null,
      businessSearch: "",
      businessOptions: [],
    }));

  const setSelectedBusinessId = (id: string | null) =>
    setConvertState((prev) => ({
      ...prev,
      selectedBusinessId: id,
    }));

  const setBusinessSearch = (value: string) =>
    setConvertState((prev) => ({
      ...prev,
      businessSearch: value,
    }));

  const setBusinessOptions = (options: BusinessOption[]) =>
    setConvertState((prev) => ({
      ...prev,
      businessOptions: options,
    }));

  const setConversionSavingId = (id: string | null) =>
    setConvertState((prev) => ({
      ...prev,
      conversionSavingId: id,
    }));

  const setConversionErrorForId = (id: string, message: string | null) =>
    setConvertState((prev) => ({
      ...prev,
      conversionErrorById: { ...prev.conversionErrorById, [id]: message },
    }));

  const setCreateBusinessNameForId = (id: string, value: string) =>
    setConvertState((prev) => ({
      ...prev,
      createBusinessNameById: { ...prev.createBusinessNameById, [id]: value },
    }));

  const setCreateBusinessPhoneForId = (id: string, value: string) =>
    setConvertState((prev) => ({
      ...prev,
      createBusinessPhoneById: { ...prev.createBusinessPhoneById, [id]: value },
    }));

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

  const fetchReports = async (pageToLoad: number) => {
    setLoading(true);
    const from = (pageToLoad - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error: fetchError } = await supabase
      .from("scam_reports")
      .select(
        "id,report_type,phone,name_on_number,connected_page,platform,description,submitter_name,submitter_phone,evidence_url,status,business_id,converted_review_id,converted_at,created_at",
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fetchError) {
      setReports([]);
      setHasMore(false);
    } else if (data) {
      setReports(data as ScamReportRow[]);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setReports([]);
      setHasMore(false);
    }
    setSelectedIds([]);
    setLoading(false);
  };

  useEffect(() => {
    if (checkingAuth) return;
    void fetchReports(page);
  }, [checkingAuth, page]);

  const handleStatusChange = async (
    reportId: string,
    nextStatus: ReportStatus,
  ) => {
    setStatusSavingId(reportId);
    await supabase.from("scam_reports").update({ status: nextStatus }).eq("id", reportId);
    await fetchReports(page);
    setStatusSavingId(null);
  };

  const handleDelete = async (reportId: string) => {
    const confirmed = window.confirm(
      "Delete this report? This action cannot be undone.",
    );
    if (!confirmed) return;
    setDeleteId(reportId);
    await supabase.from("scam_reports").delete().eq("id", reportId);
    await fetchReports(page);
    setDeleteId(null);
  };

  const handleSearchBusinesses = async () => {
    setError(null);
    const term = businessSearch.trim();
    if (!term) {
      setBusinessOptions([]);
      return;
    }
    const { data, error: bizError } = await supabase
      .from("businesses")
      .select("id,name,phone")
      .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
      .order("created_at", { ascending: false })
      .limit(25);

    if (bizError) {
      setError("Could not search businesses.");
      setBusinessOptions([]);
      return;
    }
    setBusinessOptions((data || []) as BusinessOption[]);
  };

  const formatConvertedBody = (report: ScamReportRow): string => {
    const lines: string[] = [];

    lines.push("Converted from report submission", "");
    lines.push(`Report type: ${report.report_type}`);

    if (report.platform) {
      lines.push(`Platform: ${report.platform}`);
    }
    if (report.connected_page) {
      lines.push(`Connected page: ${report.connected_page}`);
    }

    lines.push("");
    lines.push("Details:");
    lines.push(report.description || "");

    if (report.evidence_url) {
      lines.push("");
      lines.push(`Evidence: ${report.evidence_url}`);
    }

    return lines.join("\n");
  };

  const createBusinessAndConvert = async (report: ScamReportRow) => {
    // if an existing business is selected, do not allow create path
    if (selectedBusinessId) {
      return;
    }

    setConversionErrorForId(report.id, null);

    const existingName = (createBusinessNameById[report.id] || "").trim();
    const defaultName =
      report.connected_page?.trim() ||
      report.name_on_number?.trim() ||
      "Unknown business";
    const nameToUse = (existingName || defaultName).trim();

    const existingPhoneState = (createBusinessPhoneById[report.id] || "").trim();
    const phoneToUse = (report.phone?.trim() || existingPhoneState).trim();

    if (!nameToUse || !phoneToUse) {
      setConversionErrorForId(
        report.id,
        "Business name and phone are required to create a business from this report.",
      );
      return;
    }

    setConversionSavingId(report.id);

    let businessId: string | null = null;

    const { data: existingBiz, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("phone", phoneToUse)
      .maybeSingle();

    if (bizError) {
      console.error(bizError);
      setConversionErrorForId(
        report.id,
        "Could not look up business by phone.",
      );
      setConversionSavingId(null);
      return;
    }

    if (existingBiz) {
      businessId = existingBiz.id;
    } else {
      const businessPayload = {
        name: nameToUse,
        phone: phoneToUse,
        category: "Other",
        location: null,
        branches_count: 1,
        verified: false,
        created_by_admin: true,
        status: "UNDER_REVIEW",
      };

      const { data: newBiz, error: insertBizError } = await supabase
        .from("businesses")
        .insert([businessPayload])
        .select("id")
        .single();

      if (insertBizError || !newBiz) {
        console.error(insertBizError);
        setConversionErrorForId(
          report.id,
          "Could not create business from report.",
        );
        setConversionSavingId(null);
        return;
      }

      businessId = newBiz.id as string;
    }

    const body = formatConvertedBody(report);

    const { data: reviewData, error: insertError } = await supabase
      .from("reviews")
      .insert({
        business_id: businessId,
        reviewer_name: report.submitter_name,
        reviewer_phone: report.submitter_phone,
        rating: 1,
        body,
      })
      .select("id")
      .single();

    if (insertError || !reviewData) {
      console.error(insertError);
      setConversionErrorForId(report.id, "Could not convert to review.");
      setConversionSavingId(null);
      return;
    }

    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("scam_reports")
      .update({
        business_id: businessId,
        converted_review_id: reviewData.id as string,
        converted_at: nowIso,
        status: "RESOLVED",
      })
      .eq("id", report.id);

    if (updateError) {
      console.error(updateError);
      setConversionErrorForId(
        report.id,
        "Could not mark report as resolved.",
      );
      setConversionSavingId(null);
      return;
    }

    await fetchReports(page);
    setConversionSavingId(null);
  };

  const handleBulkUpdateReportStatus = async (nextStatus: ReportStatus) => {
    if (selectedIds.length === 0) return;

    setBulkError(null);
    setBulkSaving(true);

    const prevById = new Map<string, ReportStatus>();
    for (const r of reports) {
      prevById.set(r.id, r.status as ReportStatus);
    }

    setReports((prev) =>
      prev.map((r) =>
        selectedIds.includes(r.id) ? { ...r, status: nextStatus } : r,
      ),
    );

    const { error: supaError } = await supabase
      .from("scam_reports")
      .update({ status: nextStatus })
      .in("id", selectedIds);

    if (supaError) {
      setBulkError("Could not update selected reports. Changes reverted.");
      setReports((prev) =>
        prev.map((r) => ({
          ...r,
          status: prevById.get(r.id) ?? r.status,
        })),
      );
    } else {
      setSelectedIds([]);
    }

    setBulkSaving(false);
  };

  if (checkingAuth) {
    return (
      <>
        <SEO
          title="Admin reports – Transparent Turtle"
          description="Review scam reports submitted by the public."
        />
        <main className="min-h-screen bg-background text-foreground">
          <div className="container flex min-h-screen items-center justify-center">
            <p className="text-sm text-muted-foreground">Checking access…</p>
          </div>
        </main>
      </>
    );
  }

  const allVisibleIds = reports.map((r) => r.id);
  const allSelectedOnPage =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.includes(id));
  const someSelectedOnPage =
    allVisibleIds.some((id) => selectedIds.includes(id)) &&
    !allSelectedOnPage;

  return (
    <>
      <SEO
        title="Admin reports – Transparent Turtle"
        description="Review scam reports submitted by the public."
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-6 py-8">
          <AdminNav />

          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Reports (admin)
              </h1>
              <p className="text-sm text-muted-foreground">
                Review scam reports submitted by the public, update their status, or convert them into flagged numbers or reviews.
              </p>
            </div>
          </header>

          <section className="space-y-4">
            {error && (
              <p className="text-xs text-destructive-foreground">
                {error}
              </p>
            )}

            {selectedIds.length > 0 && (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    Selected: {selectedIds.length}
                  </span>
                  {bulkError && (
                    <span className="text-destructive">{bulkError}</span>
                  )}
                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() =>
                      void handleBulkUpdateReportStatus("REVIEWING")
                    }
                    className="rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 disabled:opacity-60 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    Set REVIEWING
                  </button>
                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() =>
                      void handleBulkUpdateReportStatus("RESOLVED")
                    }
                    className="rounded-full border border-emerald-500 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800 disabled:opacity-60 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100"
                  >
                    Set RESOLVED
                  </button>
                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() =>
                      void handleBulkUpdateReportStatus("REJECTED")
                    }
                    className="rounded-full border border-red-400 bg-red-50 px-2 py-0.5 text-[10px] text-red-700 disabled:opacity-60 dark:border-red-500 dark:bg-red-950/40 dark:text-red-200"
                  >
                    Set REJECTED
                  </button>
                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={() => setSelectedIds([])}
                    className="ml-auto rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">
                      <input
                        type="checkbox"
                        className="h-3 w-3 accent-emerald-600"
                        checked={allSelectedOnPage}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = someSelectedOnPage;
                          }
                        }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(allVisibleIds);
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Phone</th>
                    <th className="px-2 py-2 font-medium">Platform</th>
                    <th className="px-2 py-2 font-medium">Connected page</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-2 py-4 text-center text-xs text-muted-foreground"
                      >
                        {loading ? "Loading…" : "No reports yet."}
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => {
                      const isExpanded = expandedId === report.id;
                      const conversionError =
                        conversionErrorById[report.id] ?? null;

                      const defaultName =
                        report.connected_page?.trim() ||
                        report.name_on_number?.trim() ||
                        "Unknown business";

                      const createNameValue =
                        createBusinessNameById[report.id] ?? defaultName;

                      const createPhoneValue =
                        createBusinessPhoneById[report.id] ?? "";

                      const phoneToUse =
                        report.phone?.trim() || createPhoneValue.trim();

                      const canCreate =
                        !selectedBusinessId &&
                        createNameValue.trim().length > 0 &&
                        !!phoneToUse &&
                        conversionSavingId !== report.id;

                      return (
                        <React.Fragment key={report.id}>
                          <tr className="border-b border-border/60 align-top">
                            <td className="px-2 py-2 align-top">
                              <input
                                type="checkbox"
                                className="h-3 w-3 accent-emerald-600"
                                checked={selectedIds.includes(report.id)}
                                onChange={(e) => {
                                  setSelectedIds((prev) =>
                                    e.target.checked
                                      ? [...prev, report.id]
                                      : prev.filter((id) => id !== report.id),
                                  );
                                }}
                              />
                            </td>
                            <td className="px-2 py-2 text-[11px]">
                              {report.report_type}
                            </td>
                            <td className="px-2 py-2 text-[11px]">
                              {report.phone || "—"}
                            </td>
                            <td className="px-2 py-2 text-[11px]">
                              {report.platform || "—"}
                            </td>
                            <td className="px-2 py-2 text-[11px]">
                              {report.connected_page || "—"}
                            </td>
                            <td className="px-2 py-2 text-[11px]">
                              <select
                                className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                                value={report.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    report.id,
                                    e.target.value as ReportStatus
                                  )
                                }
                                disabled={statusSavingId === report.id}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-2 text-[11px] text-muted-foreground">
                              {new Date(report.created_at).toLocaleString()}
                            </td>
                            <td className="px-2 py-2 text-[11px]">
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedId(
                                      isExpanded ? null : report.id,
                                    )
                                  }
                                  className="rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                                >
                                  {isExpanded ? "Hide" : "View"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(report.id)}
                                  disabled={deleteId === report.id}
                                  className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] text-destructive disabled:opacity-60"
                                >
                                  {deleteId === report.id ? "Deleting…" : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-border/60 bg-muted/30 text-sm">
                              <td colSpan={8} className="px-3 pb-3 pt-2">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2 text-xs">
                                    <h3 className="font-semibold">Report details</h3>
                                    <p>
                                      <span className="font-medium">
                                        Name on number:
                                      </span>{" "}
                                      {report.name_on_number || "—"}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Submitter name:
                                      </span>{" "}
                                      {report.submitter_name}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Evidence:
                                      </span>{" "}
                                      {report.evidence_url ? (
                                        <a
                                          href={report.evidence_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary underline"
                                        >
                                          Open link
                                        </a>
                                      ) : (
                                        "—"
                                      )}
                                    </p>
                                    <p className="whitespace-pre-wrap">
                                      <span className="font-medium">
                                        Description:
                                      </span>{" "}
                                      {report.description}
                                    </p>
                                  </div>
                                  <div className="space-y-3 text-xs">
                                    <h3 className="font-semibold">Convert to review</h3>

                                    <div className="space-y-2">
                                      <label className="block text-[11px] font-medium">
                                        Link to existing business
                                      </label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                                          placeholder="Search by name or phone"
                                          value={businessSearch}
                                          onChange={(e) =>
                                            setBusinessSearch(e.target.value)
                                          }
                                        />
                                        <button
                                          type="button"
                                          onClick={handleSearchBusinesses}
                                          className="rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground"
                                        >
                                          Search
                                        </button>
                                      </div>
                                      {businessOptions.length > 0 && (
                                        <select
                                          className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                                          value={selectedBusinessId ?? ""}
                                          onChange={(e) =>
                                            setSelectedBusinessId(
                                              e.target.value || null,
                                            )
                                          }
                                        >
                                          <option value="">Select business</option>
                                          {businessOptions.map((biz) => (
                                            <option key={biz.id} value={biz.id}>
                                              {biz.name}
                                              {biz.phone ? ` (${biz.phone})` : ""}
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                    </div>

                                    <div className="mt-3 space-y-2 rounded-md border border-dashed border-border bg-card/40 p-3">
                                      <h4 className="text-[11px] font-semibold">
                                        Create new business (if not found)
                                      </h4>
                                      <div className="space-y-1">
                                        <label className="block text-[11px] font-medium">
                                          Business name
                                        </label>
                                        <input
                                          type="text"
                                          className="block w-full rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                                          value={createNameValue}
                                          onChange={(e) =>
                                            setCreateBusinessNameForId(
                                              report.id,
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[11px] font-medium">
                                          {report.phone
                                            ? "Business phone"
                                            : "Business phone (required)"}
                                        </label>
                                        <input
                                          type="text"
                                          className="block w-full rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                                          value={
                                            report.phone ?? createPhoneValue
                                          }
                                          onChange={(e) =>
                                            !report.phone &&
                                            setCreateBusinessPhoneForId(
                                              report.id,
                                              e.target.value,
                                            )
                                          }
                                          readOnly={Boolean(report.phone)}
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        className="mt-1 inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-[11px] font-medium text-primary-foreground disabled:opacity-60"
                                        disabled={!canCreate}
                                        onClick={() => void createBusinessAndConvert(report)}
                                      >
                                        {conversionSavingId === report.id
                                          ? "Creating…"
                                          : "Create business and convert"}
                                      </button>
                                      {conversionError && (
                                        <p className="mt-1 text-[11px] text-destructive">
                                          {conversionError}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => (prev > 1 && !loading ? prev - 1 : prev))
                }
                disabled={page === 1 || loading}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => (hasMore && !loading ? prev + 1 : prev))
                }
                disabled={!hasMore || loading}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground disabled:opacity-50"
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