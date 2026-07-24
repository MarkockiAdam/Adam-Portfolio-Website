# Adam's Macintosh Portfolio — Developer Handoff Documentation

A 3D desk-scene portfolio: a procedurally modeled 1984 Macintosh on a dark desk,
surrounded by personal objects, with a working retro operating system ("AdamOS")
on its screen. Built with **Three.js + Vite, vanilla JavaScript, zero external
3D assets** — every model is generated from primitives and every texture is
drawn on a `<canvas>` at runtime, so the site has no asset downloads and loads
nearly instantly.

Live site: https://markockiadam.github.io/Adam-Portfolio-Website/

---

## 1. Quick start

```bash
npm install
npm run dev      # dev server with HMR
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

Requirements: Node 20+ (CI uses 22). No environment variables, no backend,
no database — it is a fully static site.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| 3D | Three.js (`three` + `three/addons`) | Scene, shadows, raycasting, ExtrudeGeometry etc. |
| Bundler | Vite (`base: './'`) | Relative asset paths → works at any URL subpath |
| UI | Vanilla JS + CSS | The retro OS is plain DOM; no framework needed |
| Fonts | Google Fonts: Unbounded (display), Pixelify Sans (retro UI), VT323 (retro body) | Loaded at runtime; canvas labels redraw when fonts arrive |
| Audio | WebAudio oscillators | Synthesized clicks/boops — no audio files |
| Hosting | GitHub Pages | Static; auto-deployed by GitHub Actions |

---

## 3. Repository layout

```
index.html                  DOM shell: canvas, loader, corner buttons, hint,
                            and the #os-root overlay that hosts the retro OS
src/
  main.js                   Entry point. Boots Scene + Desktop, owns the
                            overview↔zoomed state machine, sound synth, buttons
  content.js                ★ ALL editable content: profile, projects, resume,
                            sticky notes. Edit this to change what the site says
  style.css                 Scene chrome + the entire retro-OS look
                            (512×342 design space, scaled — see §6)
  assets/
    wwdc.jpg                Polaroid photo (auto-detected; see §7.3)
    ssc-certificate.png     Swift Student Challenge winner certificate card
  scene/
    Scene.js                Renderer, camera rig, lights, click routing,
                            zoom transitions, screen-rect projection
    textures.js             Every canvas-generated texture (grid, wallpaper,
                            floppy labels, stickers, globe, ping sprites…)
    models/
      Mac.js                Macintosh 128K (body, CRT, floppy, dial, badge)
      Keyboard.js           Keyboard (instanced keys), mouse, cable helper
      Props.js              Mug, Maluch car, vase, Kirby, cards, bee, globe,
                            floppy caddy, SSC certificate, ping indicator helper
      Wall.js               Backdrop grid, sticky notes, polaroid
      Labels.js             Floating text (name + subtitles)
  os/
    Desktop.js              Retro-OS window manager: icons, menus, boot,
                            clock, dragging, open/close
    apps/
      work.js               my_projects window (reads content.projects)
      resume.js             resume.doc window (reads content.resume)
      chat.js               chat.app window (email + socials)
      snake.js              Playable 1-bit Snake (canvas game)
.github/workflows/deploy.yml  Build + deploy pipeline (see §9)
docs/                       BUILD OUTPUT served by GitHub Pages — never edit
                            by hand; the workflow regenerates it on every push
```

---

## 4. Architecture overview

### 4.1 The two-world design

The experience is two synchronized "worlds":

1. **The 3D scene** (WebGL canvas, `src/scene/`) — the desk, all objects,
   lighting, shadows, camera.
2. **The retro OS** (plain DOM, `src/os/`) — menu bar, draggable windows,
   apps. It lives in `#os-root`, hidden until the camera is zoomed in.

The trick that binds them: when the camera finishes zooming to the Mac,
`Scene.screenRect()` projects the CRT display quad's corners into CSS pixels
and `Desktop.setRect()` positions/scales `#os-root` to exactly cover it.
Because the camera is static while zoomed, this is computed once per
zoom/resize — cheap and pixel-perfect. The OS content is designed at a fixed
**512 × 342** (the real Mac's resolution) inside `#os-inner` and scaled with a
CSS `transform: scale()` on `#os-scale`.

### 4.2 Camera state machine (`Scene.js`)

Modes: `overview` → `zooming` → `zoomed` → `unzooming` → `overview`.

- **overview**: camera orbits a target point; position derived from spherical
  coords (`overviewPolar` + drag-orbit offsets + pointer parallax). Distance
  auto-scales with aspect ratio (`aspectScale`) so the desk always fits,
  including phone portrait.
- **zoomed**: camera sits on the screen's normal at a distance computed from
  FOV so the screen fills ~66 % of viewport height (or ~95 % width on narrow
  screens).
- Transitions are **wall-clock tweens** (`startTween`, 1.35 s,
  ease-in-out-cubic). Important: they are wall-clock, not frame-delta, so
  they complete on time even at low frame rates.

### 4.3 Interaction registry

Any mesh can be made clickable:

```js
scene.registerClickable(mesh, {
  onClick: (intersection) => { ... },  // receives the raycast hit (has .uv)
  root: groupForHoverScaling           // optional
})
```

`Scene.bindInput()` handles pointer events on the canvas: raycast on
pointerup (ignored if the pointer moved > 10 px — that's a drag), hover
cursor + scale easing (`root.userData.hoverScale`), and drag-to-orbit.
**Gotcha:** hover scaling lerps between 1 and `hoverScale`, so a clickable
root must have base scale 1 — bake any size adjustments into the geometry
(this bit us once with the globe).

Current clickables and what they do:

| Object | Action |
|---|---|
| Mac body / screen | Zoom in (screen icons: clicking a baked desktop icon opens that app directly — UV-mapped regions from `screenTexture()`) |
| Brightness dial | Toggles the CRT on/off |
| Floppy slot / disk | Ejects/inserts the floppy |
| Globe | Spin boost + opens terracracovianum.org (has ping indicator) |
| Maluch car | Bounce + opens a YouTube link (has ping indicator) |
| SSC certificate | Bounce + opens the Swift Student Challenge winner X post (has ping indicator) |
| Polaroid | Opens the WWDC LinkedIn post |
| Floppy caddy disks | MAIL → mailto, GITHUB / LINKEDIN / TWTTR → profiles |
| Mug | Bounce + opens an X post |
| Kirby, vase, cards | Playful bounce |

### 4.4 The ping affordance

`makePing(animators, y)` in `Props.js` returns an AR-style tap indicator
(glowing dot + expanding ring sprites, additive blending). Convention:
attach it to objects that navigate somewhere; set `ping.visible = false`
in the object's `onClick` so it disappears once discovered.

### 4.5 Canvas texture pipeline (`textures.js`)

All textures are drawn with Canvas 2D and wrapped in `THREE.CanvasTexture`
(SRGB color space). Notable ones:

- `screenTexture()` — the CRT's "far view": hill wallpaper + menu bar +
  desktop icons. Returns `{ texture, regions }`; regions are the icons'
  UV rectangles used for direct-click app launching.
- `wallpaperURL()` — same hill art as a data URL, used as the DOM OS
  background so the screen looks identical from every angle.
- `floppyLabelTexture(kind, name, shellColor)` — floppy faces with hero
  logos. GitHub's octocat is drawn from its official 16×16 `Path2D` mark.
- `textLabel(...)` / `makeLabel(...)` — 3D text planes. Each mesh exposes
  `userData.redraw()`; `Labels.js` calls these on `document.fonts.ready`
  because canvases drawn before web fonts load use fallback fonts.

### 4.6 The retro OS (`os/`)

`Desktop.js` is a tiny window manager: desktop icons (inline SVG, 1-bit
style), draggable windows with close boxes, decorative menus (Special →
Shut Down zooms out!), a live clock, and a boot sequence (happy-Mac →
"Welcome to AdamOS.") that runs only on the first zoom-in per page load.

**Gotchas already fixed once — don't regress them:**
- `#os-windows` must keep `pointer-events: none` (windows themselves are
  `auto`) or the layer swallows clicks meant for desktop icons.
- The title-bar drag handler must ignore `pointerdown` on the close box
  (`e.target.closest('.os-window__close')`), or pointer capture eats the
  close click.
- Window dragging divides pointer deltas by the current overlay scale.

Apps get `{ sfx }` and return `{ el, dispose? }`. Snake (`snake.js`)
runs on `setInterval`, saves a high score in `localStorage`, supports
arrows/WASD and swipe, and cleans up via `dispose` on window close.

### 4.7 Sound

`sfx(kind)` in `main.js` synthesizes tiny envelope-shaped oscillator beeps
(`click`, `pop`, `boot`, `eat`, `over`). Muted by default; the toggle
(top-right) persists in `localStorage` under `am-sound`.

---

## 5. The procedural models

All in `src/scene/models/`, all built from Three.js primitives:

- **Mac 128K** (`Mac.js`): RoundedBox body + recessed bezel, CRT plane with
  the screen texture, floppy slot with an ejectable disk, chunky brightness
  dial (clickable), rainbow "AM" badge, "Adamtosh 128k" nameplate, side
  vents and stickers. Returns references (`screen`, `dial`, `floppy`…) that
  `Scene.js` wires for interaction.
- **Maluch / Fiat 126p** (`Props.js` → `buildMaluch`): the body is a single
  **ExtrudeGeometry of the car's side silhouette** (with wheel-arch arcs in
  the outline) — that's what makes it read as a real 126p. Windshield and
  rear window are dedicated panes floated ~0.035 above the beveled body
  surface. **Lesson learned:** extrude bevels expand the surface outward
  (~bevelSize), so anything meant to sit "on" the body must clear that.
- **Globe** (`buildGlobe`): lathe-free — sphere with an equirectangular
  canvas earth, brass meridian arc, wooden base; slow spin with a
  speed-boost on click.
- **Floppy caddy** (`buildFloppyCaddy`): one row of four disks (no
  occlusion — that was iterated), each a RoundedBox with a per-face
  material array (label texture on the front face only).
- **Kirby**, **mug** (white porcelain, squared handle, rainbow-apple decal),
  **daisy vase** (+ circling bee), **card stack**, **SSC certificate**
  (cardstock with `ssc-certificate.png` face; click opens the winner post),
  **keyboard** (InstancedMesh keycaps), **wall** (grid texture + pinned
  sticky notes + polaroid).

Lighting: hemisphere + one shadow-casting directional key light
(PCFSoft, 2048 px map, 1024 on mobile) + a cool point fill.

---

## 6. Responsive & mobile strategy

- `isMobile` = coarse pointer or narrow viewport. Effects scale down:
  smaller shadow maps, fewer particles, no antialiasing changes needed.
- Overview camera distance multiplies by `max(1, 1.45 / aspect)` so the
  whole desk fits portrait phones.
- Zoomed OS fills ~95 % of width on narrow screens; all OS hit targets are
  sized for touch; Snake supports swipe.
- The scene canvas uses `touch-action: none`; page never scrolls.

---

## 7. Content editing guide (the 90 % case)

### 7.1 `src/content.js`
Everything textual lives here: `profile` (name, subtitle lines, email,
social URLs), `projects` (name, tag, optional `badge`, url — rendered in
my_projects), `resume` (award, education, experience, activities, skills,
certificates, languages — rendered in resume.doc), `stickyNotes`.

### 7.2 index.html
Page `<title>`/meta description and the static overlay chrome.

### 7.3 Polaroid photo
Drop an image at `src/assets/wwdc.{jpg,png,webp}` — `polaroidTexture()`
picks it up automatically (cover-cropped, caption "WWDC26!"). Delete it to
fall back to the drawn placeholder.

### 7.4 Colors & fonts
CSS custom properties in `:root` (`style.css`). The rainbow stripes used by
the AM badge/loader are `--stripe-1…6`.

---

## 8. Testing & debugging

- `window.__AM = { scene, desktop }` is exposed in `main.js`. From the
  console you can reach every mesh, force `scene.orbitTarget`, call
  `desktop.open('snake')`, etc.
- The project has been verified throughout with **Playwright** driving the
  built site (`vite preview`): screenshot the overview, click objects by
  projecting their world position through `scene.camera`, assert windows/
  popups. Pattern for projecting an object to CSS pixels:

  ```js
  const v = new (obj.position.constructor)()
  obj.getWorldPosition(v); v.project(scene.camera)
  const px = (v.x * 0.5 + 0.5) * innerWidth
  const py = (-v.y * 0.5 + 0.5) * innerHeight
  ```

- Popups (`window.open`) are asserted with Playwright's
  `context.waitForEvent('page')`.

---

## 9. Build & deployment

### 9.1 Model — SINGLE BRANCH

`main` is the only branch. It contains the source **and** the built site in
`docs/`. GitHub Pages is configured (Settings → Pages) to serve
**Branch: `main`, folder: `/docs`**.

On every push to `main` (except docs-only commits), the workflow
`.github/workflows/deploy.yml`:
1. `npm ci && npm run build`
2. Replaces `docs/` with the fresh build (+ `.nojekyll`)
3. Commits it back to `main` with `[skip ci]` (and the workflow also
   ignores `docs/**` paths) so it cannot loop
4. Pushes with retries — GitHub occasionally throws transient
   `Internal Server Error` on pushes; every push in this pipeline retries

So a content edit is: change `src/content.js` → push to `main` → ~1 minute
later the live site updates. **Never edit `docs/` by hand.**

### 9.2 History note

The project previously used a separate force-orphaned deploy branch
(`macintosh-1984`). It was retired in favor of the single-branch `/docs`
model. If a stray build branch ever reappears, it's safe to delete —
`main` is the only source of truth.

### 9.3 Ops gotchas observed in production

- GitHub occasionally 500s on pushes (hence all the retries).
- A Pages deployment can get stuck "in progress" and block the next one
  for ~30 minutes; the queued build then fails with "cancel … first".
  Remedy: wait for the lock to expire and push any commit to retrigger.
- Pages CDN caches HTML ~10 min — always hard-refresh when verifying.

---

## 10. Ideas / possible next steps

- Real App Store links + app icons in my_projects (URLs live in content.js)
- A MacPaint-style drawing app as a second OS toy
- `prefers-reduced-motion`: skip the intro tween and ping pulses
- OG share image; PWA manifest for installability
- Lazy-init the WebGL scene below a loading gate if asset count ever grows
