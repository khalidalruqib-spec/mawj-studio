"use server";

import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/site";
import { createSupabaseServerClient, hasSupabaseAuthEnv } from "@/lib/supabase/server";

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = sanitizeNextPath(String(formData.get("next") ?? "/studio"));

  if (!hasSupabaseAuthEnv()) {
    redirect(next);
  }

  if (!email || !email.includes("@")) {
    redirect(`/login?error=${encodeURIComponent("اكتب بريد إلكتروني صحيح.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(`/login?error=${encodeURIComponent("إعدادات Supabase غير مكتملة.")}&next=${encodeURIComponent(next)}`);
  }

  const callbackUrl = new URL("/auth/callback", getSiteUrl());
  callbackUrl.searchParams.set("next", next);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(
    `/login?sent=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
  );
}

function sanitizeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/studio";
  return value;
}
