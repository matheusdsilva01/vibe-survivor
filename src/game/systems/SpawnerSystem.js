import { Mob } from "../entities/Mob.js";

export class SpawnerSystem {
  constructor(scene, arenaRadius) {
    this.scene = scene;
    this.arenaRadius = arenaRadius;
    this.mobs = [];
    this.spawnTimer = 0;
    this.elapsed = 0;
  }

  reset() {
    for (const mob of this.mobs) {
      this.scene.remove(mob.mesh);
    }
    this.mobs = [];
    this.spawnTimer = 0;
    this.elapsed = 0;
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
    for (let i = 0; i < waveSize; i += 1) {
      const difficultyScale = 1 + this.elapsed / 100;
      const mob = new Mob(this.scene, {
        health: 20 * difficultyScale,
        speed: 2.1 + Math.min(2, this.elapsed / 60),
        damage: 7 + this.elapsed / 30,
        xpReward: 10 + Math.floor(this.elapsed / 12),
      });

      const angle = Math.random() * Math.PI * 2;
      const radius = this.arenaRadius - 2 + Math.random() * 1.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      mob.setPosition(x, z);
      this.mobs.push(mob);
    }
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
