import * as THREE from "three";

export class Projectile {
  constructor(scene, { color = 0xdbeafe, radius = 0.16, maxLifetime = 1.4 }) {
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 10, 10),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25 })
    );
    this.mesh.castShadow = false;
    this.mesh.position.y = 1;
    scene.add(this.mesh);

    this.direction = new THREE.Vector3(0, 0, 1);
    this.speed = 14;
    this.damage = 10;
    this.remainingPierce = 0;
    this.travelled = 0;
    this.maxDistance = 10;
    this.maxLifetime = maxLifetime;
    this.life = maxLifetime;
    this.hitMobIds = new Set();
    this.dead = false;
    this.mode = "linear";
    this.origin = new THREE.Vector3();
    this.owner = null;
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
    this.origin.copy(this.mesh.position);
  }

  update(deltaSeconds) {
    if (this.dead) return;
    this.life -= deltaSeconds;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }

    if (this.mode === "linear") {
      const step = this.speed * deltaSeconds;
      this.mesh.position.addScaledVector(this.direction, step);
      this.travelled += step;
      if (this.travelled >= this.maxDistance) this.dead = true;
      return;
    }

    if (this.mode === "boomerang") {
      const half = this.maxDistance * 0.5;
      const toOwner = new THREE.Vector3().subVectors(this.owner.position, this.mesh.position).setY(0);
      const outward = this.travelled < half;
      const dir = outward
        ? this.direction.clone()
        : toOwner.lengthSq() > 0.001
          ? toOwner.normalize()
          : this.direction.clone().negate();
      const step = this.speed * deltaSeconds;
      this.mesh.position.addScaledVector(dir, step);
      this.travelled += step;
      if (!outward && toOwner.length() < 1) this.dead = true;
      if (this.travelled >= this.maxDistance) this.dead = true;
    }
  }
}
