import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Captions,
  Clapperboard,
  Film,
  Layers3,
  Mic,
  Newspaper,
  Rocket,
  ShoppingBag,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/design-system/badge";
import { Button } from "@/design-system/button";
import { BRAND } from "@/lib/brand";

const FEATURES = [
  {
    icon: WandSparkles,
    title: "خطة تحرير بالذكاء الاصطناعي",
    body: "ارفع المقطع، اختر أسلوب السعودي الفيرال أو البراند الفاخر، واحصل على hook وقصات وكابشن جاهزة.",
  },
  {
    icon: Layers3,
    title: "٢٤+ قالب CapCut/TikTok",
    body: "تيك توك، CapCut، إعلانات، عقار، مطاعم، بودكاست — كل قالب يتحول لمشروع مونتاج كامل.",
  },
  {
    icon: Captions,
    title: "ترجمة عربية دقيقة",
    body: "Whisper محلي أو OpenAI — كلمات على الخط الزمني وجاهزة للكابشن المتحرك.",
  },
  {
    icon: Clapperboard,
    title: "تصدير من المتصفح",
    body: "قص، معاينة، وتصدير 9:16 و 16:9 بدون تثبيت برامج — جاهز للنشر.",
  },
] as const;

const TEMPLATE_CATEGORIES = [
  { icon: Zap, label: "تيك توك / CapCut", count: "9+ قوالب" },
  { icon: ShoppingBag, label: "إعلانات المنتجات", count: "5+ قوالب" },
  { icon: Building2, label: "عقار ومطاعم", count: "2 قوالب" },
  { icon: Mic, label: "بودكاست", count: "1 قالب" },
  { icon: Newspaper, label: "أخبار", count: "2 قالب" },
  { icon: Users, label: "براند شخصي", count: "2 قوالب" },
  { icon: BadgeCheck, label: "عيادات", count: "1 قالب" },
] as const;

const STEPS = [
  { n: "01", title: "اختر قالباً أو ارفع فيديو", body: "ابدأ من السوق أو من الاستوديو مباشرة." },
  { n: "02", title: "خصّص النص والعلامة", body: "عبّئ الحقول العربية — الشعار والألوان لاحقاً في Brand Kit." },
  { n: "03", title: "ولّد وعدّل", body: "الذكاء الاصطناعي يقترح القص؛ أنت تتحكم بالتايملاين." },
  { n: "04", title: "صدّر للمنصات", body: "TikTok، Reels، Shorts — بنسبة العرض الصحيحة." },
] as const;

const FAQ = [
  {
    q: "هل المنصة بديل عن CapCut؟",
    a: `${BRAND.nameAr} مصمم للأتمتة والقوالب العربية داخل المتصفح. الهدف: من رفع الفيديو إلى نسخة جاهزة للنشر بأقل خطوات.`,
  },
  {
    q: "هل أحتاج برامج أو جهاز قوي؟",
    a: "لا. تقدر تبدأ من المتصفح. بعض عمليات التصدير قد تعتمد على قدرات جهازك أو الرندر السحابي حسب الإعداد.",
  },
  {
    q: "هل يدعم العربية بالكامل؟",
    a: "نعم — واجهة RTL وخطوط عربية وقوالب عربية. الترجمة تعمل عبر Whisper (اختياري) أو OpenAI أو وضع تجريبي.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(0,180,216,0.14),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,123,0,0.08),transparent_70%)]" />
      </div>

      <SiteHeader marketing />

      <main className="relative">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge tone="brand" className="mb-5">
                <PlatformLogo size={14} className="!shadow-none" aria-hidden="true" />
                {BRAND.taglineAr}
              </Badge>
              <h1 className="text-balance text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                حوّل فكرتك إلى
                <span className="text-[var(--brand)]"> فيديو جاهز للنشر </span>
                في دقائق
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-base font-semibold leading-7 text-[var(--muted-strong)] sm:text-lg">
                {BRAND.fullName} يجمع قوالب سعودية جاهزة، تحريراً ذكياً، وكابشن عربي — مصمم لمبدعي تيك توك، المتاجر، العيادات، والوكالات.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/studio" variant="brand" className="min-h-[3rem] px-6 text-base">
                  <Rocket className="h-5 w-5" aria-hidden="true" />
                  ابدأ مجاناً
                </Button>
                <Button href="/templates" variant="ghost" className="min-h-[3rem] px-6 text-base">
                  <Film className="h-5 w-5" aria-hidden="true" />
                  استكشف القوالب
                </Button>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-8">
                <div>
                  <dt className="text-2xl font-black text-[var(--brand)]">24+</dt>
                  <dd className="text-xs font-bold text-[var(--muted)]">قالب جاهز</dd>
                </div>
                <div>
                  <dt className="text-2xl font-black">6</dt>
                  <dd className="text-xs font-bold text-[var(--muted)]">أساليب تحرير</dd>
                </div>
                <div>
                  <dt className="text-2xl font-black">RTL</dt>
                  <dd className="text-xs font-bold text-[var(--muted)]">عربي أولاً</dd>
                </div>
              </dl>
            </div>

            <div className="panel-raised relative overflow-hidden p-1">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(126,242,188,0.08),transparent_50%,rgba(167,139,250,0.06))]" />
              <div className="relative aspect-[9/16] max-h-[520px] w-full overflow-hidden rounded-[calc(var(--radius-lg)-4px)] border border-[var(--line)] bg-[#0a0c12]">
                <div className="flex h-full flex-col justify-between p-5">
                  <div className="space-y-2">
                    <span className="badge badge-brand text-[10px]">Hook</span>
                    <p className="text-lg font-black leading-snug">هل جربت تسوّق منتجك بدون فيديو قصير؟</p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                    <p className="text-center text-2xl font-black text-[var(--brand)]">+٣٠٠٪</p>
                    <p className="text-center text-xs font-bold text-[var(--muted)]">تفاعل بعد أول أسبوع</p>
                  </div>
                  <p className="rounded-lg bg-[var(--brand)] py-2 text-center text-sm font-black text-white">
                    اطلب العرض الآن ←
                  </p>
                </div>
              </div>
              <p className="relative px-4 py-3 text-center text-[11px] font-semibold text-[var(--muted)]">
                معاينة قالب TikTok Hook — يُفتح كمشروع قابل للتعديل
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-y border-[var(--line)] bg-[var(--panel)]/50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-black sm:text-3xl">لماذا {BRAND.nameAr} أقوى من محرر عام؟</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm font-semibold text-[var(--muted)]">
              ليس مونتاج يدوي فارغ — أتمتة حسب الأسلوب + قوالب محلية + استوديو كامل في المتصفح.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="panel p-5 transition hover:border-[var(--brand)]">
                    <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-sm font-black">{feature.title}</h3>
                    <p className="mt-2 text-xs font-semibold leading-6 text-[var(--muted)]">{feature.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">سوق القوالب</h2>
                <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                  كل قالب = مشاهد + طبقات + كابشن + تصدير 9:16 أو 16:9
                </p>
              </div>
              <Button href="/templates" variant="ghost">
                عرض الكل
              </Button>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <li key={cat.label}>
                    <Link
                      href="/templates"
                      className="panel flex items-center gap-4 p-4 transition hover:border-[var(--brand)] hover:shadow-[var(--shadow-brand)]"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--panel-soft)] text-[var(--brand)]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-black">{cat.label}</p>
                        <p className="text-xs font-semibold text-[var(--muted)]">{cat.count}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="border-t border-[var(--line)] bg-[var(--panel-soft)]/30 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-black">من الفكرة إلى النشر</h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <li key={step.n} className="panel p-5">
                  <span className="text-3xl font-black text-[var(--brand)]/40">{step.n}</span>
                  <h3 className="mt-2 text-sm font-black">{step.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-[var(--muted)]">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 text-center">
              <Button href="/studio" variant="brand" className="min-h-[3rem] px-8 text-base">
                ادخل الاستوديو الآن
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="border-t border-[var(--line)] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-black sm:text-3xl">ابدأ مجاناً ثم ارتقِ عند الحاجة</h2>
              <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                هذه صفحة تسويقية للـ MVP — التسعير النهائي يتحدد لاحقاً. حالياً ركّزنا على جودة القوالب وتجربة الاستوديو.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <div className="panel p-6">
                <p className="text-xs font-black text-[var(--muted)]">Free</p>
                <p className="mt-2 text-2xl font-black">0</p>
                <ul className="mt-4 space-y-2 text-xs font-semibold text-[var(--muted-strong)]">
                  <li>قوالب مختارة</li>
                  <li>تجربة الاستوديو</li>
                  <li>تصدير أساسي</li>
                </ul>
              </div>
              <div className="panel-raised p-6">
                <p className="text-xs font-black text-[var(--brand)]">Creator</p>
                <p className="mt-2 text-2xl font-black">للصنّاع</p>
                <ul className="mt-4 space-y-2 text-xs font-semibold text-[var(--muted-strong)]">
                  <li>بدون علامة مائية</li>
                  <li>قوالب أكثر + Brand Kit</li>
                  <li>تصدير 1080p</li>
                </ul>
              </div>
              <div className="panel p-6">
                <p className="text-xs font-black text-[var(--muted)]">Pro</p>
                <p className="mt-2 text-2xl font-black">للفِرق</p>
                <ul className="mt-4 space-y-2 text-xs font-semibold text-[var(--muted-strong)]">
                  <li>قوالب Premium</li>
                  <li>تعاون ومراجعات</li>
                  <li>تصدير أعلى</li>
                </ul>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Button href="/studio" variant="brand" className="min-h-[3rem] px-8 text-base">
                جرّب الاستوديو
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-[var(--line)] bg-[var(--panel)]/40 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-black">أسئلة سريعة</h2>
            <div className="mx-auto mt-8 max-w-3xl space-y-3">
              {FAQ.map((item) => (
                <details key={item.q} className="panel p-5">
                  <summary className="cursor-pointer text-sm font-black text-[var(--foreground)]">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-xs font-semibold leading-6 text-[var(--muted)]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLockup size="sm" showTagline={false} />
            <p className="text-xs font-semibold text-[var(--muted)]">
              © {new Date().getFullYear()} {BRAND.fullName}
            </p>
          </div>
          <div className="flex gap-4 text-xs font-semibold text-[var(--muted)]">
            <Link href="/templates" className="hover:text-[var(--brand)]">
              القوالب
            </Link>
            <Link href="/studio" className="hover:text-[var(--brand)]">
              الاستوديو
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
