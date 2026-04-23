export class LevelUpPanel {
  constructor(root, onPick) {
    this.root = root;
    this.onPick = onPick;
  }

  show(choices, level) {
    this.root.classList.remove("hidden");
    this.root.innerHTML = `
      <div class="panel-card">
        <h2>Level Up! (Level ${level})</h2>
        <p>Choose one upgrade:</p>
        <div class="choice-list">
          ${choices
            .map(
              (choice, index) => `
                <button class="choice-btn" data-index="${index}">
                  <strong>${choice.name}</strong>
                  <span>${choice.description}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `;

    const buttons = this.root.querySelectorAll(".choice-btn");
    buttons.forEach((button) => {
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
