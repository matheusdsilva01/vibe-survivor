# Copilot Instructions for `vibejam`

## Build, test, and lint commands

- Install deps: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Local preview of built app: `npm run preview`
- Lint: not configured (`package.json` has no lint script)
- Tests: not configured (`package.json` has no test script)
- Run a single test: not available in current setup (no test runner configured)

## High-level architecture

- This is a Vite + Three.js browser game with a single entrypoint (`src/main.js`) that validates required DOM roots from `index.html` and instantiates `Game`.
- `src/game/Game.js` is the orchestrator and game state machine. It owns the main loop, state transitions (`CHAR_SELECT`, `WEAPON_SELECT`, `RUNNING`, `LEVEL_UP`, `GAME_OVER`), and wires all systems together.
- `WorldScene` owns rendering/camera/pointer-lock concerns and arena bounds; game logic systems are independent of rendering setup details.
- Gameplay loop order in `Game._tickRunning` is important: player update -> spawn/update mobs -> weapon system -> combat system -> remove dead mobs -> progression XP/level-up checks -> game-over/level-up state transitions.
- Systems are split by responsibility:
  - `SpawnerSystem`: wave timing, difficulty scaling, mob lifecycle
  - `WeaponSystem`: attack triggering by archetype and projectile lifecycle/collisions
  - `CombatSystem`: mob-to-player contact damage and i-frame timer
  - `ProgressionSystem`: XP curve, level tracking, upgrade choice generation trigger
- Data modules (`src/game/data/weapons.js`, `src/game/data/upgrades.js`) define content and upgrade effects; runtime weapon state is created with `createWeaponRuntime(...)` to avoid mutating static defs.
- UI is plain DOM classes (`src/ui/*Panel.js`, `HUD.js`) that render via `innerHTML` and callback handlers; visibility is managed through the shared `.hidden` class and panel `show()/hide()` methods.

## Key conventions specific to this repo

- Use ES modules and class-based modules (no framework/state library).
- Keep movement/combat calculations on the XZ plane; Y is mostly visual height.
- When adding new gameplay logic, prefer extending an existing system or adding a new `src/game/systems/*System.js` class, then wire it in `Game` instead of embedding logic in UI or entity classes.
- Entities (`Player`, `Mob`, `Projectile`) own their mesh and per-entity behavior; systems coordinate collections of entities and remove dead meshes from scene.
- Reset behavior for a new run must clear all transient runtime state (`SpawnerSystem.reset`, `WeaponSystem.reset`, `ProgressionSystem.reset`, player stats/health/position) from `Game._restart`.
- For new weapons/upgrades, update data definitions first, then ensure behavior paths exist in `WeaponSystem` and any special visuals in `Player._createWeaponModel`.
- Input/pointer-lock/cursor behavior is centralized in `Game` + `WorldScene`; keep panel/UI interactions from directly changing low-level scene state.
