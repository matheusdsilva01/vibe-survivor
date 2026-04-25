export const WEAPON_MODES = {
  PROJECTILE: "projectile",
  RICOCHET: "ricochet",
  CIRCULAR_AREA: "circular_area",
  FRONTAL_CONE: "frontal_cone",
};

export const WEAPON_DEFS = [
  {
    id: "iron_sword",
    name: "Iron Sword",
    mode: WEAPON_MODES.FRONTAL_CONE,
    description: "Balanced 45° frontal cleave.",
    baseStats: {
      damage: 20,
      cooldown: 0.65,
      range: 2.6,
      projectileCount: 1,
      speed: 0,
      pierce: 0,
      aoeRadius: 0,
    },
  },
  {
    id: "hunter_bow",
    name: "Hunter Bow",
    mode: WEAPON_MODES.PROJECTILE,
    description: "Accurate long-range arrows.",
    baseStats: {
      damage: 16,
      cooldown: 0.58,
      range: 11,
      projectileCount: 1,
      speed: 17,
      pierce: 0,
      aoeRadius: 0,
    },
  },
  {
    id: "arcane_staff",
    name: "Arcane Staff",
    mode: WEAPON_MODES.PROJECTILE,
    description: "Piercing arcane bolts.",
    baseStats: {
      damage: 14,
      cooldown: 0.62,
      range: 12,
      projectileCount: 1,
      speed: 15,
      pierce: 2,
      aoeRadius: 0,
    },
  },
  {
    id: "dual_daggers",
    name: "Dual Daggers",
    mode: WEAPON_MODES.FRONTAL_CONE,
    description: "Fast 45° frontal slashes.",
    baseStats: {
      damage: 10,
      cooldown: 0.26,
      range: 2.1,
      projectileCount: 1,
      speed: 0,
      pierce: 0,
      aoeRadius: 0,
    },
  },
  {
    id: "war_hammer",
    name: "War Hammer",
    mode: WEAPON_MODES.FRONTAL_CONE,
    description: "Heavy 45° frontal smash with splash.",
    baseStats: {
      damage: 36,
      cooldown: 1.2,
      range: 2.8,
      projectileCount: 1,
      speed: 0,
      pierce: 0,
      aoeRadius: 0.8,
    },
  },
  {
    id: "crossbow",
    name: "Crossbow",
    mode: WEAPON_MODES.PROJECTILE,
    description: "Burst volley bolts.",
    baseStats: {
      damage: 11,
      cooldown: 0.85,
      range: 10,
      projectileCount: 3,
      speed: 16,
      pierce: 0,
      aoeRadius: 0,
    },
  },
  {
    id: "frost_wand",
    name: "Frost Wand",
    mode: WEAPON_MODES.PROJECTILE,
    description: "Projectiles that slow enemies.",
    baseStats: {
      damage: 12,
      cooldown: 0.55,
      range: 10,
      projectileCount: 1,
      speed: 14,
      pierce: 0,
      aoeRadius: 0,
      slowAmount: 0.3,
      slowDuration: 1.8,
    },
  },
  {
    id: "chakram",
    name: "Chakram",
    mode: WEAPON_MODES.RICOCHET,
    description: "Bouncing blade that ricochets between foes.",
    baseStats: {
      damage: 14,
      cooldown: 0.95,
      range: 7,
      projectileCount: 1,
      speed: 12,
      pierce: 0,
      ricochetCount: 3,
      ricochetRange: 8,
      aoeRadius: 0,
    },
  },
  {
    id: "fire_orb",
    name: "Fire Orb",
    mode: WEAPON_MODES.CIRCULAR_AREA,
    description: "Periodic area bursts around the hero.",
    baseStats: {
      damage: 18,
      cooldown: 1.15,
      range: 3.2,
      projectileCount: 1,
      speed: 0,
      pierce: 0,
      aoeRadius: 3.2,
    },
  },
];

export function drawWeaponChoices(count = 3) {
  const pool = [...WEAPON_DEFS];
  const picks = [];
  while (picks.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }
  return picks;
}

export function createWeaponRuntime(weaponDef) {
  return {
    ...weaponDef,
    stats: {
      ...weaponDef.baseStats,
    },
    cooldownTimer: 0,
  };
}
