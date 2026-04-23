import * as THREE from "three";
import { Projectile } from "../entities/Projectile.js";

function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function sortByNearest(position, mobs) {
  return [...mobs]
    .filter((mob) => mob.alive)
    .sort((left, right) => distance2D(position, left.mesh.position) - distance2D(position, right.mesh.position));
}

function applyDamage(mob, damage, effects) {
  mob.takeDamage(damage);
  if (effects?.slowAmount) {
    mob.applySlow(effects.slowAmount, effects.slowDuration || 1.2);
  }
}

export class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];
  }

  reset() {
    for (const projectile of this.projectiles) {
      this.scene.remove(projectile.mesh);
    }
    this.projectiles = [];
  }

  update(player, mobs, deltaSeconds) {
    const weapon = player.weapon;
    if (!weapon || !player.alive) return;

    weapon.cooldownTimer = Math.max(0, weapon.cooldownTimer - deltaSeconds);
    if (weapon.cooldownTimer <= 0) {
      this._triggerAttack(player, mobs, weapon);
      weapon.cooldownTimer = weapon.stats.cooldown;
    }

    this._updateProjectiles(mobs, deltaSeconds);
  }

  _triggerAttack(player, mobs, weapon) {
    const nearestMobs = sortByNearest(player.position, mobs);
    if (nearestMobs.length === 0) return;

    if (weapon.archetype === "melee") {
      this._doMeleeStrike(player, nearestMobs, weapon);
      return;
    }

    if (weapon.archetype === "pulse") {
      this._doPulseAttack(player, nearestMobs, weapon);
      return;
    }

    if (weapon.archetype === "projectile" || weapon.archetype === "boomerang") {
      this._spawnProjectiles(player, nearestMobs, weapon);
    }
  }

  _doMeleeStrike(player, nearestMobs, weapon) {
    const maxHits = Math.max(1, Math.floor(1 + weapon.stats.projectileCount / 2));
    const hits = nearestMobs.slice(0, maxHits);
    for (const mob of hits) {
      if (distance2D(player.position, mob.mesh.position) <= weapon.stats.range) {
        applyDamage(mob, weapon.stats.damage, weapon.stats);
        if (weapon.stats.aoeRadius > 0) {
          this._applySplashDamage(mob, nearestMobs, weapon);
        }
      }
    }
  }

  _doPulseAttack(player, nearestMobs, weapon) {
    for (const mob of nearestMobs) {
      if (distance2D(player.position, mob.mesh.position) <= weapon.stats.aoeRadius) {
        applyDamage(mob, weapon.stats.damage, weapon.stats);
      }
    }
  }

  _applySplashDamage(primaryMob, mobs, weapon) {
    for (const mob of mobs) {
      if (mob === primaryMob || !mob.alive) continue;
      if (distance2D(primaryMob.mesh.position, mob.mesh.position) <= weapon.stats.aoeRadius) {
        applyDamage(mob, weapon.stats.damage * 0.6, weapon.stats);
      }
    }
  }

  _spawnProjectiles(player, nearestMobs, weapon) {
    const target = nearestMobs[0];
    const baseDirection = new THREE.Vector3()
      .subVectors(target.mesh.position, player.position)
      .setY(0)
      .normalize();
    if (baseDirection.lengthSq() < 0.001) return;

    const count = Math.max(1, Math.floor(weapon.stats.projectileCount));
    const spread = count > 1 ? 0.25 : 0;
    for (let i = 0; i < count; i += 1) {
      const projectile = new Projectile(this.scene, {
        color: weapon.id === "frost_wand" ? 0x93c5fd : 0xfbbf24,
        radius: weapon.id === "chakram" ? 0.2 : 0.14,
        maxLifetime: weapon.archetype === "boomerang" ? 2.1 : 1.6,
      });
      const offset = (i - (count - 1) / 2) * spread;
      const dir = baseDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), offset).normalize();
      projectile.direction.copy(dir);
      projectile.speed = weapon.stats.speed;
      projectile.damage = weapon.stats.damage;
      projectile.remainingPierce = weapon.stats.pierce || 0;
      projectile.maxDistance = weapon.stats.range;
      projectile.mode = weapon.archetype === "boomerang" ? "boomerang" : "linear";
      projectile.owner = player;
      projectile.setPosition(player.position.x, 1.1, player.position.z);
      this.projectiles.push(projectile);
    }
  }

  _updateProjectiles(mobs, deltaSeconds) {
    for (const projectile of this.projectiles) {
      projectile.update(deltaSeconds);
      if (projectile.dead) continue;

      for (const mob of mobs) {
        if (!mob.alive) continue;
        if (projectile.hitMobIds.has(mob.id)) continue;
        if (distance2D(projectile.mesh.position, mob.mesh.position) > mob.radius + 0.35) continue;

        projectile.hitMobIds.add(mob.id);
        applyDamage(mob, projectile.damage, projectile.owner.weapon.stats);
        if (projectile.remainingPierce > 0) {
          projectile.remainingPierce -= 1;
        } else {
          projectile.dead = true;
          break;
        }
      }
    }

    const aliveProjectiles = [];
    for (const projectile of this.projectiles) {
      if (projectile.dead) {
        this.scene.remove(projectile.mesh);
      } else {
        aliveProjectiles.push(projectile);
      }
    }
    this.projectiles = aliveProjectiles;
  }
}
