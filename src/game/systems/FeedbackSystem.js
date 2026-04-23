import * as THREE from "three";

export class FeedbackSystem {
  constructor({ world, uiRoot }) {
    this.world = world;
    this.uiRoot = uiRoot;
    this.floatingTexts = [];
    this.pulses = [];
    this.playerFlashes = [];
    this.time = 0;
    this.maxFloatingTexts = 40;
    this.maxPulses = 24;

    this.overlay = document.createElement("div");
    this.overlay.className = "feedback-layer";
    this.uiRoot.appendChild(this.overlay);
  }

  reset() {
    this.time = 0;
    for (const text of this.floatingTexts) {
      text.element.remove();
    }
    this.floatingTexts = [];
    for (const pulse of this.pulses) {
      this.world.scene.remove(pulse.mesh);
      pulse.mesh.geometry.dispose();
      pulse.mesh.material.dispose();
    }
    this.pulses = [];
    this.playerFlashes = [];
    this._renderOverlay();
  }

  handleMobHit(event) {
    this._spawnDamageNumber(event);
    this._spawnPulse(event.position, event.killed ? 0.9 : 0.45, event.killed);
    this.world.addCameraImpulse(event.killed ? 0.17 : 0.07, event.killed ? 0.2 : 0.1);
  }

  handlePlayerHit(event) {
    const intensity = Math.min(1, 0.2 + event.amount / 30);
    this.playerFlashes.push({ life: 0.26, duration: 0.26, intensity });
    this.world.addCameraImpulse(0.2 + intensity * 0.18, 0.22);
  }

  update(deltaSeconds) {
    this.time += deltaSeconds;
    this._updateFloatingTexts(deltaSeconds);
    this._updatePulses(deltaSeconds);
    this._updateFlashes(deltaSeconds);
    this._renderOverlay();
  }

  _spawnDamageNumber(event) {
    if (this.floatingTexts.length >= this.maxFloatingTexts) {
      const oldest = this.floatingTexts.shift();
      oldest?.element.remove();
    }

    const element = document.createElement("div");
    element.className = `damage-float ${event.killed ? "kill" : ""}`;
    element.textContent = String(event.amount);
    this.overlay.appendChild(element);

    this.floatingTexts.push({
      element,
      life: event.killed ? 0.7 : 0.55,
      duration: event.killed ? 0.7 : 0.55,
      offsetX: (Math.random() - 0.5) * 16,
      offsetY: event.killed ? -10 : -6,
      worldPosition: new THREE.Vector3(event.position.x, event.position.y + 0.9, event.position.z),
    });
  }

  _spawnPulse(position, radius, killPulse) {
    if (this.pulses.length >= this.maxPulses) {
      const oldest = this.pulses.shift();
      if (oldest) {
        this.world.scene.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
        oldest.mesh.material.dispose();
      }
    }

    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(0.05, radius * 0.25), radius, 20),
      new THREE.MeshBasicMaterial({
        color: killPulse ? 0xf59e0b : 0xf87171,
        transparent: true,
        opacity: killPulse ? 0.6 : 0.4,
        side: THREE.DoubleSide,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(position.x, 0.09, position.z);
    this.world.scene.add(mesh);

    this.pulses.push({
      mesh,
      life: killPulse ? 0.35 : 0.22,
      duration: killPulse ? 0.35 : 0.22,
    });
  }

  _updateFloatingTexts(deltaSeconds) {
    const width = this.world.renderer.domElement.clientWidth;
    const height = this.world.renderer.domElement.clientHeight;

    const remaining = [];
    for (const text of this.floatingTexts) {
      text.life -= deltaSeconds;
      if (text.life <= 0) {
        text.element.remove();
        continue;
      }

      const t = 1 - text.life / text.duration;
      const projected = text.worldPosition.clone().project(this.world.camera);
      const x = (projected.x * 0.5 + 0.5) * width + text.offsetX;
      const y = (-(projected.y * 0.5) + 0.5) * height + text.offsetY - t * 24;

      text.element.style.opacity = String(Math.max(0, 1 - t * 1.15));
      text.element.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(1 - t * 0.1).toFixed(3)})`;
      remaining.push(text);
    }
    this.floatingTexts = remaining;
  }

  _updatePulses(deltaSeconds) {
    const alive = [];
    for (const pulse of this.pulses) {
      pulse.life -= deltaSeconds;
      if (pulse.life <= 0) {
        this.world.scene.remove(pulse.mesh);
        pulse.mesh.geometry.dispose();
        pulse.mesh.material.dispose();
        continue;
      }

      const t = 1 - pulse.life / pulse.duration;
      pulse.mesh.scale.setScalar(1 + t * 0.8);
      pulse.mesh.material.opacity = Math.max(0, 0.65 - t * 0.75);
      alive.push(pulse);
    }
    this.pulses = alive;
  }

  _updateFlashes(deltaSeconds) {
    const alive = [];
    for (const flash of this.playerFlashes) {
      flash.life -= deltaSeconds;
      if (flash.life <= 0) continue;
      alive.push(flash);
    }
    this.playerFlashes = alive;
  }

  _renderOverlay() {
    if (this.playerFlashes.length === 0) {
      this.overlay.style.boxShadow = "none";
      return;
    }

    let peak = 0;
    for (const flash of this.playerFlashes) {
      const t = 1 - flash.life / flash.duration;
      peak = Math.max(peak, (1 - t) * flash.intensity);
    }
    this.overlay.style.boxShadow = `inset 0 0 0 999px rgba(248, 113, 113, ${(peak * 0.22).toFixed(3)})`;
  }
}
