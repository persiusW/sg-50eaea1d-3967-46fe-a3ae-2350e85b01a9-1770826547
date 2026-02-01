import React, { useState } from "react";

export interface StatusLegendProps {
  className?: string;
}

export function StatusLegend({ className }: StatusLegendProps) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <section
      className={`rounded-md border border-border bg-card/60 p-3 text-xs text-muted-foreground ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Badge &amp; status legend
          </p>
          <p className="mt-0.5 text-[11px]">
            Short explanations of what labels and badges mean.
          </p>
        </div>
        <span className="shrink-0 text-[11px]">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-foreground">
              Business badges
            </p>
            <ul className="mt-1 space-y-0.5">
              <li>
                <span className="font-medium text-foreground">Verified</span>{" "}
                <span>
                  This business record has been confirmed as authentic.
                </span>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-foreground">
              Business status badges
            </p>
            <ul className="mt-1 space-y-0.5">
              <li>
                <span className="font-medium text-foreground">⚠️ Under Review</span>{" "}
                <span>Reports are being reviewed.</span>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  🚩 Multiple Independent Reports
                </span>{" "}
                <span>
                  Several unrelated reports indicate potential risk.
                </span>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  ❗ Pattern Match: Known Scam Method
                </span>{" "}
                <span>Activity matches known scam patterns.</span>
              </li>
              <li>
                <span className="font-medium text-foreground">⛔ Confirmed Scam</span>{" "}
                <span>Strong evidence of fraudulent activity.</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-foreground">
              Review statuses
            </p>
            <ul className="mt-1 space-y-0.5">
              <li>
                <span className="font-medium text-foreground">Verified Review</span>{" "}
                <span>Reviewer identity has been validated.</span>
              </li>
              <li>
                <span className="font-medium text-foreground">Under Review</span>{" "}
                <span>Review is being checked for accuracy.</span>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Marked as Spam
                </span>{" "}
                <span>
                  Review violated platform rules or was misleading.
                </span>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-foreground">
              Flagged number statuses
            </p>
            <ul className="mt-1 space-y-0.5">
              <li>
                <span className="font-medium text-foreground">Under Review</span>{" "}
                <span>Information about this number is being reviewed.</span>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Multiple Reports
                </span>{" "}
                <span>
                  Several reports connect this number to potential risk.
                </span>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Confirmed Scam
                </span>{" "}
                <span>
                  Strong evidence links this number to fraudulent activity.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}