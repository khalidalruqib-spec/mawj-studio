# Mawj Studio Template Design Rules

Use these rules when creating or modifying video templates, template JSON files, or AI template-generation prompts.

## Strict Rules

1. Text must be placed directly on top of a photo or video layer.
2. Do not create split layouts with large empty solid-color text areas.
3. Every generated scene should have a full-bleed image or video layer from the user's media.
4. Use subtle black overlays or dark transparent cards only for readability.
5. Do not use star icons, star shapes, decorative waves, SVG wave patterns, or ornamental filler backgrounds.
6. Arabic copy must be concise, accurate, bold, and professional.
7. Keep important text inside mobile safe margins.
8. Use Arabic-friendly typography in previews and generated layouts.

## Correct Pattern

Template scene:

1. Full-bleed photo/video.
2. Readability overlay.
3. Text layers directly above the media.
4. Optional small badge or CTA shape.

## Wrong Pattern

Template scene:

1. Empty gradient or solid background.
2. Large text block floating without media.
3. Decorative stars, waves, or unrelated visual filler.

## Implementation Notes

- JSON templates should remain data-driven and editable.
- Use placeholders such as `{{title}}`, `{{subtitle}}`, `{{mainImage}}`, `{{mainVideo}}`, `{{logo}}`, `{{brandColor}}`, `{{accentColor}}`, and `{{cta}}`.
- For generated templates, repeat the primary media layer across scenes when needed so the video always looks alive even before advanced B-roll selection.
