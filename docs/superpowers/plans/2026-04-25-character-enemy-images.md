# Character and Enemy Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the player and enemies with image-based textures on 3D meshes using an atlas-style registry (`player.default`, `enemy.default`), without changing gameplay behavior.

**Architecture:** Add a small texture registry that loads and caches textures/materials from data keys, then inject those materials into `Player` and `Mob` creation paths. Keep existing geometry and combat systems intact; only visual material sourcing changes. Fail fast on missing atlas keys or load failures to avoid silent visual regressions.

**Tech Stack:** JavaScript ES modules, Three.js (`TextureLoader`, `MeshStandardMaterial`), Vite static assets

---

## File structure and responsibilities

- Create: `src/game/data/textureAtlas.js`
  - Defines atlas keys and image paths for player/enemy defaults.
- Create: `src/game/systems/AssetTextureRegistry.js`
  - Loads textures, configures texture sampling/wrapping, caches shared materials, resolves atlas keys.
- Modify: `src/game/Game.js`
  - Initializes registry at boot and wires materials/factories into entities/systems.
- Modify: `src/game/entities/Player.js`
  - Accepts injected material for player mesh instead of hardcoded color material.
- Modify: `src/game/entities/Mob.js`
  - Accepts injected material for enemy mesh instead of hardcoded color material.
- Modify: `src/game/systems/SpawnerSystem.js`
  - Passes enemy material into each `Mob` instance during spawn.
- Create assets:
  - `public/assets/player-default.png`
  - `public/assets/enemy-default.png`

---

### Task 1: Add texture atlas data

**Files:**
- Create: `src/game/data/textureAtlas.js`

- [ ] **Step 1: Create atlas constants and config**

```js
export const ATLAS_KEYS = {
  PLAYER_DEFAULT: "player.default",
  ENEMY_DEFAULT: "enemy.default",
};

export const TEXTURE_ATLAS = {
  [ATLAS_KEYS.PLAYER_DEFAULT]: "/assets/player-default.png",
  [ATLAS_KEYS.ENEMY_DEFAULT]: "/assets/enemy-default.png",
};
```

- [ ] **Step 2: Export helper accessors**

```js
export function getAtlasPath(key) {
  const path = TEXTURE_ATLAS[key];
  if (!path) throw new Error(`Missing texture atlas key: ${key}`);
  return path;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/game/data/textureAtlas.js
git commit -m "feat: add texture atlas key map"
```

---

### Task 2: Implement texture/material registry

**Files:**
- Create: `src/game/systems/AssetTextureRegistry.js`

- [ ] **Step 1: Add registry class with loader + caches**

```js
import * as THREE from "three";
import { getAtlasPath } from "../data/textureAtlas.js";

export class AssetTextureRegistry {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = new Map();
    this.materials = new Map();
  }
}
```

- [ ] **Step 2: Add async `init(keys)` loader**

```js
async init(keys) {
  await Promise.all(keys.map((key) => this._loadTexture(key)));
}
```

- [ ] **Step 3: Add `_loadTexture(key)` fail-fast behavior**

```js
_loadTexture(key) {
  return new Promise((resolve, reject) => {
    this.loader.load(
      getAtlasPath(key),
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this.textures.set(key, texture);
        resolve(texture);
      },
      undefined,
      () => reject(new Error(`Failed to load texture for key: ${key}`))
    );
  });
}
```

- [ ] **Step 4: Add `getMaterial(key, materialOpts)` cache**

```js
getMaterial(key, materialOpts = {}) {
  const cacheKey = `${key}:${JSON.stringify(materialOpts)}`;
  if (this.materials.has(cacheKey)) return this.materials.get(cacheKey);
  const texture = this.textures.get(key);
  if (!texture) throw new Error(`Texture not loaded for key: ${key}`);
  const material = new THREE.MeshStandardMaterial({ map: texture, ...materialOpts });
  this.materials.set(cacheKey, material);
  return material;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/game/systems/AssetTextureRegistry.js
git commit -m "feat: add shared texture registry"
```

---

### Task 3: Wire registry into Game boot

**Files:**
- Modify: `src/game/Game.js`

- [ ] **Step 1: Import atlas keys + registry**

```js
import { ATLAS_KEYS } from "./data/textureAtlas.js";
import { AssetTextureRegistry } from "./systems/AssetTextureRegistry.js";
```

- [ ] **Step 2: Convert startup to async bootstrap**

```js
this.textureRegistry = new AssetTextureRegistry();
await this.textureRegistry.init([ATLAS_KEYS.PLAYER_DEFAULT, ATLAS_KEYS.ENEMY_DEFAULT]);
```

- [ ] **Step 3: Resolve materials and pass into entities/systems**

```js
const playerMaterial = this.textureRegistry.getMaterial(ATLAS_KEYS.PLAYER_DEFAULT, { roughness: 0.6 });
const enemyMaterial = this.textureRegistry.getMaterial(ATLAS_KEYS.ENEMY_DEFAULT, { roughness: 0.7 });
```

- [ ] **Step 4: Use these materials in Player and SpawnerSystem constructor calls**

```js
this.player = new Player(this.world.scene, { material: playerMaterial });
this.spawner = new SpawnerSystem(this.world.scene, this.world.arenaRadius, {
  map: MAP_CONFIG,
  enemyMaterial,
});
```

- [ ] **Step 5: Commit**

```bash
git add src/game/Game.js
git commit -m "feat: initialize texture registry in game boot"
```

---

### Task 4: Make Player and Mob material-injectable

**Files:**
- Modify: `src/game/entities/Player.js`
- Modify: `src/game/entities/Mob.js`

- [ ] **Step 1: Update Player constructor signature**

```js
constructor(scene, { material } = {}) {
  this.mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...),
    material || new THREE.MeshStandardMaterial({ color: 0x4f8ef7, roughness: 0.5 })
  );
}
```

- [ ] **Step 2: Update Mob constructor signature**

```js
constructor(scene, { health = 25, speed = 2.3, damage = 9, xpReward = 10, material } = {}) {
  this.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 16),
    material || new THREE.MeshStandardMaterial({ color: 0xd35656, roughness: 0.6 })
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/game/entities/Player.js src/game/entities/Mob.js
git commit -m "feat: allow injected textured materials for entities"
```

---

### Task 5: Pass enemy material through SpawnerSystem

**Files:**
- Modify: `src/game/systems/SpawnerSystem.js`

- [ ] **Step 1: Extend constructor options**

```js
constructor(scene, arenaRadius, { map, enemyMaterial } = {}) {
  this.enemyMaterial = enemyMaterial || null;
}
```

- [ ] **Step 2: Apply enemy material when spawning mobs**

```js
const mob = new Mob(this.scene, {
  health: ...,
  speed: ...,
  damage: ...,
  xpReward: ...,
  material: this.enemyMaterial,
});
```

- [ ] **Step 3: Commit**

```bash
git add src/game/systems/SpawnerSystem.js
git commit -m "feat: wire enemy texture material through spawner"
```

---

### Task 6: Add image assets and verify runtime

**Files:**
- Create: `public/assets/player-default.png`
- Create: `public/assets/enemy-default.png`

- [ ] **Step 1: Add first-pass texture files**

Use two PNG textures (power-of-two preferred, e.g., 512x512).

- [ ] **Step 2: Run production build**

Run: `npm run build`  
Expected: Build succeeds, no missing asset path errors.

- [ ] **Step 3: Run local smoke check**

Run: `npm run dev`  
Manual checks:
- Player and mobs show image textures.
- Lighting/shadows still look acceptable.
- No console errors for missing atlas keys or load failures.

- [ ] **Step 4: Commit assets and wiring**

```bash
git add public/assets/player-default.png public/assets/enemy-default.png src/game/data/textureAtlas.js src/game/systems/AssetTextureRegistry.js src/game/Game.js src/game/entities/Player.js src/game/entities/Mob.js src/game/systems/SpawnerSystem.js
git commit -m "feat: add textured player and enemy visuals"
```

---

### Task 7: Finish flow without auto-merge

**Files:**
- None (workflow step)

- [ ] **Step 1: Keep branch for manual integration**

Do **not** auto-merge after implementation. Present integration options and keep branch as-is unless user explicitly asks to merge.

- [ ] **Step 2: Confirm readiness**

Share:
- branch name
- changed files
- run commands completed

