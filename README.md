# Mawj Studio

**Production:** [https://mawj-studio.vercel.app](https://mawj-studio.vercel.app) — Landing على `/`، المحرر على `/studio`، القوالب على `/templates`.

في إعدادات Vercel للمشروع، عيّن `NEXT_PUBLIC_APP_URL=https://mawj-studio.vercel.app` حتى تُعرض روابط OG والـ metadata بشكل صحيح.

Mawj Studio is a professional AI video editing platform for short-form content. The first web MVP gives creators and businesses a studio workflow: upload raw footage, choose an editing style, generate an AI edit plan, inspect captions/timeline/tools, and prepare exports for TikTok, Reels, Shorts, and Snapchat.

## Current MVP

- Next.js App Router + TypeScript + Tailwind CSS
- Upload and local preview for video files
- Project persistence API with Supabase/Postgres support
- Supabase Storage signed upload URL flow for source videos
- Editing styles for Saudi viral clips, premium brand films, podcasts, products, education, and restaurants
- `/api/edit-plan` route with local deterministic fallback
- Claude or OpenAI structured AI enhancement for edit plans, AI commands, and Ad Maker
- Optional Python/FastAPI AI processing service for heavier Arabic Whisper captions
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
OPENAI_MODEL=gpt-4o-mini
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-20250514

PYTHON_AI_SERVICE_URL=
PYTHON_AI_SERVICE_TOKEN=
PYTHON_WHISPER_MODEL=large-v3

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_VIDEO_BUCKET=mawj-source-videos

VIDEO_STORAGE_PROVIDER=supabase
VIDEO_WORKER_QUEUE=demo
```

Without `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, the platform still generates a deterministic local edit plan. When both are available, Mawj prefers Claude for edit planning, AI commands, and Ad Maker, then falls back to OpenAI. Automatic captions still use the Python Whisper service first, then OpenAI transcription, then demo captions.

For automatic captions, the app uses this order:

1. `PYTHON_AI_SERVICE_URL` when a FastAPI Whisper service is configured.
2. `OPENAI_API_KEY` with `OPENAI_TRANSCRIBE_MODEL`.
3. Demo captions when no transcription provider is configured.

Without Supabase variables, projects use an in-memory local fallback. To enable real persistence and source video uploads, run the migration in `supabase/migrations/202605250001_projects_and_video_storage.sql` and set the Supabase environment variables above.

## Optional Python AI Service

```bash
cd services/ai-processing
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then set `PYTHON_AI_SERVICE_URL=http://localhost:8000` in `.env.local`. On production, deploy the service to a GPU host and add `PYTHON_AI_SERVICE_URL` and optional `PYTHON_AI_SERVICE_TOKEN` to Vercel.

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
