export function isUsableMediaDuration(value: number | undefined | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export async function resolveMediaDuration(
  element: HTMLMediaElement,
  fallbackSeconds = 12,
): Promise<number> {
  if (isUsableMediaDuration(element.duration)) return element.duration;

  const resolved = await probeDurationBySeeking(element).catch(() => null);
  if (isUsableMediaDuration(resolved)) return resolved;

  return Math.max(1, fallbackSeconds);
}

function probeDurationBySeeking(element: HTMLMediaElement) {
  return new Promise<number>((resolve, reject) => {
    const originalTime = Number.isFinite(element.currentTime) ? element.currentTime : 0;
    let settled = false;

    const cleanup = () => {
      element.removeEventListener("durationchange", handleDuration);
      element.removeEventListener("timeupdate", handleDuration);
      element.removeEventListener("seeked", handleDuration);
      element.removeEventListener("error", handleError);
      window.clearTimeout(timeout);
    };

    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (Number.isFinite(duration) && duration > 0) {
        element.currentTime = Math.min(originalTime, Math.max(0, duration - 0.05));
        resolve(duration);
      } else {
        reject(new Error("Could not resolve media duration."));
      }
    };

    const handleDuration = () => {
      if (isUsableMediaDuration(element.duration)) {
        finish(element.duration);
      } else if (isUsableMediaDuration(element.currentTime)) {
        finish(element.currentTime);
      }
    };

    const handleError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Could not seek media for duration."));
    };

    const timeout = window.setTimeout(handleError, 3000);

    element.addEventListener("durationchange", handleDuration);
    element.addEventListener("timeupdate", handleDuration);
    element.addEventListener("seeked", handleDuration);
    element.addEventListener("error", handleError, { once: true });

    try {
      element.currentTime = 1_000_000;
    } catch {
      handleError();
    }
  });
}
