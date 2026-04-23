export function createMobHitFeedbackEvent({ amount, position, killed = false, source = "unknown" }) {
  return {
    type: "mob_hit",
    amount: Math.max(0, Math.round(Number(amount) || 0)),
    position: {
      x: Number(position?.x) || 0,
      y: Number(position?.y) || 0,
      z: Number(position?.z) || 0,
    },
    killed: Boolean(killed),
    source,
  };
}

export function createPlayerHitFeedbackEvent({ amount, source = "contact" }) {
  return {
    type: "player_hit",
    amount: Math.max(0, Math.round(Number(amount) || 0)),
    source,
  };
}
