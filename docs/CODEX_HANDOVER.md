# Codex Handover — Mawj Studio

**آخر تحديث:** 2026-05-26  
**المالك:** خالد  
**المستودع:** https://github.com/khalidalruqib-spec/mawj-studio  
**الإنتاج:** https://mawj-studio.vercel.app

---

## 1. ما هو المشروع؟

**Mawj Studio** — منصة تحرير فيديو قصير بالذكاء الاصطناعي، عربية أولاً (RTL)، موجّهة للسوق السعودي/العربي.

| المسار | الوظيفة |
|--------|---------|
| `/` | Landing تسويقية |
| `/studio` | المحرر الكامل (ProfessionalVideoStudio) |
| `/templates` | سوق القوالب (24 قالب JSON) |

**التميّز:** أتمتة حسب أسلوب التحرير + قوالب CapCut/TikTok + استوديو في المتصفح — ليس مونتاج يدوي عام.

---

## 2. حالة العمل الآن (اقرأ قبل أي commit)

### ✅ مدمج على `main` (لا تعيده)

| PR | المحتوى |
|----|---------|
| #1 | OG image + brand icon |
| #2 | Landing polish (FAQ + pricing teaser) |
| #4 | 5 قوالب CapCut/TikTok جديدة |

**Commits حديثة على main:**
- Landing + `/studio` route + design system
- 24 template (18 قديم + 5 CapCut + clinic)
- CI workflow (`.github/workflows/ci.yml`)
- Vercel deploy config

### 🟡 PR مفتوح — أولويتك #1

**PR #3:** https://github.com/khalidalruqib-spec/mawj-studio/pull/3  
**الفرع:** `refactor/split-studio-components`  
**الحالة:** DRAFT — Gemini ✅ — CI build ❌

**ما أنجزته أنت (Codex) في PR #3:**
- تقسيم `studio-shell.tsx` إلى:
  - `src/components/studio/foundation.ts`
  - `src/components/studio/ui.tsx`
  - `src/components/studio/utils.ts`
  - `src/components/studio/hooks/`
  - `src/components/studio/panels/` (13 لوحة)
  - `src/components/studio/preview/`
- `professional-video-studio.tsx` = re-export

**ما يلزم قبل الدمج (Cursor راجع ووافق مشروط):**
```bash
git fetch origin
git checkout refactor/split-studio-components
git rebase origin/main
npm install                    # يحدّث package-lock.json
npm run build && npm run lint
git add package-lock.json
git commit -m "chore: sync lockfile after rebase on main"
git push --force-with-lease
```
ثم: أزل Draft من PR #3 → انتظر CI أخضر → اطلب merge.

**ملاحظة:** `studio-shell.tsx` ما زال ~4,000 سطر — هذا **مرحلة 1** مقبولة. لا تعيد كتابة كل شيء.

### ❌ لا تلمس (Cursor يعمل عليها أو مدمجة)

- `src/components/marketing/`
- `src/app/page.tsx`
- قوالب CapCut الجديدة في `src/templates/tiktok-3-reasons/` إلخ (إلا إذا طُلب ترقية)

---

## 3. Tech Stack (لا تخترع conventions جديدة)

| Layer | Tech |
|-------|------|
| Framework | Next.js **16** App Router, React 19, TypeScript |
| Styling | Tailwind v4 + tokens في `src/app/globals.css` |
| State | Zustand (`src/lib/video-project-store.ts`) |
| DB | Supabase Postgres — **بدون auth للمستخدمين حالياً** |
| AI | OpenAI (`src/lib/openai-edit.ts`), Whisper اختياري |
| Export | FFmpeg.wasm + `browser-template-renderer.ts` |
| COEP | `require-corp` في `next.config.ts` — Stock يستخدم `/api/stock/proxy` |

**قاعدة Next.js:** اقرأ `node_modules/next/dist/docs/` قبل API جديد — هذا Next 16 وليس نسختك القديمة.

---

## 4. بنية الملفات المهمة

```
src/
├── app/
│   ├── page.tsx              → Landing
│   ├── studio/page.tsx       → المحرر
│   ├── templates/page.tsx    → سوق القوالب
│   └── api/                  → لا تغيّر بدون طلب صريح
├── components/
│   ├── studio/               → PR #3 — الاستوديو
│   ├── marketing/            → Landing (Cursor)
│   ├── template-browser.tsx  → سوق القوالب
│   └── professional-video-studio.tsx → re-export
├── lib/
│   ├── video-template-engine.ts   → محرك القوالب JSON
│   ├── video-template-store.ts    → loader من src/templates/
│   ├── browser-template-renderer.ts
│   └── projects.ts                → Supabase projects
├── templates/*/template.json      → 24 قالب
└── design-system/                 → Button, Badge
docs/
├── architecture.md
├── capcut-engine-blueprint.md
└── CODEX_HANDOVER.md              → هذا الملف
```

---

## 5. قواعد العمل (إلزامية)

1. **فرع منفصل لكل مهمة** — PR صغير (< 500 سطر مراجعة إن أمكن)
2. **لا commit على `main` مباشرة** — PR فقط
3. **قبل كل PR:** `npm run build && npm run lint`
4. **لا تغيّر** `src/lib/*` إلا في مهمة Auth/RLS أو طلب صريح
5. **حافظ على** class names و CSS variables (`--brand`, `.panel`, `.btn-brand`)
6. **RTL عربي** — النصوص الافتراضية بالعربية في القوالب
7. **Worker path:** من `preview/index.tsx` استخدم `../../../workers/timeline.worker.ts`
8. **PR body بالعربية** + Test plan checklist
9. **لا تدمج PR #3** حتى CI أخضر بعد rebase

---

## 6. مهامك بالترتيب (بعد إصلاح PR #3)

### المهمة A — إنهاء PR #3 (الآن)

انظر القسم 2 أعلاه. بعد merge → انتقل للمهمة B.

---

### المهمة B — Supabase Auth + RLS

**الفرع:** `feat/auth-rls-projects` (من `main` بعد merge PR #3)

```
مشروع mawj-studio — أضف Supabase Auth + RLS.

السياق:
- Supabase موجود لكن service role فقط، بدون login
- migration: supabase/migrations/202605250001_projects_and_video_storage.sql
- @supabase/ssr في src/lib/supabase/

نفّذ:
1. Auth (magic link email أو Google — الأبسط)
2. /login + /auth/callback
3. middleware.ts يحمي /studio و /api/projects/*
4. migration جديدة: user_id على projects + RLS auth.uid()
5. حدّث src/lib/projects.ts
6. fallback in-memory عند غياب Supabase (تطوير محلي)
7. حدّث .env.example

معيار القبول:
- مستخدمان لا يريان مشاريع بعضهما
- /studio → /login للزائر
- npm run build && npm run lint

PR بالعربية + SQL migration + خطوات اختبار.
```

---

### المهمة C — ترقية القوالب القديمة (بعد B أو بالتوازي)

**الفرع:** `feat/upgrade-legacy-templates`

القوالب الضعيفة (مقارنة بـ CapCut الجديدة):
- `product-ad`
- `clinic-appointment`
- `real-estate-ad`
- `restaurant-offer`
- `before-after`

```
رقّي القوالب القديمة في src/templates/ لتطابق جودة capcut-flash-sale و tiktok-3-reasons:

لكل قالب:
- نصوص عربية افتراضية
- 4-6 مشاهد بقصات 2-3 ثوانٍ
- pop/slide/bounce animations
- badges + CTA shapes
- safeMargins: top 160, bottom 260
- thumbnail.svg + preview.svg

لا تغيّر requiredInputs keys الموجودة (توافق خلفي).
npm run build ينجح.
PR واحد أو PR لكل 2-3 قوالب.
```

---

### المهمة D — studio-shell مرحلة 2 (اختياري)

**الفرع:** `refactor/studio-shell-phase2`

```
بعد merge PR #3: استخرج من studio-shell.tsx (~4000 سطر):
- handlers (upload, generate, render, transcribe) → hooks/use-studio-actions.ts
- helper functions → utils/ أو lib/ (إن كانت pure)

الهدف: studio-shell.tsx < 1500 سطر
لا تغيّر السلوك. npm run build ينجح.
```

---

## 7. قوالب CapCut المدمجة (مرجع للجودة)

| ID | النمط |
|----|-------|
| `tiktok-3-reasons` | 3 أسباب مرقّمة |
| `capcut-flash-sale` | Flash sale + سعر قبل/بعد |
| `tiktok-pov-story` | POV + UGC video |
| `capcut-karaoke-captions` | كابشن جملة بجملة |
| `capcut-news-alert` | عاجل + ticker |

**هيكل template.json:** `src/lib/video-template-engine.ts`  
**Loader:** `src/lib/video-template-store.ts` — مجلد = قالب تلقائياً

---

## 8. النشر (Vercel)

- **Production:** https://mawj-studio.vercel.app
- Push إلى `main` → Vercel ينشر (أو `npx vercel deploy --prod -y`)
- Env مهم: `NEXT_PUBLIC_APP_URL=https://mawj-studio.vercel.app`

---

## 9. المراجعة

| من | ماذا |
|----|------|
| **Gemini bot** | يراجع PRs تلقائياً (`.github/workflows/gemini-bot.yml`) |
| **Cursor** | يراجع PRs يدوياً — اترك تعليق "راجع PR #X" |
| **CI** | `npm ci` → lint → build على كل PR |

---

## 10. برومبت البداية (انسخه لـ Codex كاملاً)

```
أنت Codex تعمل على Mawj Studio.

اقرأ أولاً: docs/CODEX_HANDOVER.md في المستودع.

مهمتك الآن بالترتيب:
1. أصلح PR #3 (rebase على main + npm install + sync lockfile + push)
2. بعد merge PR #3 → ابدأ feat/auth-rls-projects
3. لا تلمس marketing/ أو landing/ أو قوالب CapCut الجديدة

قواعد:
- فرع منفصل + PR بالعربية
- npm run build && npm run lint قبل كل push
- لا تغيّر src/lib/* إلا في مهمة Auth
- worker path: ../../../workers/timeline.worker.ts من preview/

Repo: https://github.com/khalidalruqib-spec/mawj-studio
Live: https://mawj-studio.vercel.app
PR #3: https://github.com/khalidalruqib-spec/mawj-studio/pull/3
```

---

## 11. جهات الاتصال / Escalation

- **قرارات منتج:** خالد
- **مراجعة كود:** Cursor (اطلب "راجع PR #X")
- **تعارض مع Cursor:** لا تعدّل ملفات Cursor النشطة — افتح PR منفصل

---

*End of handover.*
