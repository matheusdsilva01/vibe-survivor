import test from "node:test";
import assert from "node:assert/strict";
import {
  createMobHitFeedbackEvent,
  createPlayerHitFeedbackEvent,
} from "../src/game/systems/feedbackEvents.js";

test("createMobHitFeedbackEvent includes world position and kill state", () => {
  const event = createMobHitFeedbackEvent({
    amount: 12.8,
    killed: true,
    source: "projectile",
    position: { x: 2, y: 1.4, z: -3 },
  });

  assert.equal(event.type, "mob_hit");
  assert.equal(event.amount, 13);
  assert.equal(event.killed, true);
  assert.equal(event.source, "projectile");
  assert.deepEqual(event.position, { x: 2, y: 1.4, z: -3 });
});

test("createPlayerHitFeedbackEvent clamps amount and keeps source", () => {
  const event = createPlayerHitFeedbackEvent({
    amount: -9,
    source: "contact",
  });

  assert.equal(event.type, "player_hit");
  assert.equal(event.amount, 0);
  assert.equal(event.source, "contact");
});
