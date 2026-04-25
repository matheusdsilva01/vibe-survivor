import * as THREE from "three";
import { getAtlasPath } from "../data/textureAtlas.js";

export class AssetTextureRegistry {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = new Map();
    this.materials = new Map();
  }

  async init(keys) {
    await Promise.all(keys.map((key) => this._loadTexture(key)));
  }

  _loadTexture(key) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        getAtlasPath(key),
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          this.textures.set(key, texture);
          resolve(texture);
        },
        undefined,
        () => reject(new Error(`Failed to load texture for key: ${key}`))
      );
    });
  }

  getMaterial(key, materialOpts = {}) {
    const cacheKey = `${key}:${JSON.stringify(materialOpts)}`;
    if (this.materials.has(cacheKey)) {
      return this.materials.get(cacheKey);
    }
    const texture = this.textures.get(key);
    if (!texture) {
      throw new Error(`Texture not loaded for key: ${key}`);
    }
    const material = new THREE.MeshStandardMaterial({ map: texture, ...materialOpts });
    this.materials.set(cacheKey, material);
    return material;
  }
}
