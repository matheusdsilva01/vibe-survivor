export class WeaponSelectPanel {
  constructor(root, onPick) {
    this.root = root;
    this.onPick = onPick;
  }

  show(choices) {
    this.root.classList.remove("hidden");
    this.root.innerHTML = `
      <div class="panel-card">
        <h2>Choose Your Weapon</h2>
        <p>Select 1 weapon to start the run:</p>
        <div class="choice-list">
          ${choices
            .map(
              (weapon, index) => `
                <button class="choice-btn" data-index="${index}">
                  <strong>${weapon.name}</strong>
                  <span>${weapon.description}</span>
                  <span class="muted">Type: ${weapon.archetype}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `;

    this.root.querySelectorAll(".choice-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-index"));
        const picked = choices[index];
        if (picked) this.onPick(picked);
      });
    });
  }

  hide() {
    this.root.classList.add("hidden");
    this.root.innerHTML = "";
  }
}
