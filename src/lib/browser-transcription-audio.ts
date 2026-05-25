export const DIRECT_TRANSCRIPTION_UPLOAD_LIMIT_BYTES = 3_500_000;
export const MAX_TRANSCRIPTION_AUDIO_SECONDS = 180;

export type PreparedTranscriptionFile = {
  file: File;
  usedAudioExtraction: boolean;
  clippedSeconds: number;
  originalSize: number;
  note: string;
};

export async function prepareMediaForTranscription({
  file,
  durationSeconds,
  onProgress,
}: {
  file: File;
  durationSeconds: number;
  onProgress?: (progress: number) => void;
}): Promise<PreparedTranscriptionFile> {
  const canUploadDirectly = file.size <= DIRECT_TRANSCRIPTION_UPLOAD_LIMIT_BYTES;

  if (file.type.startsWith("audio/") && canUploadDirectly) {
    return {
      file,
      usedAudioExtraction: false,
      clippedSeconds: durationSeconds,
      originalSize: file.size,
      note: "Audio file is small enough for direct transcription.",
    };
  }

  if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
    throw new Error("Automatic captions need a video or audio file.");
  }

  try {
    return await extractCompressedAudio({ file, durationSeconds, onProgress });
  } catch (error) {
    if (canUploadDirectly) {
      return {
        file,
        usedAudioExtraction: false,
        clippedSeconds: durationSeconds,
        originalSize: file.size,
        note: "Audio extraction was unavailable, so the original small file will be used.",
      };
    }

    throw error;
  }
}

async function extractCompressedAudio({
  file,
  durationSeconds,
  onProgress,
}: {
  file: File;
  durationSeconds: number;
  onProgress?: (progress: number) => void;
}): Promise<PreparedTranscriptionFile> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Audio extraction runs in the browser.");
  }

  if (!window.MediaRecorder) {
    throw new Error("This browser cannot prepare large files for captions. Try Chrome or Edge.");
  }

  const AudioContextConstructor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error("This browser does not support audio extraction for captions.");
  }

  const element = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
  const sourceUrl = URL.createObjectURL(file);
  element.src = sourceUrl;
  element.preload = "auto";
  element.crossOrigin = "anonymous";
  element.muted = false;

  if (element instanceof HTMLVideoElement) {
    element.playsInline = true;
  }

  try {
    await waitForMediaEvent(element, "loadedmetadata");

    const realDuration =
      Number.isFinite(element.duration) && element.duration > 0
        ? element.duration
        : Math.max(1, durationSeconds);
    const clippedSeconds = Math.min(realDuration, Math.max(1, durationSeconds), MAX_TRANSCRIPTION_AUDIO_SECONDS);
    const context = new AudioContextConstructor();
    const source = context.createMediaElementSource(element);
    const destination = context.createMediaStreamDestination();
    const gain = context.createGain();
    gain.gain.value = 1;
    source.connect(gain);
    gain.connect(destination);

    const mimeType = pickAudioMimeType();
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(destination.stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: 48_000,
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const stopped = waitForRecorderStop(recorder);
    recorder.start(1000);
    element.currentTime = 0;
    element.playbackRate = 1;

    if (context.state === "suspended") {
      await context.resume();
    }

    await element.play();

    await new Promise<void>((resolve, reject) => {
      let frame = 0;
      const tick = () => {
        if (element.error) {
          reject(new Error("Could not read this media file for captions."));
          return;
        }

        const progress = Math.min(98, Math.round((element.currentTime / clippedSeconds) * 100));
        onProgress?.(progress);

        if (element.currentTime >= clippedSeconds || element.ended) {
          cancelAnimationFrame(frame);
          resolve();
          return;
        }

        frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    });

    element.pause();
    if (recorder.state !== "inactive") recorder.stop();
    await stopped;

    source.disconnect();
    gain.disconnect();
    await context.close().catch(() => undefined);

    const resolvedMimeType = mimeType || "audio/webm";
    const extension = resolvedMimeType.includes("mp4") ? "m4a" : "webm";
    const blob = new Blob(chunks, { type: resolvedMimeType });
    const audioFile = new File([blob], `${safeBaseName(file.name)}-transcription.${extension}`, {
      type: resolvedMimeType,
    });

    onProgress?.(100);

    return {
      file: audioFile,
      usedAudioExtraction: true,
      clippedSeconds,
      originalSize: file.size,
      note:
        clippedSeconds < realDuration
          ? `Prepared the first ${Math.round(clippedSeconds)} seconds as compressed audio.`
          : "Prepared compressed audio for transcription.",
    };
  } finally {
    element.pause();
    URL.revokeObjectURL(sourceUrl);
  }
}

function pickAudioMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function waitForMediaEvent(
  element: HTMLMediaElement,
  eventName: keyof HTMLMediaElementEventMap,
) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      element.removeEventListener(eventName, handleEvent);
      element.removeEventListener("error", handleError);
    };

    const handleEvent = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Could not load this media file for captions."));
    };

    element.addEventListener(eventName, handleEvent, { once: true });
    element.addEventListener("error", handleError, { once: true });
  });
}

function waitForRecorderStop(recorder: MediaRecorder) {
  return new Promise<void>((resolve, reject) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
    recorder.addEventListener("error", () => reject(new Error("Could not record audio for captions.")), {
      once: true,
    });
  });
}

function safeBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const safeName = withoutExtension
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);

  return safeName || "mawj-video";
}
