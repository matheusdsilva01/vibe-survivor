export const GENERAL_UPGRADES = [
  {
    id: "move_speed",
    name: "Windstep",
    description: "+12% movement speed.",
    apply: ({ player }) => {
      player.stats.moveSpeed *= 1.12;
    },
  },
  {
    id: "max_hp",
    name: "Iron Resolve",
    description: "+25 max health and heal 25.",
    apply: ({ player }) => {
      player.stats.maxHealth += 25;
      player.health = Math.min(player.stats.maxHealth, player.health + 25);
    },
  },
  {
    id: "xp_gain",
    name: "Scholar's Charm",
    description: "+20% XP gain.",
    apply: ({ player }) => {
      player.stats.xpMultiplier *= 1.2;
    },
  },
  {
    id: "regen",
    name: "Second Wind",
    description: "Heal 20 and gain +5 max health.",
    apply: ({ player }) => {
      player.stats.maxHealth += 5;
      player.health = Math.min(player.stats.maxHealth, player.health + 20);
    },
  },
];

const WEAPON_UPGRADES = [
  {
    id: "weapon_damage",
    name: "Tempered Weapon",
    description: "+22% weapon damage.",
    appliesTo: () => true,
    apply: ({ weapon }) => {
      weapon.stats.damage *= 1.22;
    },
  },
  {
    id: "weapon_speed",
    name: "Quickened Strikes",
    description: "-15% weapon cooldown.",
    appliesTo: () => true,
    apply: ({ weapon }) => {
      weapon.stats.cooldown = Math.max(0.12, weapon.stats.cooldown * 0.85);
    },
  },
  {
    id: "weapon_projectiles",
    name: "Extra Volley",
    description: "+1 projectile/extra target.",
    appliesTo: (weapon) => weapon.archetype !== "pulse",
    apply: ({ weapon }) => {
      weapon.stats.projectileCount = Math.min(8, weapon.stats.projectileCount + 1);
    },
  },
  {
    id: "weapon_range",
    name: "Extended Reach",
    description: "+15% range.",
    appliesTo: () => true,
    apply: ({ weapon }) => {
      weapon.stats.range *= 1.15;
      if (weapon.stats.aoeRadius > 0) {
        weapon.stats.aoeRadius *= 1.1;
      }
    },
  },
  {
    id: "weapon_pierce",
    name: "Penetrating Force",
    description: "+1 pierce.",
    appliesTo: (weapon) => weapon.archetype === "projectile" || weapon.archetype === "boomerang",
    apply: ({ weapon }) => {
      weapon.stats.pierce = Math.min(10, (weapon.stats.pierce || 0) + 1);
    },
  },
  {
    id: "weapon_slow",
    name: "Deep Freeze",
    description: "Improve slow power and duration.",
    appliesTo: (weapon) => weapon.id === "frost_wand",
    apply: ({ weapon }) => {
      weapon.stats.slowAmount = Math.min(0.75, (weapon.stats.slowAmount || 0.3) + 0.1);
      weapon.stats.slowDuration = Math.min(5, (weapon.stats.slowDuration || 1.8) + 0.4);
    },
  },
  {
    id: "pulse_radius",
    name: "Inferno Radius",
    description: "+20% pulse radius.",
    appliesTo: (weapon) => weapon.archetype === "pulse",
    apply: ({ weapon }) => {
      weapon.stats.aoeRadius *= 1.2;
      weapon.stats.range = weapon.stats.aoeRadius;
    },
  },
];

export function drawUpgradeChoices(weapon, count = 3) {
  const weaponPool = WEAPON_UPGRADES.filter((upgrade) => upgrade.appliesTo(weapon));
  const pool = [...GENERAL_UPGRADES, ...weaponPool];
  const choices = [];
  const usedIds = new Set();

  while (choices.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const picked = pool.splice(index, 1)[0];
    if (usedIds.has(picked.id)) continue;
    usedIds.add(picked.id);
    choices.push(picked);
  }

  return choices;
}
