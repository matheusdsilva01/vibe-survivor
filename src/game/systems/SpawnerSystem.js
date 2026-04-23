import { Mob } from "../entities/Mob.js";

export class SpawnerSystem {
  constructor(scene, arenaRadius, { map } = {}) {
    this.scene = scene;
    this.arenaRadius = arenaRadius;
    this.map = map || null;
    this.mobs = [];
    this.spawnTimer = 0;
    this.elapsed = 0;
    this.spawnBands = this._resolveSpawnBands(map?.spawnBands);
    this.lastSpawnBandId = this.spawnBands[this.spawnBands.length - 1].id;
  }

  reset() {
    for (const mob of this.mobs) {
      this.scene.remove(mob.mesh);
    }
    this.mobs = [];
    this.spawnTimer = 0;
    this.elapsed = 0;
    this.lastSpawnBandId = this.spawnBands[this.spawnBands.length - 1].id;
  }

  update(deltaSeconds) {
    this.elapsed += deltaSeconds;
    this.spawnTimer -= deltaSeconds;
    if (this.spawnTimer <= 0) {
      this.spawnWave();
      const spawnRate = Math.max(0.4, 2 - this.elapsed * 0.02);
      this.spawnTimer = spawnRate;
    }
  }

  spawnWave() {
    const waveSize = 1 + Math.floor(this.elapsed / 28);
    const band = this._pickBand(this.elapsed);
    this.lastSpawnBandId = band.id;
    for (let i = 0; i < waveSize; i += 1) {
      const difficultyScale = 1 + this.elapsed / 100;
      const mob = new Mob(this.scene, {
        health: 20 * difficultyScale,
        speed: 2.1 + Math.min(2, this.elapsed / 60),
        damage: 7 + this.elapsed / 30,
        xpReward: 10 + Math.floor(this.elapsed / 12),
      });

      const angle = Math.random() * Math.PI * 2;
      const radius = band.min + Math.random() * (band.max - band.min);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      mob.setPosition(x, z);
      this.mobs.push(mob);
    }
  }

  _resolveSpawnBands(rawBands) {
    if (!Array.isArray(rawBands) || rawBands.length === 0) {
      const cap = Math.max(6, this.arenaRadius - 4);
      const oneThird = cap / 3;
      return [
        { id: "inner", min: 6, max: Math.max(8, oneThird) },
        { id: "mid", min: Math.max(8, oneThird), max: Math.max(12, oneThird * 2) },
        { id: "outer", min: Math.max(12, oneThird * 2), max: cap },
      ];
    }
    return this._validateBands(rawBands);
  }

  _validateBands(rawBands) {
    const cap = Math.max(6, this.arenaRadius - 2);
    let previousMax = 0;
    const bands = rawBands.map((band, index) => {
      const min = Number(band?.min);
      const max = Number(band?.max);
      if (!band?.id || !Number.isFinite(min) || !Number.isFinite(max)) {
        throw new Error(`Invalid spawn band at index ${index}: expected id/min/max`);
      }
      if (min <= 0 || max <= 0 || min >= max) {
        throw new Error(`Invalid spawn band range for '${band.id}'`);
      }
      if (min < previousMax) {
        throw new Error(`Spawn bands overlap or are unordered near '${band.id}'`);
      }
      if (max > cap) {
        throw new Error(`Spawn band '${band.id}' exceeds arena radius cap ${cap}`);
      }
      previousMax = max;
      return { id: band.id, min, max };
    });
    return bands;
  }

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

  _weightedBand(weights) {
    const totalWeight = this.spawnBands.reduce((sum, band) => sum + (weights[band.id] || 0), 0);
    if (totalWeight <= 0) {
      return this.spawnBands[this.spawnBands.length - 1];
    }

    let roll = Math.random() * totalWeight;
    for (const band of this.spawnBands) {
      roll -= weights[band.id] || 0;
      if (roll <= 0) return band;
    }
    return this.spawnBands[this.spawnBands.length - 1];
  }

  removeDeadMobs() {
    const dead = this.mobs.filter((mob) => !mob.alive);
    for (const mob of dead) {
      this.scene.remove(mob.mesh);
    }
    this.mobs = this.mobs.filter((mob) => mob.alive);
    return dead;
  }
}
