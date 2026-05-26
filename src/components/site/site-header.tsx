import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Button } from "@/design-system/button";

type SiteHeaderProps = {
  /** Show marketing nav links (landing). */
  marketing?: boolean;
  trailing?: ReactNode;
};

export function SiteHeader({ marketing = false, trailing }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0 transition hover:opacity-90">
          <BrandLockup size="md" />
        </Link>

        {marketing ? (
          <nav className="hidden items-center gap-6 md:flex" aria-label="التنقل الرئيسي">
            <a href="#features" className="text-sm font-bold text-[var(--muted-strong)] hover:text-[var(--brand)]">
              المميزات
            </a>
            <a href="#templates" className="text-sm font-bold text-[var(--muted-strong)] hover:text-[var(--brand)]">
              القوالب
            </a>
            <a href="#workflow" className="text-sm font-bold text-[var(--muted-strong)] hover:text-[var(--brand)]">
              كيف يعمل
            </a>
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          {trailing}
          {marketing ? (
            <>
              <Button href="/templates" variant="ghost" className="hidden sm:inline-flex">
                القوالب
              </Button>
              <Button href="/studio" variant="brand">
                افتح الاستوديو
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
