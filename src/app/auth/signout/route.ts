import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();

  return NextResponse.redirect(new URL("/login?status=signed-out", request.url));
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();

  return NextResponse.redirect(new URL("/login?status=signed-out", request.url));
}
