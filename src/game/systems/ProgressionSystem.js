import { drawUpgradeChoices } from "../data/upgrades.js";

export class ProgressionSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.level = 1;
    this.xp = 0;
    this.pendingLevelUps = 0;
    this.nextLevelXp = this._xpRequiredFor(this.level);
  }

  addXp(baseAmount, multiplier) {
    const gained = Math.round(baseAmount * multiplier);
    this.xp += gained;

    while (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.level += 1;
      this.pendingLevelUps += 1;
      this.nextLevelXp = this._xpRequiredFor(this.level);
    }
  }

  consumeLevelUpChoices(weapon) {
    if (this.pendingLevelUps <= 0) return null;
    this.pendingLevelUps -= 1;
    return drawUpgradeChoices(weapon, 3);
  }

  _xpRequiredFor(level) {
    return Math.floor(20 + level * level * 7.5);
  }
}
