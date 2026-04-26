export const ATLAS_KEYS = {
  PLAYER_DEFAULT: "player.default",
  ENEMY_DEFAULT: "enemy.default",
};

export const TEXTURE_ATLAS = {
  [ATLAS_KEYS.PLAYER_DEFAULT]: "assets/player-default.png",
  [ATLAS_KEYS.ENEMY_DEFAULT]: "assets/enemy-default.png",
};

export function getAtlasPath(key) {
  const path = TEXTURE_ATLAS[key];
  if (!path) {
    throw new Error(`Missing texture atlas key: ${key}`);
  }
  return path;
}
