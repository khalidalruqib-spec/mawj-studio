# Video Editor Library Lessons

This document records what Mawj Studio should learn from real video-editor libraries and open-source projects. It is intentionally practical: every lesson must influence how we build the editor.

## Sources Studied

- Remotion Player, Captions, render APIs, and Editor Starter docs.
- OpenTimelineIO timeline structure docs.
- React Konva Transformer, drag/drop, and canvas export docs.
- dnd-kit overview and sortable docs.
- ffmpeg.wasm overview, usage, and performance notes.
- Wavesurfer.js docs and plugin notes.
- GSAP Timeline docs.
- Airbnb `lottie-web` README.
- `designcombo/react-video-editor`.
- `ncounterspecialist/twick`.
- `sambowenhughes/a-react-video-editor`.

## The Big Lesson

Mawj should not be a React UI that happens to look like a video editor. Mawj should be a project-data engine with multiple views:

- Canvas view: edits layer geometry.
- Timeline view: edits time placement.
- Inspector view: edits properties.
- Remotion view: previews and renders from project data.
- Template view: hydrates JSON into the same project data.

React components should never become the source of truth. The source of truth is `VideoProject`.

## Remotion

Use Remotion for:

- Browser preview through `@remotion/player`.
- Frame-based composition rendering from project data.
- Export architecture through renderer/server routes.
- Captions display and SRT import/export helpers.
- Template previews that need deterministic frame-based motion.

Implementation rules:

- `VideoProject` becomes `inputProps`.
- Convert `durationSeconds * fps` into `durationInFrames`.
- Render layers through `<Sequence from={startFrames} durationInFrames={durationFrames}>`.
- Use `useCurrentFrame()` and project keyframes for animation.
- Keep CSS transitions and browser timers out of final render logic; they are okay for UI feedback, not canonical video output.
- Preload or premount media where possible to prevent flicker.

## OpenTimelineIO

Use OpenTimelineIO as a mental model, not a runtime dependency right now.

Implementation rules:

- Timeline contains tracks.
- Tracks contain timed items.
- Assets/media references stay separate from the timeline clip/item.
- A clip can use only part of an asset; Mawj needs source range fields later.
- Transitions are metadata between adjacent items and should not silently change total timeline duration.
- Store time consistently. Mawj can use seconds in the project model and convert to frames for Remotion.

## React Konva

Use React Konva for the interactive preview canvas.

Implementation rules:

- `Stage` is the preview canvas.
- `Layer` is a canvas drawing layer, not the same as Mawj `Layer`.
- Mawj `Layer` objects render into Konva nodes.
- Use `draggable` for move interactions.
- On `onDragEnd`, write `x` and `y` back to the project store.
- Use `Transformer` for selected layers.
- After resize/transform, reset Konva node scale back to `1` and write normalized `width` and `height` to the store.
- Keep selected layer id in project state, not in each layer component.

## dnd-kit

Use dnd-kit for timeline interaction.

Implementation rules:

- One `DndContext` wraps the timeline.
- Each track gets a sortable/droppable context.
- Timeline items are draggable and droppable.
- Multi-track movement uses multiple sortable containers and `onDragOver`.
- Use pointer, touch, and keyboard sensors.
- Use a forgiving collision strategy such as closest center/corners.
- Use a drag activation distance so normal clicks do not become accidental drags.
- Use `DragOverlay` for scrollable timelines.
- Timeline pixel movement must convert to seconds using the current zoom.

## Zustand

Use Zustand as the editor command store.

Implementation rules:

- Store `currentProject`, `selectedLayerId`, `selectedTimelineItemId`, `playhead`, and `zoom`.
- Mutations must be named commands: `addLayer`, `updateLayer`, `moveTimelineItem`, `resizeTimelineItem`, etc.
- Undo/redo should snapshot meaningful project changes, not every tiny mousemove.
- Drag interactions should commit on end, while optionally keeping transient UI state outside the canonical project.
- Selectors should derive active layers at playhead time.

## Zod

Use Zod at trust boundaries.

Implementation rules:

- Validate imported template JSON.
- Validate loaded saved projects.
- Validate AI-generated template JSON before hydrating it.
- Keep TypeScript interfaces and runtime schemas aligned.

## ffmpeg.wasm and FFmpeg

Use ffmpeg.wasm carefully.

Implementation rules:

- Lazy-load ffmpeg.wasm only when the user starts a media operation.
- Expect the core to be large; do not load it on initial app boot.
- Use `toBlobURL()` when loading wasm/core files if CORS gets in the way.
- Multi-thread mode requires SharedArrayBuffer and cross-origin isolation headers.
- Use ffmpeg.wasm for smaller client-side tasks such as quick transcode, extract audio, trim, or SRT burn-in experiments.
- Do not rely on browser ffmpeg.wasm as the only final export path for large projects. Real final exports should move toward server workers.

## Wavesurfer.js

Use Wavesurfer for waveform display, not audio processing.

Implementation rules:

- Render audio waveforms for audio tracks and podcast templates.
- Use Regions for selecting audio segments.
- Use Timeline plugin for waveform time labels.
- For large audio/video files, use pre-decoded peaks instead of decoding the entire file in browser memory.
- Do not ask Wavesurfer to cut, mix, or enhance audio; use FFmpeg/server workers for actual processing.

## GSAP

Use GSAP for editor UI motion previews and high-quality interaction feedback.

Implementation rules:

- GSAP can preview animation styles like pop, slide, reveal, zoom, and bounce.
- Project keyframes remain the source of truth.
- GSAP timelines should be generated from project animation/keyframe data, not authored as hidden state.
- Remotion render must be able to reproduce the same animation without GSAP relying on browser runtime timing.

## Lottie Web

Use Lottie for stickers, logo animations, intros, outros, and motion graphics.

Implementation rules:

- Store Lottie JSON as an `Asset` with type `lottie`.
- Render it as a `Layer` with type `lottie`.
- Drive Lottie playback from the editor playhead by frame/time where needed.
- Destroy Lottie instances on unmount to prevent memory leaks.
- Prefer local uploaded JSON or trusted asset-library JSON, not arbitrary remote scripts.

## Twick

Twick is the strongest open-source architectural reference studied.

Lessons:

- Split editor responsibilities into packages/modules: timeline, canvas, render, live-player, media utils, studio.
- Timeline operations should be an editor service, not scattered React state.
- Track and element operations benefit from command/visitor-style structure.
- Elements should serialize and deserialize cleanly.
- Undo/redo can use `past`, `present`, `future`, with a capped history.
- Snapping should be pure utility functions so it can be tested.
- Timeline operations should emit clear events after mutation.

Mawj adaptation:

- Build a `video-project-store` first.
- Then add command utilities such as `addLayerToTrack`, `splitTimelineItem`, `cloneLayer`, `serializeProject`, and `deserializeProject`.
- Keep Twick as inspiration, not copied code.

## DesignCombo React Video Editor

Lessons:

- Real editors use dedicated timeline/state packages, not ad-hoc arrays.
- Remotion is a credible base for preview/render.
- Uploads and generated assets need metadata: status, origin, preview state, and user/system source.
- A design scene object can be the source for preview, timeline, and rendering.

Mawj adaptation:

- Our asset model needs `origin`, `status`, and `previewUrl` soon.
- Current template projects should eventually convert to the same canonical `VideoProject`, not stay as a parallel model forever.

## a-react-video-editor

Lessons:

- It is a useful minimal Remotion Player example.
- It shows the basic pattern of arrays of clips/text rendered through `<Sequence>`.
- It also shows what Mawj must grow beyond: separate `clips` and `textOverlays` arrays are too limited for a professional editor.

Mawj adaptation:

- Use the Remotion Player pattern.
- Avoid the simplified state model.

## Immediate Mawj Build Plan

### Phase 2A: Project Store

Create `src/lib/video-project-store.ts` using Zustand:

- `currentProject`
- `selectedLayerId`
- `selectedTimelineItemId`
- `playhead`
- `zoom`
- `history`
- `future`
- `addAsset`
- `addLayer`
- `updateLayer`
- `deleteLayer`
- `addTimelineItem`
- `moveTimelineItem`
- `resizeTimelineItem`
- `selectLayer`
- `selectTimelineItem`
- `undo`
- `redo`

### Phase 2B: Template Bridge

Convert the existing JSON template engine into canonical `VideoProject`:

- template scenes -> `Scene[]`
- template media placeholders -> `Asset[]`
- template layers -> `Layer[]`
- converted timeline -> `Track[]` with `TimelineItem[]`

### Phase 2C: Canvas Prototype

Build a real React Konva preview:

- render active layers at current playhead
- select layer
- drag layer
- transform layer
- commit geometry into Zustand
- show safe margins

### Phase 2D: Timeline Prototype

Build dnd-kit timeline:

- tracks from project data
- items from `TimelineItem[]`
- move item horizontally to update start/end
- move item between compatible tracks
- resize start/end handles
- playhead and ruler

### Phase 2E: Remotion Preview

Build project-to-Remotion bridge:

- `VideoProjectComposition`
- `renderProjectLayer()`
- `renderProjectScene()`
- frame-based keyframe interpolation
- captions layer support

## Non-Negotiable Acceptance Test

Before calling the editor real, Mawj must pass this:

1. Create a 9:16 project.
2. Upload video asset.
3. Add it to a video track.
4. Add text layer.
5. Move text in canvas.
6. Confirm layer `x/y` changed in store.
7. Resize text item in timeline.
8. Confirm timeline item `start/duration/end` changed in store.
9. Add logo image.
10. Add captions layer.
11. Add fade-in animation to text.
12. Render or export preview.
13. Confirm video, text, logo, captions, and animation all appear from project data.
