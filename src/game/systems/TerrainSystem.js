import * as THREE from "three";

export class TerrainSystem {
  constructor(scene, { arenaRadius, amplitude = 1.8, frequency = 0.08 } = {}) {
    this.scene = scene;
    this.arenaRadius = arenaRadius;
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.floorMesh = null;
    this.borderMesh = null;
  }

  build() {
    this.dispose();

    const geometry = new THREE.CircleGeometry(this.arenaRadius, 160);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const radial = Math.hypot(x, z);
      const falloff = Math.max(0, 1 - radial / this.arenaRadius);
      const height =
        Math.sin(x * this.frequency) * Math.cos(z * this.frequency) * this.amplitude * falloff;
      positions.setZ(i, height);
    }
    geometry.computeVertexNormals();

    this.floorMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0x1d2730, roughness: 0.95, metalness: 0.05 })
    );
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    this.borderMesh = new THREE.Mesh(
      new THREE.RingGeometry(this.arenaRadius - 0.25, this.arenaRadius + 0.3, 128),
      new THREE.MeshBasicMaterial({ color: 0x5a6575, side: THREE.DoubleSide })
    );
    this.borderMesh.rotation.x = -Math.PI / 2;
    this.borderMesh.position.y = 0.08;
    this.scene.add(this.borderMesh);
  }

  dispose() {
    if (this.floorMesh) {
      this.scene.remove(this.floorMesh);
      this.floorMesh.geometry.dispose();
      this.floorMesh.material.dispose();
      this.floorMesh = null;
    }
    if (this.borderMesh) {
      this.scene.remove(this.borderMesh);
      this.borderMesh.geometry.dispose();
      this.borderMesh.material.dispose();
      this.borderMesh = null;
    }
  }
}
