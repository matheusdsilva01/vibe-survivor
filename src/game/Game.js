import * as THREE from "three";
import { WorldScene } from "./scene/WorldScene.js";
import { Player } from "./entities/Player.js";
import { SpawnerSystem } from "./systems/SpawnerSystem.js";
import { CombatSystem } from "./systems/CombatSystem.js";
import { WeaponSystem } from "./systems/WeaponSystem.js";
import { ProgressionSystem } from "./systems/ProgressionSystem.js";
import { FeedbackSystem } from "./systems/FeedbackSystem.js";
import { drawWeaponChoices, createWeaponRuntime } from "./data/weapons.js";
import { HUD } from "../ui/HUD.js";
import { LevelUpPanel } from "../ui/LevelUpPanel.js";
import { WeaponSelectPanel } from "../ui/WeaponSelectPanel.js";

const GAME_STATE = {
  CHAR_SELECT: "char_select",
  WEAPON_SELECT: "weapon_select",
  RUNNING: "running",
  LEVEL_UP: "level_up",
  GAME_OVER: "game_over",
};

const MAP_CONFIG = {
  arenaRadius: 100,
  spawnBands: [
    { id: "inner", min: 8, max: 28 },
    { id: "mid", min: 28, max: 58 },
    { id: "outer", min: 58, max: 96 },
  ],
};

export class Game {
  constructor({ gameRoot, hudRoot, weaponSelectRoot, levelUpRoot, gameOverRoot }) {
    const uiRoot = hudRoot.parentElement || gameRoot;
    this.world = new WorldScene(gameRoot, { map: MAP_CONFIG });
    this.hud = new HUD(hudRoot);
    this.gameOverRoot = gameOverRoot;
    this.feedback = new FeedbackSystem({
      world: this.world,
      uiRoot,
    });
    this.progression = new ProgressionSystem();
    this.combat = new CombatSystem({
      onPlayerHit: (event) => this.feedback.handlePlayerHit(event),
    });
    this.weaponSystem = new WeaponSystem(this.world.scene, {
      onMobHit: (event) => this.feedback.handleMobHit(event),
    });
    this.state = GAME_STATE.RUNNING;
    this.elapsed = 0;

    this.player = new Player(this.world.scene);
    this.spawner = new SpawnerSystem(this.world.scene, this.world.arenaRadius, {
      map: MAP_CONFIG,
    });
    this.weaponSelectPanel = new WeaponSelectPanel(weaponSelectRoot, (weaponDef) => {
      this.player.setWeapon(createWeaponRuntime(weaponDef));
      this._restart();
    });
    this.levelUpPanel = new LevelUpPanel(levelUpRoot, (upgrade) => {
      upgrade.apply({ player: this.player, weapon: this.player.weapon });
      this.state = GAME_STATE.RUNNING;
      this._syncCursorVisibility();
      this.levelUpPanel.hide();
    });

    this.clock = new THREE.Clock();
    this._bindEvents();
  }

  start() {
    this._showCharacterSelect();
    this._loop();
  }

  _restart() {
    this.state = GAME_STATE.RUNNING;
    this._syncCursorVisibility();
    this.elapsed = 0;
    this.player.resetBaseStats();
    this.player.mesh.position.set(0, this.player.mesh.position.y, 0);
    this.player.health = this.player.stats.maxHealth;
    this.player.contactDamageTimer = 0;
    this.player.alive = true;
    if (this.player.weapon) {
      this.player.weapon.cooldownTimer = 0;
    }
    this.progression.reset();
    this.spawner.reset();
    this.weaponSystem.reset();
    this.feedback.reset();
    this.weaponSelectPanel.hide();
    this.levelUpPanel.hide();
    this._hideGameOver();
  }

  _showCharacterSelect() {
    this.state = GAME_STATE.CHAR_SELECT;
    this.world.exitPointerLock();
    this._syncCursorVisibility();
    this.gameOverRoot.classList.remove("hidden");
    this.gameOverRoot.innerHTML = `
      <div class="panel-card game-over">
        <h2>Choose Your Character</h2>
        <p>Solo mode currently has one starter hero.</p>
        <button id="start-run-btn">Continue as Vanguard</button>
      </div>
    `;
    const button = this.gameOverRoot.querySelector("#start-run-btn");
    if (button) {
      button.addEventListener("click", () => this._showWeaponSelect());
    }
  }

  _showWeaponSelect() {
    this.state = GAME_STATE.WEAPON_SELECT;
    this.world.exitPointerLock();
    this._syncCursorVisibility();
    this._hideGameOver();
    this.levelUpPanel.hide();
    const choices = drawWeaponChoices(3);
    this.weaponSelectPanel.show(choices);
  }

  _loop = () => {
    requestAnimationFrame(this._loop);
    const delta = Math.min(0.05, this.clock.getDelta());

    if (this.state === GAME_STATE.RUNNING) {
      this._tickRunning(delta);
    }

    this.feedback.update(delta);
    this._renderUi();
    this.world.updateCamera(this.player.position, delta);
    this.world.render();
  };

  _tickRunning(deltaSeconds) {
    this.elapsed += deltaSeconds;
    const cameraBasis = this.world.getCameraBasis();
    this.player.update(deltaSeconds, cameraBasis);
    this.world.clampInsideArena(this.player.mesh, this.player.radius);

    this.spawner.update(deltaSeconds);
    for (const mob of this.spawner.mobs) {
      mob.update(deltaSeconds, this.player.position);
      this.world.clampInsideArena(mob.mesh, 0.6);
    }

    this.weaponSystem.update(this.player, this.spawner.mobs, deltaSeconds);
    this.combat.update(this.player, this.spawner.mobs, deltaSeconds);
    const deadMobs = this.spawner.removeDeadMobs();
    const rewardXp = deadMobs.reduce((sum, mob) => sum + mob.xpReward, 0);
    this.progression.addXp(rewardXp, this.player.stats.xpMultiplier);

    if (!this.player.alive) {
      this.state = GAME_STATE.GAME_OVER;
      this.world.exitPointerLock();
      this._syncCursorVisibility();
      this._showGameOver();
      return;
    }

    if (this.progression.pendingLevelUps > 0) {
      const choices = this.progression.consumeLevelUpChoices(this.player.weapon);
      if (choices) {
        this.state = GAME_STATE.LEVEL_UP;
        this.world.exitPointerLock();
        this._syncCursorVisibility();
        this.levelUpPanel.show(choices, this.progression.level);
      }
    }
  }

  _renderUi() {
    this.hud.render({
      health: this.player.health,
      maxHealth: this.player.stats.maxHealth,
      level: this.progression.level,
      xp: this.progression.xp,
      nextLevelXp: this.progression.nextLevelXp,
      mobCount: this.spawner.mobs.length,
      elapsed: this.elapsed,
      weaponName: this.player.weapon?.name,
      arenaRadius: this.world.arenaRadius,
      spawnBand: this.spawner.lastSpawnBandId,
    });
  }

  _showGameOver() {
    this.gameOverRoot.classList.remove("hidden");
    this.gameOverRoot.innerHTML = `
      <div class="panel-card game-over">
        <h2>Game Over</h2>
        <p>You reached level ${this.progression.level} in ${this.elapsed.toFixed(1)}s.</p>
        <button id="restart-btn">Choose New Weapon</button>
      </div>
    `;

    const button = this.gameOverRoot.querySelector("#restart-btn");
    if (button) {
      button.addEventListener("click", () => this._showWeaponSelect());
    }
  }

  _hideGameOver() {
    this.gameOverRoot.classList.add("hidden");
    this.gameOverRoot.innerHTML = "";
  }

  _syncCursorVisibility() {
    document.body.style.cursor =
      this.state === GAME_STATE.RUNNING && this.world.isPointerLocked() ? "none" : "default";
  }

  _bindEvents() {
    const keyMap = {
      KeyW: "forward",
      ArrowUp: "forward",
      KeyS: "backward",
      ArrowDown: "backward",
      KeyA: "left",
      ArrowLeft: "left",
      KeyD: "right",
      ArrowRight: "right",
    };

    window.addEventListener("keydown", (event) => {
      const key = keyMap[event.code];
      if (!key) return;
      this.player.input[key] = true;
    });

    window.addEventListener("keyup", (event) => {
      const key = keyMap[event.code];
      if (!key) return;
      this.player.input[key] = false;
    });

    window.addEventListener("mousemove", (event) => {
      if (this.state !== GAME_STATE.RUNNING || !this.world.isPointerLocked()) return;
      this.world.applyMouseOrbit(event.movementX, event.movementY);
    });

    window.addEventListener("mousedown", () => {
      if (this.state !== GAME_STATE.RUNNING) return;
      if (!this.world.isPointerLocked()) {
        this.world.requestPointerLock();
      }
    });

    window.addEventListener("pointerlockchange", () => {
      this._syncCursorVisibility();
    });

    window.addEventListener("resize", () => this.world.onResize());
  }
}
