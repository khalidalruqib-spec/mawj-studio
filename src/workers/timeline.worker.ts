import {
  renderTimelineCanvas,
  type TimelineCanvasRenderPayload,
} from "../lib/timeline-canvas-renderer";

type WorkerMessage =
  | {
      type: "INIT";
      canvas: OffscreenCanvas;
    }
  | {
      type: "RENDER";
      payload: TimelineCanvasRenderPayload;
    };

let canvas: OffscreenCanvas | null = null;
let context: OffscreenCanvasRenderingContext2D | null = null;

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  if (event.data.type === "INIT") {
    canvas = event.data.canvas;
    context = canvas.getContext("2d");
    return;
  }

  if (!canvas || !context) return;
  renderTimelineCanvas(context, event.data.payload);
};

export {};
