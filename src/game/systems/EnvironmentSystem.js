import * as THREE from "three";

export class EnvironmentSystem {
  constructor(scene, terrain, { arenaRadius }) {
    this.scene = scene;
    this.terrain = terrain;
    this.arenaRadius = arenaRadius;
    this.meshes = [];
    this.particles = null;
    this.time = 0;
  }

  build() {
    this.dispose();

    this._buildTrees();
    this._buildCrystals();
    this._buildBushes();
    this._buildParticles();
  }

  update(deltaSeconds) {
    this.time += deltaSeconds;
    
    // Animate particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position;
      for (let i = 0; i < this.particleData.length; i++) {
        const data = this.particleData[i];
        
        // Float upwards and sway
        data.y += data.speed * deltaSeconds;
        data.x += Math.sin(this.time * data.swaySpeed + data.seed) * 0.05 * deltaSeconds;
        data.z += Math.cos(this.time * data.swaySpeed + data.seed) * 0.05 * deltaSeconds;

        // Reset if too high
        if (data.y > 15) {
          data.y = this._getTerrainHeight(data.x, data.z) + Math.random() * 2;
        }

        positions.setXYZ(i, data.x, data.y, data.z);
      }
      positions.needsUpdate = true;
    }
  }

  _getTerrainHeight(x, z) {
    // Replicate the terrain height logic to place items correctly on the floor
    const radial = Math.hypot(x, z);
    const falloff = Math.max(0, 1 - radial / this.arenaRadius);
    const freq = this.terrain.frequency || 0.08;
    const amp = this.terrain.amplitude || 1.8;
    return Math.sin(x * freq) * Math.cos(z * freq) * amp * falloff;
  }

  _buildTrees() {
    const treeCount = Math.floor(this.arenaRadius * 4);
    
    // Low poly trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2.5, 5);
    trunkGeo.translate(0, 1.25, 0); // Pivot at bottom
    const trunkMat = new THREE.MeshStandardMaterial({ 
      color: 0x2a2024, 
      roughness: 0.9, 
      flatShading: true 
    });
    
    // Low poly leaves (pine style)
    const leavesGeo = new THREE.ConeGeometry(1.8, 4.5, 6);
    leavesGeo.translate(0, 3.5, 0); // Pivot relative to tree base
    const leavesMat = new THREE.MeshStandardMaterial({ 
      color: 0x1d3a33, 
      roughness: 0.8, 
      flatShading: true 
    });

    const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const leavesInstanced = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    
    trunkInstanced.castShadow = true;
    trunkInstanced.receiveShadow = true;
    leavesInstanced.castShadow = true;
    leavesInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();

    let placed = 0;
    while (placed < treeCount) {
      const angle = Math.random() * Math.PI * 2;
      // Bias trees away from the direct center to leave an arena space
      const r = 10 + Math.random() * (this.arenaRadius - 10);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      const height = this._getTerrainHeight(x, z);
      const scale = 0.7 + Math.random() * 0.6;
      
      dummy.position.set(x, height, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      // Slight tilt
      dummy.rotation.x = (Math.random() - 0.5) * 0.2;
      dummy.rotation.z = (Math.random() - 0.5) * 0.2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      trunkInstanced.setMatrixAt(placed, dummy.matrix);
      leavesInstanced.setMatrixAt(placed, dummy.matrix);
      
      placed++;
    }

    this.scene.add(trunkInstanced);
    this.scene.add(leavesInstanced);
    this.meshes.push(trunkInstanced, leavesInstanced);
  }

  _buildCrystals() {
    const crystalCount = Math.floor(this.arenaRadius * 1.2);
    // Low poly crystals
    const crystalGeo = new THREE.OctahedronGeometry(1, 0);
    crystalGeo.translate(0, 0.5, 0);
    const crystalMat = new THREE.MeshStandardMaterial({ 
      color: 0x6b44a9, // Magical purple
      emissive: 0x2a0054,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
      flatShading: true 
    });
    
    const crystalInstanced = new THREE.InstancedMesh(crystalGeo, crystalMat, crystalCount);
    crystalInstanced.castShadow = true;
    crystalInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < crystalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * this.arenaRadius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      const height = this._getTerrainHeight(x, z);
      
      const scaleX = 0.3 + Math.random() * 0.5;
      const scaleY = 0.8 + Math.random() * 1.5;
      const scaleZ = 0.3 + Math.random() * 0.5;
      
      dummy.position.set(x, height - 0.2, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.4, 
        Math.random() * Math.PI * 2, 
        (Math.random() - 0.5) * 0.4
      );
      dummy.scale.set(scaleX, scaleY, scaleZ);
      dummy.updateMatrix();

      crystalInstanced.setMatrixAt(i, dummy.matrix);
    }

    this.scene.add(crystalInstanced);
    this.meshes.push(crystalInstanced);
    
    // Add point lights for a few crystals to make them glow in the scene
    for (let i = 0; i < Math.min(10, crystalCount); i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 10 + Math.random() * (this.arenaRadius - 20);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const height = this._getTerrainHeight(x, z);
      
      const light = new THREE.PointLight(0x9d6bfa, 2, 10);
      light.position.set(x, height + 1.5, z);
      this.scene.add(light);
      this.meshes.push(light); // Push to meshes to be disposed
    }
  }

  _buildBushes() {
    const bushCount = Math.floor(this.arenaRadius * 5);
    const bushGeo = new THREE.DodecahedronGeometry(0.8, 0);
    bushGeo.translate(0, 0.4, 0);
    const bushMat = new THREE.MeshStandardMaterial({ 
      color: 0x22362a, 
      roughness: 1.0, 
      flatShading: true 
    });
    
    const bushInstanced = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
    bushInstanced.castShadow = true;
    bushInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < bushCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * this.arenaRadius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      const height = this._getTerrainHeight(x, z);
      const scale = 0.4 + Math.random() * 0.8;
      
      dummy.position.set(x, height, z);
      dummy.rotation.set(
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      );
      dummy.scale.set(scale, scale * 0.7, scale);
      dummy.updateMatrix();

      bushInstanced.setMatrixAt(i, dummy.matrix);
    }

    this.scene.add(bushInstanced);
    this.meshes.push(bushInstanced);
  }

  _buildParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    this.particleData = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * this.arenaRadius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = this._getTerrainHeight(x, z) + Math.random() * 10;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      this.particleData.push({
        x, y, z,
        speed: 0.2 + Math.random() * 0.5,
        swaySpeed: 1 + Math.random() * 2,
        seed: Math.random() * 100
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create a magical firefly texture programmatically
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(180, 255, 200, 1)');
    gradient.addColorStop(0.3, 'rgba(100, 255, 150, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 16);
    
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.6,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x90ffb0
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
    this.meshes.push(this.particles);
  }

  dispose() {
    for (const mesh of this.meshes) {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if (mesh.material.map) mesh.material.map.dispose();
          mesh.material.dispose();
        }
      }
    }
    this.meshes = [];
    this.particles = null;
    this.particleData = [];
  }
}
