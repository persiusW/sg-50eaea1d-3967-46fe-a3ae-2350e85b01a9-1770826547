import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface HealthOk {
  ok: true;
  supabaseUrlHost: string;
  tablesReachable: boolean;
}

interface HealthError {
  ok: false;
  error: string;
}

type HealthResponse = HealthOk | HealthError;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
): Promise<void> {
  try {
    // Show which Supabase project we are talking to (by hostname only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    let host = "";
    try {
      host = supabaseUrl ? new URL(supabaseUrl).host : "";
    } catch {
      host = "";
    }

    // Prove DB connectivity and that the "businesses" table is reachable
    const { error } = await supabase
      .from("businesses")
      .select("id")
      .limit(1);

    if (error) {
      res.status(500).json({
        ok: false,
        error: `Supabase query error: ${error.message}`,
      });
      return;
    }

    res.status(200).json({
      ok: true,
      supabaseUrlHost: host,
      tablesReachable: true,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unknown error in /api/health";
    res.status(500).json({
      ok: false,
      error: message,
    });
  }
}