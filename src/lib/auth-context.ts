import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient, hasSupabaseAuthEnv } from "@/lib/supabase/server";

export type AuthContext = {
  isAuthEnabled: boolean;
  user: User | null;
  userId: string | null;
};

export async function getAuthContext(): Promise<AuthContext> {
  if (!hasSupabaseAuthEnv()) {
    return {
      isAuthEnabled: false,
      user: null,
      userId: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      isAuthEnabled: false,
      user: null,
      userId: null,
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      isAuthEnabled: true,
      user: null,
      userId: null,
    };
  }

  return {
    isAuthEnabled: true,
    user,
    userId: user.id,
  };
}

export async function requireAuthContext() {
  const context = await getAuthContext();

  if (context.isAuthEnabled && !context.userId) {
    throw new Error("UNAUTHENTICATED");
  }

  return context;
}

export function isUnauthenticatedError(error: unknown) {
  return error instanceof Error && error.message === "UNAUTHENTICATED";
}
