import { createPlayerHitFeedbackEvent } from "./feedbackEvents.js";

function horizontalDistance(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

export class CombatSystem {
  constructor({ onPlayerHit } = {}) {
    this.onPlayerHit = onPlayerHit;
  }

  update(player, mobs, deltaSeconds) {
    if (!player.alive) return;
    this._runMobContactDamage(player, mobs, deltaSeconds);
  }

  _runMobContactDamage(player, mobs, deltaSeconds) {
    if (player.contactDamageTimer > 0) return;

    for (const mob of mobs) {
      if (!mob.alive) continue;
      const distance = horizontalDistance(player.position, mob.mesh.position);
      if (distance <= player.radius + mob.radius) {
        player.takeDamage(mob.damage);
        this.onPlayerHit?.(
          createPlayerHitFeedbackEvent({
            amount: mob.damage,
            source: "contact",
          })
        );
        player.contactDamageTimer = Math.max(0.25, 0.65 - deltaSeconds);
        return;
      }
    }
  }
}
