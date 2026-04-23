export const WEAPON_DEFS = [
  {
    id: "iron_sword",
    name: "Iron Sword",
    archetype: "melee",
    description: "Balanced cleave with short cooldown.",
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
    archetype: "projectile",
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
    archetype: "projectile",
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
    archetype: "melee",
    description: "Fast, rapid strikes.",
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
    archetype: "melee",
    description: "Heavy hits with broad impact.",
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
    archetype: "projectile",
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
    archetype: "projectile",
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
    archetype: "boomerang",
    description: "Returning blade that can hit multiple foes.",
    baseStats: {
      damage: 14,
      cooldown: 0.95,
      range: 7,
      projectileCount: 1,
      speed: 12,
      pierce: 3,
      aoeRadius: 0,
    },
  },
  {
    id: "fire_orb",
    name: "Fire Orb",
    archetype: "pulse",
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
