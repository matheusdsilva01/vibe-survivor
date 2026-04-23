import * as THREE from "three";

export class WorldScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x13151f);
    this.scene.fog = new THREE.Fog(0x13151f, 20, 58);

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

    this.arenaRadius = 20;
    this.cameraOrbit = {
      yaw: 0.7,
      pitch: 0.78,
      radius: 15,
      sensitivity: 0.0027,
      minPitch: 0.25,
      maxPitch: 1.35,
    };
    this.cameraForward = new THREE.Vector3(0, 0, -1);
    this.cameraRight = new THREE.Vector3(1, 0, 0);
    this._setupLights();
    this._setupArena();
    this._setupGrid();
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0x7f7f95, 0.65);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(10, 18, 6);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 1024;
    directional.shadow.mapSize.height = 1024;
    directional.shadow.camera.near = 1;
    directional.shadow.camera.far = 60;
    directional.shadow.camera.left = -30;
    directional.shadow.camera.right = 30;
    directional.shadow.camera.top = 30;
    directional.shadow.camera.bottom = -30;
    this.scene.add(directional);
  }

  _setupArena() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(this.arenaRadius, 64),
      new THREE.MeshStandardMaterial({ color: 0x1d2730, roughness: 0.95, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const border = new THREE.Mesh(
      new THREE.RingGeometry(this.arenaRadius - 0.2, this.arenaRadius + 0.25, 64),
      new THREE.MeshBasicMaterial({ color: 0x5a6575, side: THREE.DoubleSide })
    );
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.02;
    this.scene.add(border);
  }

  _setupGrid() {
    const grid = new THREE.GridHelper(40, 40, 0x2f3744, 0x2b3240);
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

  updateCamera(targetPosition) {
    const { yaw, pitch, radius } = this.cameraOrbit;
    const offsetX = Math.sin(yaw) * Math.cos(pitch) * radius;
    const offsetY = Math.sin(pitch) * radius;
    const offsetZ = Math.cos(yaw) * Math.cos(pitch) * radius;

    const desired = new THREE.Vector3(
      targetPosition.x + offsetX,
      targetPosition.y + offsetY,
      targetPosition.z + offsetZ
    );
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
