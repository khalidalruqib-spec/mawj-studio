import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/design-system/badge";
import { signInWithMagicLink } from "@/app/login/actions";
import { BRAND } from "@/lib/brand";
import { createSupabaseServerClient, hasSupabaseAuthEnv } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل دخولك إلى الاستوديو لحفظ مشاريعك وملفاتك بأمان.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    email?: string;
    error?: string;
    next?: string;
    sent?: string;
    status?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const next = sanitizeNextPath(params.next ?? "/studio");
  const authReady = hasSupabaseAuthEnv();

  if (authReady) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

    if (user) redirect(next);
  }

  return (
    <main className="min-h-screen bg-[--background] text-[--foreground]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <section className="space-y-6 text-right">
            <Badge tone="brand">حساب آمن للمشاريع</Badge>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-black leading-tight text-white md:text-6xl">
                ادخل إلى {BRAND.fullName} واحفظ مشاريعك بعيداً عن الفوضى.
              </h1>
              <p className="max-w-xl text-base font-semibold leading-8 text-white/62">
                تسجيل الدخول يربط المشاريع والملفات بحسابك، ويفتح لنا المرحلة التالية:
                فرق العمل، القوالب الخاصة، وسجل التصدير.
              </p>
            </div>
            <div className="grid max-w-xl gap-3 sm:grid-cols-3">
              {["مشاريع خاصة", "رفع آمن", "جلسة محمية"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-sm font-black text-white">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/12 bg-white/[0.055] p-5 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="mb-5 space-y-2 text-right">
              <h2 className="text-2xl font-black text-white">تسجيل الدخول</h2>
              <p className="text-sm font-semibold leading-6 text-white/55">
                سنرسل لك رابط دخول آمن على البريد. بدون كلمات مرور.
              </p>
            </div>

            {!authReady ? (
              <div className="space-y-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-right">
                <p className="text-sm font-black text-amber-200">وضع التطوير المحلي مفعل</p>
                <p className="text-xs font-semibold leading-6 text-amber-100/80">
                  متغيرات Supabase غير مضبوطة، لذلك الاستوديو يفتح محلياً بدون تسجيل دخول.
                </p>
                <Link className="btn-brand inline-flex w-full justify-center" href={next}>
                  فتح الاستوديو
                </Link>
              </div>
            ) : (
              <form action={signInWithMagicLink} className="space-y-4">
                <input type="hidden" name="next" value={next} />
                <label className="block space-y-2 text-right">
                  <span className="text-xs font-black uppercase tracking-[0.24em] text-white/45">
                    البريد الإلكتروني
                  </span>
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    defaultValue={params.email ?? ""}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-left text-base font-bold text-white outline-none transition focus:border-[--brand] focus:ring-4 focus:ring-[--brand]/15"
                    dir="ltr"
                  />
                </label>

                {params.sent ? (
                  <p className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-right text-sm font-bold leading-6 text-emerald-100">
                    أرسلنا رابط الدخول إلى بريدك. افتح الرابط للعودة إلى الاستوديو.
                  </p>
                ) : null}

                {params.error ? (
                  <p className="rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-right text-sm font-bold leading-6 text-red-100">
                    {params.error}
                  </p>
                ) : null}

                {params.status === "signed-out" ? (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right text-sm font-bold leading-6 text-white/70">
                    تم تسجيل الخروج بنجاح.
                  </p>
                ) : null}

                <button type="submit" className="btn-brand w-full">
                  إرسال رابط الدخول
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function sanitizeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/studio";
  return value;
}
