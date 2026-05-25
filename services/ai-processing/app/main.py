from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Annotated, Any

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

try:
    from faster_whisper import WhisperModel
except ImportError:  # pragma: no cover - helps health checks explain missing deps.
    WhisperModel = None  # type: ignore[assignment]


MODEL_NAME = os.getenv("WHISPER_MODEL", "large-v3")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN")

app = FastAPI(title="Mawj Studio AI Processing", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: Any | None = None


def verify_token(authorization: Annotated[str | None, Header()] = None) -> None:
    if not SERVICE_TOKEN:
        return

    expected = f"Bearer {SERVICE_TOKEN}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid AI service token.")


def get_model() -> Any:
    global _model
    if _model is not None:
        return _model

    if WhisperModel is None:
        raise HTTPException(
            status_code=503,
            detail="Install faster-whisper from requirements.txt before using transcription.",
        )

    _model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE_TYPE)
    return _model


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": DEVICE,
        "computeType": COMPUTE_TYPE,
    }


@app.post("/transcribe", dependencies=[Depends(verify_token)])
async def transcribe(
    file: Annotated[UploadFile, File()],
    language: Annotated[str, Form()] = "auto",
    durationSeconds: Annotated[float, Form()] = 60,
) -> dict[str, Any]:
    if not file.content_type or not (
        file.content_type.startswith("video/") or file.content_type.startswith("audio/")
    ):
        raise HTTPException(status_code=400, detail="Upload a video or audio file.")

    suffix = Path(file.filename or "media.mp4").suffix or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        media_path = tmp.name

    try:
        model = get_model()
        whisper_language = None if language == "auto" else language
        segments_iter, info = model.transcribe(
            media_path,
            language=whisper_language,
            vad_filter=True,
            word_timestamps=True,
        )
        segments = list(segments_iter)
    finally:
        Path(media_path).unlink(missing_ok=True)

    transcript = [
        {
            "id": f"tr-{index + 1}",
            "start": round(max(0.0, float(segment.start)), 2),
            "end": round(max(float(segment.end), float(segment.start) + 0.75), 2),
            "speaker": "Speaker 1",
            "text": segment.text.strip(),
        }
        for index, segment in enumerate(segments)
        if segment.text.strip()
    ]

    captions = [
        {
            "id": f"cap-{index + 1}",
            "start": item["start"],
            "end": item["end"],
            "text": item["text"],
        }
        for index, item in enumerate(transcript)
    ]
    text = " ".join(item["text"] for item in transcript).strip()

    return {
        "mode": "python",
        "model": getattr(info, "language", None) and f"{MODEL_NAME}:{info.language}" or MODEL_NAME,
        "text": text,
        "transcript": transcript,
        "captions": captions,
        "srt": segments_to_srt(transcript),
        "durationSeconds": durationSeconds,
    }


def segments_to_srt(segments: list[dict[str, Any]]) -> str:
    blocks = []
    for index, segment in enumerate(segments, start=1):
        blocks.append(
            "\n".join(
                [
                    str(index),
                    f"{format_timestamp(segment['start'])} --> {format_timestamp(segment['end'])}",
                    str(segment["text"]),
                ]
            )
        )
    return "\n\n".join(blocks)


def format_timestamp(seconds: float) -> str:
    milliseconds = int(round((seconds % 1) * 1000))
    whole = int(seconds)
    hours = whole // 3600
    minutes = (whole % 3600) // 60
    secs = whole % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"
