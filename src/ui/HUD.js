export class HUD {
  constructor(root) {
    this.root = root;
  }

  render({
    health,
    maxHealth,
    level,
    xp,
    nextLevelXp,
    mobCount,
    elapsed,
    weaponName,
    arenaRadius,
    spawnBand,
  }) {
    const hpPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    const xpPercent = Math.max(0, Math.min(100, (xp / nextLevelXp) * 100));
    this.root.innerHTML = `
      <div class="hud-card">
        <div class="hud-line"><span>HP</span><span>${Math.ceil(health)} / ${Math.ceil(maxHealth)}</span></div>
        <div class="bar"><span style="width:${hpPercent}%"></span></div>
        <div class="hud-line"><span>Level ${level}</span><span>${Math.ceil(xp)} / ${Math.ceil(nextLevelXp)} XP</span></div>
        <div class="bar xp"><span style="width:${xpPercent}%"></span></div>
        <div class="hud-line compact"><span>Mobs</span><span>${mobCount}</span></div>
        <div class="hud-line compact"><span>Time</span><span>${elapsed.toFixed(1)}s</span></div>
        <div class="hud-line compact"><span>Weapon</span><span>${weaponName || "-"}</span></div>
        <div class="hud-line compact"><span>Arena</span><strong>${arenaRadius ? `R ${arenaRadius}` : "-"}</strong></div>
        <div class="hud-line compact"><span>Spawn Band</span><strong>${spawnBand || "-"}</strong></div>
      </div>
    `;
  }
}
