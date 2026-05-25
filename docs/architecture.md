# Mawj Studio Architecture

## Product Positioning

Mawj Studio should not become a generic timeline editor. The wedge is:

> upload raw footage, pick a professional editing style, receive a short-form video plan and render.

The winning product surface is style-driven automation for Arabic/Saudi creators, stores, restaurants, clinics, agencies, and educators.

## Target Flow

1. User uploads source video.
2. API creates a project and returns a signed Supabase Storage upload URL.
3. Worker extracts audio, thumbnails, scene boundaries, and metadata.
4. Transcription model produces word-level transcript.
5. OpenAI creates a structured edit plan: hook, cuts, captions, b-roll, music, CTA, exports.
6. FFmpeg worker renders a preview.
7. User adjusts style, captions, brand kit, and export presets.
8. Worker renders final MP4 variants.

## Services

- Web app: Next.js
- API: Next.js route handlers initially, then NestJS/Fastify when render load grows
- Database: Supabase Postgres
- Storage: Supabase Storage for MVP, Cloudflare R2/S3 if render cost or scale requires it later
- Queue: BullMQ + Redis for MVP, Temporal for complex render orchestration
- Workers: Python for CV/audio analysis, Node/Python for FFmpeg render execution
- AI: OpenAI Responses API for edit decisions, transcription model for speech-to-text

## Data Model Sketch

- `users`
- `teams`
- `projects`
- `source_assets`
- `edit_plans`
- `render_jobs`
- `render_outputs`
- `brand_kits`
- `style_presets`
- `billing_credits`

## Render Worker Contract

Input:

```json
{
  "projectId": "project_123",
  "sourceUrl": "s3://bucket/source.mp4",
  "editPlan": {},
  "exportPreset": {
    "aspectRatio": "9:16",
    "resolution": "1080x1920",
    "fps": 30
  }
}
```

Output:

```json
{
  "projectId": "project_123",
  "status": "completed",
  "outputUrl": "s3://bucket/render.mp4",
  "durationSeconds": 34
}
```

## MVP Build Order

1. Current: web studio, projects table, and source video signed uploads.
2. Add auth and per-user RLS policies.
3. Add transcript extraction.
4. Add real FFmpeg preview render.
5. Add final export variants.
6. Add payments and usage credits.
7. Build Flutter companion app.
