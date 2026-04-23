import * as THREE from "three";
import { TerrainSystem } from "../systems/TerrainSystem.js";

export class WorldScene {
  constructor(container, options = {}) {
    this.arenaRadius = options?.map?.arenaRadius ?? 20;
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x13151f);
    this.scene.fog = new THREE.Fog(0x13151f, 35, Math.max(58, this.arenaRadius * 2.2));

    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 14, 12);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.cameraOrbit = {
      yaw: 0.7,
      pitch: 0.78,
      radius: 15,
      sensitivity: 0.0027,
      minPitch: 0.25,
      maxPitch: 1.35,
    };
    this.shake = {
      strength: 0,
      duration: 0,
      remaining: 0,
      seed: 0,
    };
    this.cameraForward = new THREE.Vector3(0, 0, -1);
    this.cameraRight = new THREE.Vector3(1, 0, 0);
    this._setupLights();
    this.terrain = new TerrainSystem(this.scene, { arenaRadius: this.arenaRadius });
    this.terrain.build();
    this._setupGrid();
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0x7f7f95, 0.65);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1);
    const shadowExtent = Math.max(30, this.arenaRadius * 1.1);
    directional.position.set(10, 18, 6);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 1024;
    directional.shadow.mapSize.height = 1024;
    directional.shadow.camera.near = 1;
    directional.shadow.camera.far = Math.max(60, this.arenaRadius * 3);
    directional.shadow.camera.left = -shadowExtent;
    directional.shadow.camera.right = shadowExtent;
    directional.shadow.camera.top = shadowExtent;
    directional.shadow.camera.bottom = -shadowExtent;
    this.scene.add(directional);
  }

  _setupGrid() {
    const size = Math.max(40, this.arenaRadius * 2);
    const divisions = Math.max(40, Math.floor(size / 2));
    const grid = new THREE.GridHelper(size, divisions, 0x2f3744, 0x2b3240);
    grid.position.y = 0.03;
    this.scene.add(grid);
  }

  clampInsideArena(object3d, padding = 0) {
    const pos = object3d.position;
    const distance = Math.hypot(pos.x, pos.z);
    const max = this.arenaRadius - padding;
    if (distance <= max) return;

    const scale = max / distance;
    pos.x *= scale;
    pos.z *= scale;
  }

  updateCamera(targetPosition, deltaSeconds = 1 / 60) {
    const { yaw, pitch, radius } = this.cameraOrbit;
    const offsetX = Math.sin(yaw) * Math.cos(pitch) * radius;
    const offsetY = Math.sin(pitch) * radius;
    const offsetZ = Math.cos(yaw) * Math.cos(pitch) * radius;

    const desired = new THREE.Vector3(
      targetPosition.x + offsetX,
      targetPosition.y + offsetY,
      targetPosition.z + offsetZ
    );
    this._updateCameraShake(deltaSeconds);
    if (this.shake.remaining > 0) {
      const decay = this.shake.remaining / this.shake.duration;
      const strength = this.shake.strength * decay;
      desired.x += Math.sin(this.shake.seed * 31.7) * strength;
      desired.y += Math.cos(this.shake.seed * 27.1) * strength * 0.7;
      desired.z += Math.sin(this.shake.seed * 19.3) * strength;
    }
    this.camera.position.lerp(desired, 0.12);
    this.camera.lookAt(targetPosition.x, targetPosition.y + 1.3, targetPosition.z);
    this._updateCameraBasis();
  }

  applyMouseOrbit(deltaX, deltaY) {
    this.cameraOrbit.yaw -= deltaX * this.cameraOrbit.sensitivity;
    this.cameraOrbit.pitch = Math.max(
      this.cameraOrbit.minPitch,
      Math.min(this.cameraOrbit.maxPitch, this.cameraOrbit.pitch - deltaY * this.cameraOrbit.sensitivity)
    );
  }

  getCameraBasis() {
    return {
      forward: this.cameraForward.clone(),
      right: this.cameraRight.clone(),
    };
  }

  _updateCameraBasis() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }

    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
    this.cameraForward.copy(forward);
    this.cameraRight.copy(right);
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  addCameraImpulse(strength = 0.1, duration = 0.14) {
    this.shake.strength = Math.min(0.5, Math.max(this.shake.strength, strength));
    this.shake.duration = Math.min(0.45, Math.max(this.shake.duration, duration));
    this.shake.remaining = Math.max(this.shake.remaining, this.shake.duration);
  }

  _updateCameraShake(deltaSeconds) {
    if (this.shake.remaining <= 0) return;
    this.shake.remaining = Math.max(0, this.shake.remaining - deltaSeconds);
    this.shake.seed += 1;
    if (this.shake.remaining <= 0) {
      this.shake.strength = 0;
      this.shake.duration = 0;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  requestPointerLock() {
    this.renderer.domElement.requestPointerLock?.();
  }

  exitPointerLock() {
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
  }

  isPointerLocked() {
    return document.pointerLockElement === this.renderer.domElement;
  }
}
