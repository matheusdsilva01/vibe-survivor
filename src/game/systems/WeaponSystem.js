import * as THREE from "three";
import { Projectile } from "../entities/Projectile.js";
import { createMobHitFeedbackEvent } from "./feedbackEvents.js";
import { WEAPON_MODES } from "../data/weapons.js";

function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function sortByNearest(position, mobs) {
  return [...mobs]
    .filter((mob) => mob.alive)
    .sort((left, right) => distance2D(position, left.mesh.position) - distance2D(position, right.mesh.position));
}

function applyDamage(mob, damage, effects) {
  const killed = mob.takeDamage(damage);
  if (effects?.slowAmount) {
    mob.applySlow(effects.slowAmount, effects.slowDuration || 1.2);
  }
  return killed;
}

export class WeaponSystem {
  constructor(scene, { onMobHit } = {}) {
    this.scene = scene;
    this.projectiles = [];
    this.onMobHit = onMobHit;
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

    if (weapon.mode === WEAPON_MODES.FRONTAL_CONE) {
      this._doFrontalConeAttack(player, nearestMobs, weapon);
      return;
    }

    if (weapon.mode === WEAPON_MODES.CIRCULAR_AREA) {
      this._doCircularAreaAttack(player, nearestMobs, weapon);
      return;
    }

    if (weapon.mode === WEAPON_MODES.PROJECTILE) {
      this._spawnProjectiles(player, nearestMobs, weapon);
      return;
    }

    if (weapon.mode === WEAPON_MODES.RICOCHET) {
      this._spawnRicochetProjectiles(player, nearestMobs, weapon);
    }
  }

  _doFrontalConeAttack(player, nearestMobs, weapon) {
    const maxHits = Math.max(1, Math.floor(1 + weapon.stats.projectileCount / 2));
    const coneHalfAngleRadians = THREE.MathUtils.degToRad(22.5);
    const coneDotThreshold = Math.cos(coneHalfAngleRadians);
    const forward = player.lookDir.clone().setY(0);
    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, 1);
    } else {
      forward.normalize();
    }

    let hitCount = 0;
    for (const mob of nearestMobs) {
      if (hitCount >= maxHits) break;
      const mobOffset = new THREE.Vector3().subVectors(mob.mesh.position, player.position).setY(0);
      const distance = mobOffset.length();
      if (distance > weapon.stats.range || distance < 0.0001) continue;

      mobOffset.normalize();
      if (mobOffset.dot(forward) < coneDotThreshold) continue;

      const killed = applyDamage(mob, weapon.stats.damage, weapon.stats);
      this.onMobHit?.(
        createMobHitFeedbackEvent({
          amount: weapon.stats.damage,
          killed,
          source: weapon.mode,
          position: mob.mesh.position,
        })
      );
      if (weapon.stats.aoeRadius > 0) {
        this._applySplashDamage(mob, nearestMobs, weapon);
      }
      hitCount += 1;
    }
  }

  _doCircularAreaAttack(player, nearestMobs, weapon) {
    for (const mob of nearestMobs) {
      if (distance2D(player.position, mob.mesh.position) <= weapon.stats.aoeRadius) {
        const killed = applyDamage(mob, weapon.stats.damage, weapon.stats);
        this.onMobHit?.(
          createMobHitFeedbackEvent({
            amount: weapon.stats.damage,
            killed,
            source: weapon.mode,
            position: mob.mesh.position,
          })
        );
      }
    }
  }

  _applySplashDamage(primaryMob, mobs, weapon) {
    for (const mob of mobs) {
      if (mob === primaryMob || !mob.alive) continue;
      if (distance2D(primaryMob.mesh.position, mob.mesh.position) <= weapon.stats.aoeRadius) {
        const amount = weapon.stats.damage * 0.6;
        const killed = applyDamage(mob, amount, weapon.stats);
        this.onMobHit?.(
          createMobHitFeedbackEvent({
            amount,
            killed,
            source: `${weapon.mode}_splash`,
            position: mob.mesh.position,
          })
        );
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
        radius: 0.14,
        maxLifetime: 1.6,
      });
      const offset = (i - (count - 1) / 2) * spread;
      const dir = baseDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), offset).normalize();
      projectile.direction.copy(dir);
      projectile.speed = weapon.stats.speed;
      projectile.damage = weapon.stats.damage;
      projectile.remainingPierce = weapon.stats.pierce || 0;
      projectile.maxDistance = weapon.stats.range;
      projectile.mode = WEAPON_MODES.PROJECTILE;
      projectile.owner = player;
      projectile.setPosition(player.position.x, 1.1, player.position.z);
      this.projectiles.push(projectile);
    }
  }

  _spawnRicochetProjectiles(player, nearestMobs, weapon) {
    const target = nearestMobs[0];
    const baseDirection = new THREE.Vector3()
      .subVectors(target.mesh.position, player.position)
      .setY(0)
      .normalize();
    if (baseDirection.lengthSq() < 0.001) return;

    const count = Math.max(1, Math.floor(weapon.stats.projectileCount));
    const spread = count > 1 ? 0.18 : 0;
    for (let i = 0; i < count; i += 1) {
      const projectile = new Projectile(this.scene, {
        color: 0xf59e0b,
        radius: 0.2,
        maxLifetime: 2.2,
      });
      const offset = (i - (count - 1) / 2) * spread;
      const dir = baseDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), offset).normalize();
      projectile.direction.copy(dir);
      projectile.speed = weapon.stats.speed;
      projectile.damage = weapon.stats.damage;
      projectile.remainingPierce = 0;
      projectile.remainingRicochets = Math.max(1, Math.floor(weapon.stats.ricochetCount || 1));
      projectile.ricochetRange = weapon.stats.ricochetRange || 8;
      projectile.maxDistance = weapon.stats.range;
      projectile.mode = WEAPON_MODES.RICOCHET;
      projectile.owner = player;
      projectile.setPosition(player.position.x, 1.1, player.position.z);
      this.projectiles.push(projectile);
    }
  }

  _findRicochetTarget(projectile, currentMob, mobs) {
    let bestMob = null;
    let bestDistance = Infinity;
    for (const mob of mobs) {
      if (!mob.alive || mob === currentMob) continue;
      if (projectile.hitMobIds.has(mob.id)) continue;
      const distance = distance2D(currentMob.mesh.position, mob.mesh.position);
      if (distance > projectile.ricochetRange) continue;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMob = mob;
      }
    }
    return bestMob;
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
        const killed = applyDamage(mob, projectile.damage, projectile.owner.weapon.stats);
        this.onMobHit?.(
          createMobHitFeedbackEvent({
            amount: projectile.damage,
            killed,
            source: projectile.mode,
            position: mob.mesh.position,
          })
        );

        if (projectile.mode === WEAPON_MODES.RICOCHET) {
          if (projectile.remainingRicochets > 0) {
            const nextTarget = this._findRicochetTarget(projectile, mob, mobs);
            if (nextTarget) {
              const ricochetDir = new THREE.Vector3()
                .subVectors(nextTarget.mesh.position, projectile.mesh.position)
                .setY(0)
                .normalize();
              if (ricochetDir.lengthSq() > 0.0001) {
                projectile.direction.copy(ricochetDir);
                projectile.remainingRicochets -= 1;
                break;
              }
            }
          }
          projectile.dead = true;
          break;
        }

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
