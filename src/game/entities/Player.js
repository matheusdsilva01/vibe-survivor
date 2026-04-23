import * as THREE from "three";

const PLAYER_SIZE = { width: 1, height: 1.6, depth: 1 };
const BASE_STATS = {
  moveSpeed: 7,
  maxHealth: 100,
  xpMultiplier: 1,
};

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(PLAYER_SIZE.width, PLAYER_SIZE.height, PLAYER_SIZE.depth),
      new THREE.MeshStandardMaterial({ color: 0x4f8ef7, roughness: 0.5 })
    );
    this.mesh.castShadow = true;
    this.mesh.position.set(0, PLAYER_SIZE.height / 2, 0);
    scene.add(this.mesh);

    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };

    this.velocity = new THREE.Vector3();
    this.lookDir = new THREE.Vector3(0, 0, 1);
    this.radius = 0.6;
    this.contactDamageTimer = 0;
    this.weapon = null;
    this.weaponModel = null;
    this.weaponVisualTimer = 0;

    this.stats = { ...BASE_STATS };
    this.health = this.stats.maxHealth;
    this.alive = true;
  }

  update(deltaSeconds, cameraBasis) {
    const dirX = Number(this.input.right) - Number(this.input.left);
    const dirZ = Number(this.input.backward) - Number(this.input.forward);
    const movement = new THREE.Vector3();
    if (cameraBasis?.right && cameraBasis?.forward) {
      movement
        .addScaledVector(cameraBasis.right, -dirX)
        .addScaledVector(cameraBasis.forward, -dirZ);
    } else {
      movement.set(dirX, 0, dirZ);
    }
    movement.y = 0;

    if (movement.lengthSq() > 0) {
      movement.normalize();
      this.lookDir.copy(movement);
      this.mesh.rotation.y = Math.atan2(movement.x, movement.z);
    }

    this.velocity.copy(movement.multiplyScalar(this.stats.moveSpeed));
    this.mesh.position.addScaledVector(this.velocity, deltaSeconds);

    this.contactDamageTimer = Math.max(0, this.contactDamageTimer - deltaSeconds);
    this.weaponVisualTimer += deltaSeconds;
    this._updateWeaponModel();
  }

  get position() {
    return this.mesh.position;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  heal(amount) {
    this.health = Math.min(this.stats.maxHealth, this.health + amount);
  }

  setWeapon(weaponRuntime) {
    this.weapon = weaponRuntime;
    this._setWeaponModel(weaponRuntime.id);
  }

  resetBaseStats() {
    this.stats = { ...BASE_STATS };
  }

  _updateWeaponModel() {
    if (!this.weaponModel) return;

    if (this.weapon?.id === "fire_orb") {
      const t = this.weaponVisualTimer * 2.4;
      this.weaponModel.position.set(Math.cos(t) * 1.15, 0.95 + Math.sin(t * 2) * 0.08, Math.sin(t) * 1.15);
      return;
    }

    this.weaponModel.position.set(0.62, 0.2, 0.05);
    this.weaponModel.rotation.set(-0.35, 0.4, -0.15);
  }

  _setWeaponModel(weaponId) {
    if (this.weaponModel) {
      this.mesh.remove(this.weaponModel);
      this._disposeWeaponModel(this.weaponModel);
      this.weaponModel = null;
    }

    this.weaponModel = this._createWeaponModel(weaponId);
    if (!this.weaponModel) return;
    this.mesh.add(this.weaponModel);
    this._updateWeaponModel();
  }

  _createWeaponModel(weaponId) {
    if (weaponId === "iron_sword") {
      const group = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.85, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.65, roughness: 0.3 })
      );
      blade.position.y = 0.38;
      const hilt = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.08, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x7c5a3a, roughness: 0.8 })
      );
      hilt.position.y = -0.04;
      group.add(blade, hilt);
      return group;
    }

    if (weaponId === "war_hammer") {
      const group = new THREE.Group();
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.95, 10),
        new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.45 })
      );
      handle.rotation.z = Math.PI / 2;
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.18, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.55, roughness: 0.35 })
      );
      head.position.x = 0.48;
      group.add(handle, head);
      return group;
    }

    if (weaponId === "fire_orb") {
      return new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xea580c,
          emissiveIntensity: 0.6,
          roughness: 0.3,
        })
      );
    }

    if (weaponId === "dual_daggers") {
      return new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.45, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.45, roughness: 0.35 })
      );
    }

    if (weaponId === "hunter_bow" || weaponId === "crossbow") {
      return new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.04, 10, 18, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x8b5e34, roughness: 0.7 })
      );
    }

    if (weaponId === "arcane_staff" || weaponId === "frost_wand") {
      const group = new THREE.Group();
      const staff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.85, 10),
        new THREE.MeshStandardMaterial({ color: 0x9a7b4f, roughness: 0.75 })
      );
      const gem = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        new THREE.MeshStandardMaterial({
          color: weaponId === "frost_wand" ? 0x60a5fa : 0xa78bfa,
          emissive: weaponId === "frost_wand" ? 0x3b82f6 : 0x7c3aed,
          emissiveIntensity: 0.45,
        })
      );
      gem.position.y = 0.48;
      group.add(staff, gem);
      return group;
    }

    if (weaponId === "chakram") {
      return new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.05, 10, 20),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.25 })
      );
    }

    return null;
  }

  _disposeWeaponModel(object) {
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => mat.dispose?.());
      } else {
        child.material?.dispose?.();
      }
    });
  }
}
