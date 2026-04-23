# Larger Map Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a larger fixed arena (`radius: 100`) with visual elevation and distance-based spawn-band pacing while keeping gameplay logic on the XZ plane.

**Architecture:** Keep `Game` as orchestrator, `WorldScene` as render/camera owner, and `SpawnerSystem` as pacing owner. Add a focused `TerrainSystem` for visual terrain generation and wire map config from `Game` into `WorldScene` + `SpawnerSystem` so arena radius and spawn bands stay consistent.

**Tech Stack:** JavaScript ES modules, Vite, Three.js

---

## File structure and responsibilities

- Create: `src/game/systems/TerrainSystem.js`
  - Owns large arena terrain mesh generation and disposal.
- Modify: `src/game/scene/WorldScene.js`
  - Accept map config, keep arena boundary authority, delegate terrain visuals.
- Modify: `src/game/systems/SpawnerSystem.js`
  - Add spawn-band model and time-weighted band selection.
- Modify: `src/game/Game.js`
  - Define map config and pass it to scene/spawner at construction/restart.
- Modify: `src/ui/HUD.js`
  - Add compact map/progression info for tuning visibility (ring and density).
- Modify: `src/styles/ui.css`
  - Minor HUD line style support.

---

### Task 1: Add shared map config in `Game`

**Files:**
- Modify: `src/game/Game.js`

- [ ] **Step 1: Add map config constants near `GAME_STATE`**

```js
const MAP_CONFIG = {
  arenaRadius: 100,
  spawnBands: [
    { id: "inner", min: 8, max: 28 },
    { id: "mid", min: 28, max: 58 },
    { id: "outer", min: 58, max: 96 },
  ],
};
```

- [ ] **Step 2: Pass map config to `WorldScene` and `SpawnerSystem`**

```js
this.world = new WorldScene(gameRoot, { map: MAP_CONFIG });
this.spawner = new SpawnerSystem(this.world.scene, this.world.arenaRadius, {
  map: MAP_CONFIG,
});
```

- [ ] **Step 3: Expose map config in HUD render payload**

```js
this.hud.render({
  // existing fields...
  arenaRadius: this.world.arenaRadius,
  spawnBand: this.spawner.lastSpawnBandId,
});
```

- [ ] **Step 4: Verify compile/build**

Run: `npm run build`  
Expected: build succeeds with no runtime-import errors.

- [ ] **Step 5: Commit**

```bash
git add src/game/Game.js
git commit -m "feat: add shared large-map configuration"
```

---

### Task 2: Add terrain visuals via `TerrainSystem`

**Files:**
- Create: `src/game/systems/TerrainSystem.js`
- Modify: `src/game/scene/WorldScene.js`

- [ ] **Step 1: Create `TerrainSystem` with mesh lifecycle**

```js
import * as THREE from "three";

export class TerrainSystem {
  constructor(scene, { arenaRadius, amplitude = 1.8, frequency = 0.08 } = {}) {
    this.scene = scene;
    this.arenaRadius = arenaRadius;
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.floorMesh = null;
    this.borderMesh = null;
  }

  build() { /* create floor + border meshes */ }
  dispose() { /* remove meshes and dispose resources */ }
}
```

- [ ] **Step 2: Implement visual-only elevation in `build()`**

```js
const geometry = new THREE.CircleGeometry(this.arenaRadius, 160);
const pos = geometry.attributes.position;
for (let i = 0; i < pos.count; i += 1) {
  const x = pos.getX(i);
  const z = pos.getY(i);
  const r = Math.hypot(x, z);
  const falloff = Math.max(0, 1 - r / this.arenaRadius);
  const h = Math.sin(x * this.frequency) * Math.cos(z * this.frequency) * this.amplitude * falloff;
  pos.setZ(i, h);
}
```

- [ ] **Step 3: Replace `_setupArena()` usage in `WorldScene`**

```js
import { TerrainSystem } from "../systems/TerrainSystem.js";

this.arenaRadius = options?.map?.arenaRadius ?? 20;
this.terrain = new TerrainSystem(this.scene, { arenaRadius: this.arenaRadius });
this.terrain.build();
```

- [ ] **Step 4: Keep clamp logic untouched**

```js
clampInsideArena(object3d, padding = 0) {
  const pos = object3d.position;
  const distance = Math.hypot(pos.x, pos.z);
  const max = this.arenaRadius - padding;
  if (distance <= max) return;
  const scale = max / distance;
  pos.x *= scale;
  pos.z *= scale;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/TerrainSystem.js src/game/scene/WorldScene.js
git commit -m "feat: add large arena terrain visuals"
```

---

### Task 3: Add distance-based spawn bands and pacing

**Files:**
- Modify: `src/game/systems/SpawnerSystem.js`

- [ ] **Step 1: Extend constructor with map config + validation**

```js
constructor(scene, arenaRadius, { map } = {}) {
  this.scene = scene;
  this.arenaRadius = arenaRadius;
  this.map = map;
  this.lastSpawnBandId = "outer";
  this._validateBands(map?.spawnBands || []);
}
```

- [ ] **Step 2: Add band-selection logic**

```js
_pickBand(elapsed) {
  const early = elapsed < 60;
  const mid = elapsed >= 60 && elapsed < 180;
  const weights = early
    ? { inner: 0.15, mid: 0.35, outer: 0.5 }
    : mid
      ? { inner: 0.25, mid: 0.45, outer: 0.3 }
      : { inner: 0.35, mid: 0.4, outer: 0.25 };
  return this._weightedBand(weights);
}
```

- [ ] **Step 3: Spawn mobs in chosen ring**

```js
const band = this._pickBand(this.elapsed);
this.lastSpawnBandId = band.id;
const radius = band.min + Math.random() * (band.max - band.min);
const angle = Math.random() * Math.PI * 2;
const x = Math.cos(angle) * radius;
const z = Math.sin(angle) * radius;
mob.setPosition(x, z);
```

- [ ] **Step 4: Keep existing difficulty scaling and spawn timer behavior**

Run: `npm run build`  
Expected: build succeeds and no constructor/signature mismatch.

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/SpawnerSystem.js
git commit -m "feat: add distance-based spawn band pacing"
```

---

### Task 4: Add lightweight HUD progression visibility

**Files:**
- Modify: `src/ui/HUD.js`
- Modify: `src/styles/ui.css`

- [ ] **Step 1: Add fields to `HUD.render` signature**

```js
render({ health, maxHealth, level, xp, nextLevelXp, mobCount, elapsed, weaponName, arenaRadius, spawnBand }) {
  // ...
}
```

- [ ] **Step 2: Render band/radius lines**

```js
<div class="hud-line compact"><span>Arena</span><span>R ${arenaRadius}</span></div>
<div class="hud-line compact"><span>Spawn Band</span><span>${spawnBand || "-"}</span></div>
```

- [ ] **Step 3: Ensure compact HUD style remains readable**

```css
.hud-line.compact strong {
  font-weight: 600;
  color: #e2e8f0;
}
```

- [ ] **Step 4: Verify visual rendering**

Run: `npm run dev`  
Expected: HUD shows arena radius and current spawn band without overlap.

- [ ] **Step 5: Commit**

```bash
git add src/ui/HUD.js src/styles/ui.css
git commit -m "feat: show map progression info in HUD"
```

---

### Task 5: Final integration and manual smoke pass

**Files:**
- Modify: `src/game/Game.js` (only if wiring mismatch appears)

- [ ] **Step 1: Confirm restart/reset behavior on larger map**

Check in code:
- `Game._restart` clears transient systems
- `SpawnerSystem.reset` resets elapsed + timers
- Terrain visuals remain stable across restarts

- [ ] **Step 2: Run production build**

Run: `npm run build`  
Expected: build succeeds.

- [ ] **Step 3: Run local play smoke check**

Run: `npm run dev`  
Manual checks:
- Player/mobs clamp correctly at large boundary.
- Terrain has visible height variation, but movement/combat still behave on XZ.
- Spawn bands visibly vary over run time (inner/mid/outer).
- Early run is not empty; late run is not instantly overwhelming.

- [ ] **Step 4: Tune only constants if pacing is off**

Adjust only:
- `MAP_CONFIG.spawnBands` ranges
- `_pickBand` weight tables
- `spawnRate` and wave-size constants (if strictly needed)

- [ ] **Step 5: Commit**

```bash
git add src/game/Game.js src/game/scene/WorldScene.js src/game/systems/TerrainSystem.js src/game/systems/SpawnerSystem.js src/ui/HUD.js src/styles/ui.css
git commit -m "feat: ship larger map progression with spawn bands"
```
