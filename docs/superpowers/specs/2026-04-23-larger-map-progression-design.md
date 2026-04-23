# Larger Map + Progression Design

## Goal
Introduce a much larger arena (`radius: 100`) with visual terrain height variation while keeping current combat and movement logic stable on the XZ plane, and evolve progression pacing using distance-based spawn bands.

## Scope
- In scope:
  - Larger fixed map size
  - Visual-only terrain elevation
  - Distance-based spawn bands with pacing updates
- Out of scope for this phase:
  - Vertical gameplay/collision changes
  - Biome transition system
  - New enemy types tied to terrain topology

## Architecture

### 1. Terrain system
- Add `TerrainSystem` to own arena mesh generation and visual height variation.
- Inputs:
  - `arenaRadius` (100)
  - height profile params (amplitude/frequency/seed)
- Responsibilities:
  - Build floor geometry/material for visual elevation
  - Keep border/ring readability for arena limits
  - Expose cleanup/reset hooks if needed for restarts

### 2. World and gameplay boundaries
- Keep `WorldScene.arenaRadius` as gameplay authority for clamp logic.
- `WorldScene.clampInsideArena(...)` remains unchanged conceptually.
- Player and mob logic continue using XZ plane for movement and combat distance checks.

### 3. Progression pacing via spawn bands
- Extend `SpawnerSystem` with spawn bands:
  - inner ring
  - mid ring
  - outer ring
- Wave updates select a ring using time-based weights (early game favors mid/outer, later introduces more pressure diversity).
- Spawn point sampling remains radius-constrained and avoids invalid positions.

## Data Flow
1. `Game` creates map config and passes it to `WorldScene`/`TerrainSystem` and `SpawnerSystem`.
2. `TerrainSystem` renders visual terrain for the configured larger radius.
3. `SpawnerSystem.update` chooses wave size + spawn rate, then chooses band and samples spawn positions.
4. Existing gameplay loop stays the same (player -> mobs -> weapon/combat/progression), with only spawn distribution changed.

## Error Handling
- Validate map config at setup:
  - radius must be positive and finite
  - spawn band ranges must be ordered and non-overlapping
- Fail fast on invalid config during system initialization (no silent fallback behavior).

## Verification Strategy (for implementation phase)
- Build command: `npm run build`
- Manual smoke checks:
  - Player/mobs stay clamped to the larger arena
  - Terrain shows visible elevation differences
  - Spawns appear across inner/mid/outer bands over time
  - Progression pacing remains playable (no dead waves / unfair instant swarms)

## Risks and Mitigations
- Risk: visual terrain can hurt readability.
  - Mitigation: conservative height amplitude and clear border contrast.
- Risk: larger arena can make combat sparse early.
  - Mitigation: tune spawn rate + ring weight curve for sustained engagement.
- Risk: spawn sampling edge cases near bounds.
  - Mitigation: bounded sampling with config validation.
