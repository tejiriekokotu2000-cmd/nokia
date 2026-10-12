# Nokia Nostalgia

Independent static gallery of original and fan-made looping wallpapers inspired by classic mobile idle screens. Not affiliated with, endorsed by, or operated by Nokia.

## Run locally

These pages load `data/wallpapers.json` with `fetch`, so open them through a local HTTP server rather than the `file://` protocol.

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Add a wallpaper

1. Place an SVG (or other local animation file) under `assets/wallpapers/<category>/`.
2. Append an object to `data/wallpapers.json`.
3. Reload the gallery. Cards are generated from that file.

Required fields: `id`, `name`, `description`, `category`, `preview`, `animation`, `downloadAvailable`, `featured`, `origin`, `added`.

Use `phoneModel: null` and `era: null` when those facts are not verified. Set `origin` to `original`, `recreation`, or `historical`.

## Stack

HTML, CSS, and JavaScript only. No accounts, database, or build step.

Git was not available on the machine that first scaffolded this folder. If you use git:

```bash
git init
```
