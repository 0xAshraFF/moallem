# Moallem product films

Remotion project for the Moallem product films (1920×1080).

| Composition | Source | Notes |
|---|---|---|
| `MoallemFilm2` | `src/v2/` | Built from real app recordings in `public/rec` |
| `MoallemFilm` | `src/` | First film, built from stills in `public/screens` |

## Commands

```bash
npm install
npx remotion studio                                       # preview
npx remotion render MoallemFilm2 out/moallem-film-v2.mp4  # export
```

## Re-recording the app

The scripts drive the running app with a headless browser, so start it first
(`cd ../app && npm run dev`, serves `http://localhost:8787`). `record.mjs` also needs `ffmpeg` on PATH.

```bash
node scripts/record.mjs public/rec [flowName...]       # screen recordings (MP4, 30 fps)
node scripts/shoot.mjs <outDir> scripts/now.json        # screenshots from a shot list
```

Rendered films go to `out/`, which is git-ignored.
