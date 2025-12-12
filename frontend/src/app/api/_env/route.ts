import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const vars = {
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };

  // #region agent log (debug) H1
  fetch("http://127.0.0.1:7242/ingest/2289d1a0-0e4a-46c0-a7bc-1dca2803d1f5", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "env-check",
      hypothesisId: "H1",
      location: "frontend/src/app/api/_env/route.ts:GET:entry",
      message: "Env presence check request received",
      data: { nodeEnv: process.env.NODE_ENV ?? null },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  // #region agent log (debug) H2
  fetch("http://127.0.0.1:7242/ingest/2289d1a0-0e4a-46c0-a7bc-1dca2803d1f5", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "env-check",
      hypothesisId: "H2",
      location: "frontend/src/app/api/_env/route.ts:GET:vars",
      message: "Env presence booleans computed",
      data: { vars },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return NextResponse.json({ ok: true, nodeEnv: process.env.NODE_ENV ?? null, vars }, { status: 200 });
}


