# Adam Markocki — Macintosh 1984 Portfolio

A cozy 3D desk scene with a **1984 Macintosh you can actually use** — built with
[Three.js](https://threejs.org/) + [Vite](https://vitejs.dev/). Inspired by
Ishant Periwal's desk-scene portfolio and Bruno Simon's playful interactivity.

Tap the Macintosh (or a floating label) and the camera flies into the screen,
where a retro **AdamOS** boots up: draggable windows, desktop icons, a menu bar
with a live clock — and a playable 1-bit Snake game.

## ✨ Features

- **Procedurally modeled desk scene** — Macintosh 128K, keyboard, mouse, coffee mug
  with steam, toy car, daisies in a vase, paper dino, sticky notes, polaroid.
  Zero external 3D assets; every texture is drawn on canvas at runtime.
- **Interactive retro OS** on the Mac's screen: WORK (projects), FUN (Snake),
  RESUME, CHAT — draggable windows, boot sequence, decorative menus
  (Special → Shut Down zooms you back out).
- **Desktop & mobile** — drag to orbit, pointer parallax, tap targets, aspect-aware
  camera framing, capped pixel ratio.
- **Optional retro sounds** — synthesized with WebAudio (no audio files), toggle top-right.

## 🚀 Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## ✏️ Make it yours

| What | Where |
|------|-------|
| Name, subtitle, email, socials | `src/content.js` (`profile`) |
| Projects in the WORK window | `src/content.js` (`projects`) |
| Resume content | `src/content.js` (`resume`) |
| Sticky note texts | `src/content.js` (`stickyNotes`) |
| Scene layout & props | `src/scene/Scene.js`, `src/scene/models/` |
| Retro OS windows & apps | `src/os/` |
| Colors & fonts | `src/style.css` (`:root`) |

## 🌐 Deployment — single branch

`main` is the only branch: source code plus the built site in `docs/`.
On every push, `.github/workflows/deploy.yml` rebuilds the site and commits it
into `docs/`, which GitHub Pages serves (*Settings → Pages → Branch: `main`,
folder: `/docs`*). Never edit `docs/` by hand.

Full developer handoff docs: see [DOCUMENTATION.md](DOCUMENTATION.md).

Live site: https://markockiadam.github.io/Adam-Portfolio-Website/
