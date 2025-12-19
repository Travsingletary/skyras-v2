import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const vars = {
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };

  return NextResponse.json({ ok: true, nodeEnv: process.env.NODE_ENV ?? null, vars }, { status: 200 });
}


