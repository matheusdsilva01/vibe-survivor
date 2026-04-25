# Character and Enemy Image Integration Design

## Goal
Add image-based visuals to player and enemies using texture-mapped 3D meshes, with a lightweight atlas-style registry that supports future variants.

## Scope
- In scope:
  - One player texture and one enemy texture
  - Shared texture/material registry with named atlas keys
  - Integration into existing `Player` and `Mob` construction flow
- Out of scope:
  - Full skin customization UI
  - GLTF model replacement
  - Multi-frame sprite animation

## Architecture

### 1) Asset texture registry (atlas-style keys)
- Create a registry module that:
  - loads textures via `THREE.TextureLoader`
  - caches textures and shared materials
  - resolves keys like `player.default`, `enemy.default`
- Registry is initialized once at game bootstrap.

### 2) Entity material integration
- Keep existing mesh geometry and gameplay logic.
- Replace color-only `MeshStandardMaterial` creation in:
  - `Player` with registry-provided player material
  - `Mob` with registry-provided enemy material
- Maintain lighting/shadow compatibility through `MeshStandardMaterial`.

### 3) Data-driven atlas config
- Add a small data map for visual keys and file paths:
  - `player.default -> /assets/player-default.png`
  - `enemy.default -> /assets/enemy-default.png`
- Keep wrap/repeat/filter settings in registry init so entities remain render-agnostic.

## Data Flow
1. `Game` boot starts, creates `AssetTextureRegistry`.
2. Registry loads configured texture paths and creates shared materials.
3. `Game` passes materials (or a material resolver) into `Player` and `SpawnerSystem`/`Mob`.
4. Entities create meshes using textured materials.

## Error Handling
- Texture loading failures should throw explicit boot errors (no silent fallback path).
- Missing atlas key lookups should throw with clear key name to avoid hidden rendering issues.

## Verification (implementation phase)
- `npm run build` passes.
- Runtime smoke check:
  - Player and enemies render with intended textures.
  - Lighting and shadows still look correct.
  - No texture reloading churn while spawning enemies.
  - No regressions in movement/combat behavior.

## Notes
- This design intentionally keeps current primitive geometry so image integration stays low-risk.
- Atlas-style registry is chosen so future variant textures can be added by data entry, not system rewrites.
