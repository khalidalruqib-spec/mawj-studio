# Mawj Studio CapCut Engine Blueprint

This is the permanent engineering brief for turning Mawj Studio from a visual demo into a real browser-based video editor.

## Core Rule

Do not build the look of CapCut only. Build the engine behind CapCut:

Project data model + timeline tracks + editable layers + canvas preview + keyframes + effects + templates + render.

## Product Mental Model

Mawj Studio is not a places-style template gallery and not a static video cutter. It is a smart content studio where every edit is represented as structured project data.

- `Project`: the full editable video project.
- `Asset`: uploaded or generated media such as video, image, audio, music, font, effect, or Lottie animation.
- `Scene`: a semantic part of a video such as hook, showcase, benefits, or CTA.
- `Track`: a timeline lane such as video, audio, text, image, captions, or effects.
- `Layer`: the editable visual or audio object.
- `TimelineItem`: the timed representation of a layer on a track.
- `Keyframe`: a timed property change for motion and animation.
- `Effect`: a filter or transformation applied to a layer.
- `Transition`: the handoff between scenes or clips.
- `Render`: converting project data into a final MP4 or another export format.

## Non-Negotiable Data Rule

Everything inside the editor must be data-driven.

- Adding text creates a `Layer` plus a `TimelineItem`.
- Adding media creates an `Asset`, a `Layer`, and a `TimelineItem`.
- Using a template hydrates JSON into assets, scenes, layers, tracks, and timeline items.
- Preview and export must render from the same project data.
- React components are views over project data, not the source of truth.

## Layer vs TimelineItem

`Layer` is the visible/audio object:

- position
- size
- rotation
- opacity
- text
- media reference
- style
- effects
- keyframes
- animation in/out

`TimelineItem` is the layer's time placement:

- track
- start
- duration
- end
- z-index
- locked/hidden state

Do not mix them.

## Chosen Technical Stack

Phase 1 stack:

- Next.js
- TypeScript
- Remotion
- `@remotion/player`
- `@remotion/captions`
- React Konva
- dnd-kit
- Zustand
- Zod
- ffmpeg.wasm
- Wavesurfer.js
- GSAP
- Lottie Web

Advanced stack after the engine is stable:

- WebCodecs
- Workers
- OffscreenCanvas
- PixiJS
- Moveable or react-rnd
- AI captions
- AI template generator
- advanced effects

## Reference Libraries And What Mawj Learns From Them

- Remotion: React compositions, frame-based preview, Player integration, captions, and render architecture.
- OpenTimelineIO: timeline structure, tracks, clips, gaps, transitions, stacks, media references, and time ranges.
- React Konva: stage/layer/group/object model, selection, drag, resize, rotate, z-index, and transformer handles.
- dnd-kit: timeline drag, resize, sortable tracks, moving items between tracks, and accessible interactions.
- ffmpeg.wasm and FFmpeg: trim, concat, overlay, drawtext, scale, crop, subtitles, amix, loudnorm, and compression.
- Wavesurfer.js: audio waveform, podcast waveform, region selection, and audio timeline preview.
- GSAP: motion previews for text reveal, pop, slide, fade, zoom, and keyframe-like animation feedback.
- Lottie Web: animated stickers, logo animations, intros, outros, and motion graphics.
- PixiJS: future heavy WebGL/WebGPU effects such as particles, glow, and animated backgrounds.

Open-source references to study, not copy blindly:

- `designcombo/react-video-editor`
- `ncounterspecialist/twick`
- `sambowenhughes/a-react-video-editor`
- Shotcut
- Kdenlive
- MLT Framework

## Build Phases

### Phase 1: Data Model

Build canonical TypeScript types for:

- `VideoProject`
- `Asset`
- `Scene`
- `Track`
- `Layer`
- `TimelineItem`
- `Keyframe`
- `Effect`
- `Template`

### Phase 2: Project Store

Use Zustand for:

- `currentProject`
- `selectedLayerId`
- `selectedTimelineItemId`
- `playhead`
- `zoom`
- `addAsset()`
- `addLayer()`
- `updateLayer()`
- `deleteLayer()`
- `addTimelineItem()`
- `moveTimelineItem()`
- `resizeTimelineItem()`
- `selectLayer()`
- `undo()`
- `redo()`

### Phase 3: Preview Canvas

Use React Konva:

- `VideoCanvas`
- `LayerRenderer`
- `TextLayer`
- `ImageLayer`
- `VideoLayer`
- `ShapeLayer`
- `CaptionsLayer`
- `LottieLayer`
- `SelectionTransformer`

The canvas must support select, move, resize, rotate, text edit, replace media, safe margins, and snap guides.

### Phase 4: Timeline

Use dnd-kit:

- `Timeline`
- `TimelineTrack`
- `TimelineItem`
- `Playhead`
- `Ruler`
- `ZoomSlider`
- `ResizeHandles`

Every timeline item must support move, resize, copy, delete, select, and moving between compatible tracks.

### Phase 5: Remotion Preview

Render from project data:

- `RemotionComposition`
- `renderLayer()`
- `renderScene()`
- `renderProject()`

### Phase 6: Templates

Templates are JSON data, not React hardcode:

- template schema
- `validateTemplate()`
- `hydrateTemplate()`
- `createProjectFromTemplate()`
- `convertTemplateToTracks()`

### Phase 7: Captions

Support:

- automatic captions
- manual captions
- SRT import/export
- burn-in captions
- Arabic RTL captions
- karaoke highlighting

### Phase 8: Export

Support:

- MP4
- 720p
- 1080p
- 30fps
- captions burned in
- audio included

## Test Scenario Required Before Calling The Editor Real

1. Create a 9:16 project.
2. Upload a video.
3. Add it to a video track.
4. Add a text layer.
5. Move the text in preview.
6. Confirm the data changed.
7. Change the text duration in timeline.
8. Add a logo image.
9. Add captions.
10. Add fade-in to the text.
11. Export MP4.
12. Open the final video and confirm every element appears.

If this scenario fails, the product is still a UI mockup, not a real video editor.

## Reference Sources

- Remotion: https://www.remotion.dev/
- OpenTimelineIO: https://opentimelineio.readthedocs.io/
- Konva / React Konva: https://konvajs.org/docs/react/
- dnd-kit: https://dndkit.com/
- ffmpeg.wasm: https://ffmpegwasm.netlify.app/
- Wavesurfer.js: https://wavesurfer.xyz/
- GSAP: https://gsap.com/docs/
- Lottie Web: https://github.com/airbnb/lottie-web
- DesignCombo React Video Editor: https://github.com/designcombo/react-video-editor
- Twick: https://github.com/ncounterspecialist/twick

See [video-editor-library-lessons.md](./video-editor-library-lessons.md) for the practical implementation lessons learned from these libraries and repositories.
