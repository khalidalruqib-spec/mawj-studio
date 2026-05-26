# مهام Codex — تنفيذ متوازي مع Cursor

انسخ البرومبت المناسب إلى Codex **على فرع منفصل** ثم افتح PR. Cursor يراجع الـ PR بعد الدمج أو قبله.

---

## المهمة 1 — تقسيم الاستوديو (أولوية عالية)

**الفرع:** `refactor/split-studio-components`  
**لا تلمس:** `src/components/marketing/`, `src/app/page.tsx`, `src/app/studio/`

### البرومبت لـ Codex

```
أنت تعمل على repo mawj-studio (Next.js 16, TypeScript).

المطلوب: تقسيم src/components/professional-video-studio.tsx (~6800 سطر) إلى وحدات دون تغيير السلوك.

القواعد:
1. أنشئ مجلد src/components/studio/ وفيه:
   - index.ts يُعيد export ProfessionalVideoStudio
   - studio-shell.tsx (layout: header + grid + panel routing)
   - panels/ (ملف لكل PanelId: editor, timeline, captions, exports, stock, ai-tools, ad-maker, brand, collaboration, projects, settings, assistant)
   - preview/ (TemplateProjectPreview, video preview helpers الموجودة حالياً)
   - hooks/ (useTemplateDraftLoader, useProjectPersistence — استخرج useEffect الكبيرة)
2. professional-video-studio.tsx يصبح re-export رفيع (~10 أسطر) للتوافق مع الاستيرادات القديمة.
3. لا تغيّر API routes ولا src/lib/*.
4. حافظ على كل class names و CSS variables كما هي.
5. npm run build && npm run lint يجب أن ينجحا.

معيار القبول:
- نفس UX في /studio
- تحميل القالب من sessionStorage يعمل
- روابط /templates و /studio كما هي

عند الانتهاء: commit واحد واضح + وصف PR بالعربية يذكر الملفات المنقولة.
```

---

## المهمة 2 — Supabase Auth + RLS

**الفرع:** `feat/auth-rls-projects`  
**يعتمد على:** migration موجودة في `supabase/migrations/`

### البرومبت لـ Codex

```
مشروع mawj-studio يستخدم Supabase بدون مصادقة مستخدمين (service role فقط).

نفّذ:
1. Supabase Auth (email magic link أو Google — الأبسط أولاً).
2. صفحات /login و /auth/callback باستخدام @supabase/ssr الموجود في src/lib/supabase/.
3. middleware.ts يحمي /studio و /api/projects/* (ما عدا health إن وُجد).
4. migration جديدة: RLS على projects و render_jobs بحيث auth.uid() = user_id.
5. أضف user_id UUID إلى projects (backfill nullable ثم required للجديد).
6. حدّث src/lib/projects.ts لربط المشاريع بالمستخدم الحالي.
7. حدّث .env.example بمتغيرات Auth إن لزم.

لا تكسر الوضع بدون Supabase: احتفظ بـ in-memory fallback في project-store.ts للتطوير المحلي فقط عندما SUPABASE غير مضبوط.

معيار القبول:
- مستخدمان لا يريان مشاريع بعضهما
- /studio يوجّه غير المسجّل إلى /login
- npm run build ينجح

PR body: خطوات اختبار يدوية + SQL migration كاملة.
```

---

## المهمة 3 — قالب عيادة ثانٍ (اختياري إذا انتهى Cursor من الأول)

**الفرع:** `feat/template-clinic-v2` — فقط إذا لم يُدمج قالب clinic-appointment من Cursor.

### البرومبت لـ Codex

```
أضف قالب src/templates/clinic-appointment-v2/ مع:
- template.json (9:16, 20s, فئة "Clinics" أو "Healthcare")
- 5 مشاهد: hook سؤال → الخدمة → طبيب/ثقة → مواعيد → CTA واتساب
- requiredInputs عربية: clinicName, serviceTitle, doctorName, phone, logo, brandColor
- thumbnail.svg و preview.svg بألوان teal #7ef2bc
- safeMargins مثل tiktok-hook-sprint (top 160, bottom 260)

تأكد أن getTemplates() يلتقط المجلد تلقائياً و npm run build ينجح.
```

---

## ترتيب التنفيذ المقترح

| # | المهمة | من ينفّذ | الفرع |
|---|--------|---------|-------|
| 1 | Landing + design system + /studio | Cursor | `feat/landing-design-system-v2` |
| 2 | تقسيم الاستوديو | Codex | `refactor/split-studio-components` |
| 3 | Auth + RLS | Codex | `feat/auth-rls-projects` |
| 4 | مراجعة PRs | Cursor / أنت | — |

---

## بعد كل PR من Codex

1. `git fetch && git checkout <branch>`
2. `npm install && npm run build && npm run lint`
3. افتح `/studio` و `/templates` يدوياً
4. اترك تعليق على PR أو اطلب من Cursor "راجع PR #X"
