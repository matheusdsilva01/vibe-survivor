import "./styles/ui.css";
import { Game } from "./game/Game.js";

const gameRoot = document.querySelector("#game-root");
const hudRoot = document.querySelector("#hud");
const weaponSelectRoot = document.querySelector("#weapon-select-panel");
const levelUpRoot = document.querySelector("#level-up-panel");
const gameOverRoot = document.querySelector("#game-over-panel");

if (!gameRoot || !hudRoot || !weaponSelectRoot || !levelUpRoot || !gameOverRoot) {
  throw new Error("Missing required UI containers.");
}

const game = new Game({
  gameRoot,
  hudRoot,
  weaponSelectRoot,
  levelUpRoot,
  gameOverRoot,
});

game.start();
