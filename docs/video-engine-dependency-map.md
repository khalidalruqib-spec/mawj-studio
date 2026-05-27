# Video Engine Dependency Map

آخر تحديث: 2026-05-26

هذا الملف يحدد كيف تستخدم Mawj Studio مكتبات الفيديو والحركة الجديدة. الهدف ليس تكديس مكتبات، بل توزيع واضح للمسؤوليات حتى يبقى المحرر data-driven وقابل للرندر.

## القاعدة الذهبية

لا تجعل أي مكتبة هي مصدر الحقيقة.

مصدر الحقيقة في Mawj هو:

```text
VideoProject
  Assets
  Scenes
  Layers
  Tracks
  TimelineItems
  Keyframes
  Effects
  ExportSettings
```

كل مكتبة يجب أن تقرأ من هذا النموذج أو تكتب إليه، وليس إلى React state مخفي أو DOM ثابت.

## المكتبات المثبتة ودورها

| المكتبة | الدور في Mawj | المرحلة المناسبة |
| --- | --- | --- |
| `remotion` | تعريف compositions و frame-based video logic | Preview + render |
| `@remotion/player` | معاينة داخل المتصفح | Editor preview |
| `@remotion/captions` | كابشن و SRT helpers | Captions engine |
| `@remotion/renderer` | رندر compositions إلى MP4 في server/worker | Cloud render / server render |
| `@ffmpeg/ffmpeg` | FFmpeg داخل المتصفح للمهام الخفيفة | Trim, audio extract, quick export |
| `@ffmpeg/util` | أدوات تحميل وكتابة ملفات FFmpeg.wasm | Browser processing |
| `fluent-ffmpeg` | بناء أوامر FFmpeg في Node workers | Cloud render worker |
| `gsap` | معاينة motion احترافية داخل المحرر | Template motion preview |
| `animejs` | حركات خفيفة للعناصر والـ micro-interactions | UI/template preview |
| `lottie-web` | ملصقات وتحريكات After Effects بصيغة JSON | Stickers, intros, logo animation |
| `konva` + `react-konva` | Canvas editor للعناصر القابلة للسحب والتحجيم | Preview canvas |
| `fabric` | مرجع/بديل Canva-like للـ canvas serialization | لا يستخدم مع Konva في نفس المحرر الآن |
| `three` | مؤثرات 3D لاحقة | Advanced visual effects |
| `playwright-core` | تشغيل Chromium موفر خارجياً لتسجيل previews أو render workers | Preview generation / workers |
| `wavesurfer.js` | عرض waveform للصوت | Audio timeline |
| `dnd-kit` | سحب timeline items بين tracks | Timeline editor |
| `zustand` | project store و undo/redo | Editor state |
| `zod` | validation للقوالب والمشاريع و AI JSON | Trust boundaries |

## Remotion

استخدم Remotion عندما نحتاج نتيجة frame-perfect:

- تحويل `VideoProject` إلى `Composition`.
- تطبيق keyframes حسب رقم الإطار.
- عرض captions والـ overlays بنفس منطق التصدير.
- بناء preview مطابق للتصدير قدر الإمكان.

ممنوع:

- وضع بيانات المشروع داخل React components فقط.
- استخدام CSS transitions كمنطق رندر نهائي.

## FFmpeg

استخدم `@ffmpeg/ffmpeg` داخل المتصفح للمهام الصغيرة:

- قص مقطع قصير.
- استخراج audio.
- تجربة burn-in captions.
- ضغط سريع.

استخدم `fluent-ffmpeg` فقط داخل Node render workers:

- دمج audio/video.
- concat.
- filters.
- export variants.

ملاحظة: `fluent-ffmpeg` لا يشحن binary لـ FFmpeg. الـ worker يجب أن يملك `ffmpeg` مثبتاً في البيئة.

## Playwright Core

اخترنا `playwright-core` بدل `playwright` حتى لا ينزل Chromium داخل CI أو Vercel.

الاستخدام الصحيح:

- Render worker يوفر Chromium بنفسه.
- Playwright يفتح preview route أو HTML composition.
- يلتقط frames أو screenshots للـ preview فقط.

لا تعتمد على Playwright كقلب التصدير النهائي إذا كان Remotion يستطيع تنفيذ نفس المشهد.

## GSAP و Anime.js

استخدم GSAP للمعاينة الحية للحركات الثقيلة:

- pop
- slide
- bounce
- reveal
- zoom

استخدم Anime.js للـ UI والحركات الخفيفة.

مهم: motion schema في `template.json` هو المصدر. GSAP/Anime ينفذان schema فقط.

## Lottie

Lottie layer يجب أن يكون asset عادي:

```json
{
  "id": "like-sticker",
  "type": "lottie",
  "src": "{{likeAnimation}}",
  "x": 780,
  "y": 320,
  "width": 180,
  "height": 180,
  "start": 2,
  "duration": 4
}
```

القواعد:

- لا تشغل Lottie من remote script غير موثوق.
- خزنه كـ asset JSON.
- اربطه بالـ playhead عند الحاجة.
- دمّره عند unmount لتجنب memory leaks.

## Konva و Fabric

Konva هو خيار Mawj الحالي للمحرر.

استخدم Konva في:

- select layer
- move
- resize
- rotate
- safe margins
- snap guides

Fabric موجود كمرجع/تجربة لاحقة لقوالب Canva-like، لكن لا نخلط Fabric وKonva في نفس سطح التحرير الآن.

## Three.js

لا تستخدم Three.js في المرحلة الحالية إلا إذا كان هناك feature واضح:

- product 3D mockup
- animated particles
- 3D text/logo reveal

أي استخدام لـ Three.js يجب أن يكون layer type مستقل أو effect مستقل داخل project data.

## خريطة التنفيذ القادمة

1. `VideoProject -> RemotionComposition`
2. `Template JSON -> VideoProject`
3. `Konva PreviewCanvas` يقرأ ويكتب geometry إلى store
4. `dnd-kit Timeline` يقرأ ويكتب timing إلى store
5. `GSAP MotionPreview` ينفذ animation schema في المحرر
6. `@remotion/renderer` للتصدير الخادمي
7. `fluent-ffmpeg` للدمج والضغط والـ variants

## معيار القبول

لا نعتبر المكتبات مفعلة فعلياً إلا عندما ينجح هذا الاختبار:

1. افتح قالب JSON.
2. حوّله إلى `VideoProject`.
3. حرّك layer داخل Konva.
4. يتغير `x/y` في store.
5. غيّر مدة item داخل timeline.
6. تتغير `start/duration/end`.
7. اعرض نفس المشروع في Remotion Player.
8. صدّر MP4 من نفس البيانات.

