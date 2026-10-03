import assert from "node:assert/strict";
import {test} from "node:test";
import {HeuristicDirector} from "../director/heuristic-director";
import {DirectorPlanSchema} from "../director/schema";
import {parseStructuredStory} from "../director/structured-script";

test("heuristic director creates a valid, mixed scene plan", async () => {
  const director = new HeuristicDirector();
  const plan = await director.createPlan({
    sourceName: "demo.md",
    format: "9:16",
    fps: 30,
    script: "Revenue grew from 20 million to 80 million.\n\nThen the team changed the process step by step.\n\nThe product transformed overnight.",
  });
  assert.doesNotThrow(() => DirectorPlanSchema.parse(plan));
  assert.equal(plan.scenes[0].type, "chart");
  assert.equal(plan.scenes[1].type, "diagram");
  assert.equal(plan.scenes[2].type, "custom-motion");
});

test("heuristic director keeps narration in order", async () => {
  const director = new HeuristicDirector();
  const script = "First beat.\n\nSecond beat.";
  const plan = await director.createPlan({sourceName: "order.md", format: "16:9", fps: 24, script});
  assert.equal(plan.scenes.map((scene) => scene.narration).join(" "), "First beat. Second beat.");
});

test("production profile applies the selected story format and visual foundation", async () => {
  const director = new HeuristicDirector();
  const plan = await director.createPlan({
    sourceName: "story.md",
    format: "9:16",
    fps: 30,
    language: "vi",
    projectType: "animated-story",
    stylePack: "paper-collage",
    script: "Ngày đầu tiên, thành phố vẫn còn im lặng.\n\nSau đó một tín hiệu nhỏ đã thay đổi tất cả.",
  });
  assert.equal(plan.production?.projectType, "animated-story");
  assert.equal(plan.production?.stylePack, "paper-collage");
  assert.equal(plan.production?.language, "vi");
  assert.equal(plan.theme.background, "#EDE4D3");
  assert.ok(plan.scenes.every((scene) => scene.type === "story-illustration"));
  assert.ok(plan.scenes.every((scene) => scene.storyboard));
  assert.ok(plan.scenes.every((scene) => scene.voiceDirection));
});

test("structured story keeps narration separate from visual direction", () => {
  const story = parseStructuredStory(`### Chiếc đèn\n\n**Scene 1**\n\n**Lời kể:**\nTèo nhìn qua sông.\n\n**Hình ảnh:**\nMột ngọn đèn trôi trên nước.\n\n**Scene 2**\n\n**Lời kể:**\nBà kéo rèm lại.\n\n**Hình ảnh:**\nCăn phòng tối dần.`);
  assert.equal(story?.title, "Chiếc đèn");
  assert.equal(story?.scenes.length, 2);
  assert.equal(story?.scenes[0].narration, "Tèo nhìn qua sông.");
  assert.equal(story?.scenes[0].visualIntent, "Một ngọn đèn trôi trên nước.");
  assert.ok(!story?.scenes[0].narration.includes("Hình ảnh"));
});
