import * as THREE from "three";

let NEXT_MOB_ID = 1;

export class Mob {
  constructor(scene, { health = 25, speed = 2.3, damage = 9, xpReward = 10 } = {}) {
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd35656, roughness: 0.6 })
    );
    this.mesh.castShadow = true;
    this.mesh.position.y = 0.55;
    scene.add(this.mesh);

    this.radius = 0.55;
    this.id = NEXT_MOB_ID++;
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.baseSpeed = speed;
    this.slowAmount = 0;
    this.slowTimer = 0;
    this.damage = damage;
    this.xpReward = xpReward;
    this.alive = true;
  }

  setPosition(x, z) {
    this.mesh.position.set(x, this.mesh.position.y, z);
  }

  update(deltaSeconds, targetPosition) {
    if (!this.alive) return;
    this.slowTimer = Math.max(0, this.slowTimer - deltaSeconds);
    const speedMultiplier = this.slowTimer > 0 ? 1 - this.slowAmount : 1;
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.mesh.position)
      .setY(0);

    if (direction.lengthSq() < 0.0001) return;
    direction.normalize();
    this.mesh.position.addScaledVector(direction, this.baseSpeed * speedMultiplier * deltaSeconds);
    this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
  }

  applySlow(amount, duration) {
    this.slowAmount = Math.max(this.slowAmount, Math.min(0.8, amount));
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }
}
