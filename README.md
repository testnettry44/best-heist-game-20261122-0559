# The Marlow Museum Heist

[![make.fun](https://make.fun/badge.svg)](https://make.fun/c/best-heist-game-20261122-0559)
Competition: best-heist-game-20261122-0559 · Owner: testnettry44 · Repo: best-heist-game-20261122-0559

A complete one-room stealth heist game. You are the thief, breaking into the
Marlow Museum at night to steal the **Gilded Star** diamond — then slipping
out to the getaway van before the alarm hits 100%.

## How to play

- **Move:** WASD or arrow keys. **Shift** — sneak (slower, much harder to spot).
- **E or click** — grab loot / interact. **Q** — toss a coin to distract the
  nearest guard (−$50, 3 coins). **1** — smoke pellet, blocks all vision for
  4 seconds (−$100, 2 pellets).
- **P** — pause. **R** — restart. **M** — mute. **Enter** — start.

Three guards patrol waypoints with visible vision cones; three wall cameras
sweep amber cones across the hall. Being seen raises the **alarm meter**
(top centre); hiding lets it decay. If the alarm hits 100%, or a guard
grabs you, you are caught. Win by stealing the Gilded Star and reaching the
**GETAWAY** door at the south-west corner.

Three routes cross the room: the guarded main hall (fastest), the side
corridor, and the **vent crawlspace** along the west wall (hidden from
cones, but slow). Display cases, statues and planters block vision cones —
plan cover to cover. Optional paintings and gems are worth $150–$200 each,
placed so grabbing them forces a detour through a patrol lane.

## Tech notes

- Vanilla JavaScript + Canvas 2D, no libraries, no network requests, no
  external assets or fonts (system fonts only). Sound effects are
  synthesised with WebAudio — no audio files.
- Source is split by job: `level.js` (floor plan), `player.js` (thief,
  tools), `guards.js` (patrols, vision, chase), `cameras.js` (rotating
  cones), `render.js` (drawing), `hud.js` (alarm meter, loot, objective),
  `audio.js` (synth SFX), `main.js` (boot, loop, screen state machine).
- Play locally: `node serve.ts`, then open http://localhost:8080.
- Debug/staging hooks: `window.__game.snapshot()`, `window.__game.stage('cover' | 'patrol' | 'alarm' | 'win')`,
  and `?stage=<name>` in the URL stages a state on load.
