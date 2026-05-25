# Mawj AI Processing Service

Optional Python/FastAPI worker for heavy AI media tasks. The Next.js app keeps running without it, but `/api/transcribe` will use this service first when `PYTHON_AI_SERVICE_URL` is configured, then fall back to OpenAI, then demo captions.

## Local Run

```bash
cd services/ai-processing
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then add this to the web app `.env.local`:

```bash
PYTHON_AI_SERVICE_URL=http://localhost:8000
PYTHON_AI_SERVICE_TOKEN=
PYTHON_WHISPER_MODEL=large-v3
```

If you set `AI_SERVICE_TOKEN` on the Python service, set the same value as `PYTHON_AI_SERVICE_TOKEN` in the Next.js app.

## Production Notes

- Use `WHISPER_DEVICE=cuda` and `WHISPER_COMPUTE_TYPE=float16` on a GPU host.
- Use `WHISPER_DEVICE=cpu` and `WHISPER_COMPUTE_TYPE=int8` for local CPU testing.
- Good production targets: Modal, RunPod, Replicate, Fly.io GPU, or any FastAPI-capable GPU VM.
- Keep this service private and protect it with `AI_SERVICE_TOKEN`.
