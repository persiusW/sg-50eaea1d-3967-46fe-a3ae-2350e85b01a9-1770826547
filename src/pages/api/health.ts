import type { NextApiRequest, NextApiResponse } from "next";
import { supabase, validateSupabaseConfig } from "@/integrations/supabase/client";

interface HealthOk {
  ok: true;
  supabaseUrlHost: string;
  anonKeyPrefix: string;
  tablesReachable: boolean;
}

interface HealthError {
  ok: false;
  error: string;
  supabaseUrlHost?: string;
  anonKeyPrefix?: string;
}

type HealthResponse = HealthOk | HealthError;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
): Promise<void> {
  try {
    // Validate configuration first
    const configCheck = validateSupabaseConfig();
    if (!configCheck.valid) {
      res.status(500).json({
        ok: false,
        error: configCheck.error || "Invalid Supabase configuration",
      });
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    let host = "";
    try {
      host = new URL(supabaseUrl).host;
    } catch {
      host = "invalid-url";
    }

    const anonKeyPrefix = anonKey.slice(0, 6);

    const { error } = await supabase
      .from("businesses")
      .select("id")
      .limit(1);

    if (error) {
      res.status(500).json({
        ok: false,
        error: `Supabase query error: ${error.message}`,
        supabaseUrlHost: host,
        anonKeyPrefix,
      });
      return;
    }

    res.status(200).json({
      ok: true,
      supabaseUrlHost: host,
      anonKeyPrefix,
      tablesReachable: true,
    });
  } catch (e) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    let host = "";
    try {
      host = new URL(supabaseUrl).host;
    } catch {
      host = "url-parse-error";
    }

    const anonKeyPrefix = anonKey.slice(0, 6);
    const message = e instanceof Error ? e.message : "Unknown error in /api/health";

    res.status(500).json({
      ok: false,
      error: message,
      supabaseUrlHost: host,
      anonKeyPrefix,
    });
  }
}