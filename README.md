# Mawj Studio

Mawj Studio is a professional AI video editing platform for short-form content. The first web MVP gives creators and businesses a studio workflow: upload raw footage, choose an editing style, generate an AI edit plan, inspect captions/timeline/tools, and prepare exports for TikTok, Reels, Shorts, and Snapchat.

## Current MVP

- Next.js App Router + TypeScript + Tailwind CSS
- Upload and local preview for video files
- Project persistence API with Supabase/Postgres support
- Supabase Storage signed upload URL flow for source videos
- Editing styles for Saudi viral clips, premium brand films, podcasts, products, education, and restaurants
- `/api/edit-plan` route with local deterministic fallback
- OpenAI Responses API enhancement when `OPENAI_API_KEY` is available
- Professional editor UI with settings, timeline, caption script, tool stack, and export variants

## Local Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_VIDEO_BUCKET=mawj-source-videos

VIDEO_STORAGE_PROVIDER=supabase
VIDEO_WORKER_QUEUE=demo
```

Without `OPENAI_API_KEY`, the platform still generates a demo edit plan. With the key, the API asks OpenAI to enhance the edit plan using structured JSON output.

Without Supabase variables, projects use an in-memory local fallback. To enable real persistence and source video uploads, run the migration in `supabase/migrations/202605250001_projects_and_video_storage.sql` and set the Supabase environment variables above.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/202605250001_projects_and_video_storage.sql` in SQL Editor.
3. Copy the Project URL and publishable key into `.env.local`.
4. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.
5. Restart the Next.js server.

## Next Production Pieces

- Render output bucket for final MP4 exports
- Queue: BullMQ/Redis or Temporal for render jobs
- Workers: Python or Node workers with FFmpeg, Whisper/transcription, shot detection, face/product tracking
- Payments: Stripe subscriptions and credit packs
- Mobile app: Flutter for upload, preview, light edits, and export sharing
