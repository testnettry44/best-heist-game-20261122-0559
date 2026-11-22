# WORK REPORT — The Marlow Museum Heist (best-heist-game-20261122-0559)

Built 22 Nov 2026, ~21:44–21:50 WIB. One-room top-down stealth heist game,
vanilla JS + Canvas 2D, no libraries, no network, no external assets.

## Files

| File | Lines | Job |
| --- | --- | --- |
| game/index.html | 15 | Page shell, loads src/main.js as ES module |
| game/style.css | 9 | Full-viewport 1280x720 canvas scaling |
| game/src/main.js | 263 | Boot, game loop, screen state machine, __game hooks, stages |
| game/src/level.js | 131 | Floor plan: walls, cover, loot, vent, exit, guard/camera spawns, LOS + collision |
| game/src/player.js | 100 | Thief movement, sneak, coin toss, smoke pellet, loot grab |
| game/src/guards.js | 121 | Patrol waypoints, vision cones, detection, chase, investigate, catch |
| game/src/cameras.js | 30 | Rotating camera cones, camera detection |
| game/src/render.js | 402 | All drawing: room, cones, characters, loot, title/win/caught screens |
| game/src/hud.js | 83 | Alarm meter, loot, tools, timer, objective, messages |
| game/src/audio.js | 57 | WebAudio synth SFX (pickup, alarm, footsteps, win/lose), mute |
| main.ts | 37 | Hand-in program: copies game/ + screenshots/, writes dossier.json |
| serve.ts | 65 | Local static server (node serve.ts → http://localhost:8080) |
| README.md | — | Title, how to play, controls, tech notes |
| screenshots/01-cover.jpg | 83,233 B | Cover: full room, thief, guards + cones, cameras, Gilded Star, alarm meter |
| screenshots/02-patrol.jpg | 84,998 B | Thief sneaking behind a case, guards mid-patrol |
| screenshots/03-alarm.jpg | 86,888 B | Alarm 88%, SPOTTED, guard chasing, red vignette |
| screenshots/04-getaway.jpg | 68,097 B | CLEAN GETAWAY win screen, score $1626, rating S |

## How to run

`node serve.ts` → http://localhost:8080. Controls: WASD/arrows move,
Shift sneak, E/click grab, Q coin (−$50), 1 smoke (−$100), P pause, R restart,
M mute, Enter start. Debug: `window.__game.snapshot()`,
`window.__game.stage('cover'|'patrol'|'alarm'|'win')`, `?stage=<name>` in URL.

## Playtest evidence (headless Chromium, CDP harness, 0 console errors)

Scripted eval playthrough, final run:

- Title → Enter → play screen: yes
- Walk: +105 px in 700 ms holding D (≈150 px/s walk speed)
- Sneak: speed 80 px/s while Shift held (vs 150 walking)
- Detection: player placed in a guard cone → alarm 0 → 83% in 1.2 s, guard state patrol → chase
- Alarm decay: hidden in vent with guards sent away → alarm 60% → 40% in 2 s
- Loot grab: emerald brooch +$150 (loot 0 → 150)
- Tools: coins 3 → 2 after Q toss; smoke 2 → 1 after pellet
- Win path: Gilded Star grabbed (lootTarget true) → reach GETAWAY door → screen "win", loot $1150
- Caught path: staged alarm at 99% with guard line of sight → alarm 100% → screen "caught"
- FPS: 59–60

One bug found and fixed during playtesting: the two gems were placed on top
of display cases, so collision pushed the thief just outside the 46 px grab
range. Gems moved to open floor beside the cases; re-test confirmed the grab.

## Gate self-checks

- grep game/ for http://, https://, //host, src="http, fetch(, import( : none found
- Screenshots: 4 JPEGs, all 1280x720, each ≤ 256 KiB (68–87 KiB)
- game/: 12 entries, 47,296 bytes (caps: 993 files, 48 MiB)
- main.ts determinism: MAKEFUN_OUTPUT_DIR=out1 vs out2 → `diff -r` identical
- dossier.json: 480,886 bytes (< 1.5 MiB cap), keys cover/images/schema/text
- Screenshots visually inspected: cover shows the whole room, thief, 3 guards
  with vision cones, 3 cameras, the Gilded Star in the vault, the alarm meter,
  loot, tools, timer and objective in one frame.

## Notes / unfinished

- Nothing unfinished. Not submitted, not bundled — coordinator handles that.
- The meta-chromium binary at /opt/meta-chromium/chrome refuses to start in
  this VM ("Hatch WebGL domain policy is required for browser startup");
  all testing used the Playwright cache Chromium
  (~/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome).
- `?stage=` staging and `window.__game` hooks are staging/playtest helpers
  only; normal play (no query param) starts on the title screen.
