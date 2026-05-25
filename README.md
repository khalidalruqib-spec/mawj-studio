# Mawj Studio

Mawj Studio is a professional AI video editing platform for short-form content. The first web MVP gives creators and businesses a studio workflow: upload raw footage, choose an editing style, generate an AI edit plan, inspect captions/timeline/tools, and prepare exports for TikTok, Reels, Shorts, and Snapchat.

## Current MVP

- Next.js App Router + TypeScript + Tailwind CSS
- Upload and local preview for video files
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

VIDEO_STORAGE_PROVIDER=local
VIDEO_WORKER_QUEUE=demo
```

Without `OPENAI_API_KEY`, the platform still generates a demo edit plan. With the key, the API asks OpenAI to enhance the edit plan using structured JSON output.

## Next Production Pieces

- Object storage: Cloudflare R2 or S3 for original uploads and rendered exports
- Database: Postgres/Supabase for projects, renders, presets, teams, and billing state
- Queue: BullMQ/Redis or Temporal for render jobs
- Workers: Python or Node workers with FFmpeg, Whisper/transcription, shot detection, face/product tracking
- Payments: Stripe subscriptions and credit packs
- Mobile app: Flutter for upload, preview, light edits, and export sharing
