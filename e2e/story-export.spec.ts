import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { ModuleKind, transpileModule } from "typescript";

test("Story photo and theme primitives export local PNGs under Relay CSP", async ({
  page,
}) => {
  // Execute the real browser-only modules with synthetic pixels, without an
  // account, production Story route, uploaded image, or fabricated game result.
  const modules = await Promise.all(
    ["story-photo", "story-theme"].map(async (name) => {
      const source = await readFile(
        new URL(`../src/features/memories/${name}.ts`, import.meta.url),
        "utf8"
      );
      return transpileModule(source, {
        compilerOptions: { module: ModuleKind.CommonJS },
      }).outputText;
    })
  );
  await page.goto("/play");
  const result = await page.evaluate<{
    blobFetchBlocked: boolean;
    images: Array<{
      theme: string;
      withPhoto: boolean;
      width: number;
      height: number;
      type: string;
    }>;
  }>(`(async () => {
    const exports = {};
    ${modules.join("\n")}
    const source = document.createElement("canvas");
    source.width = 12; source.height = 24;
    source.getContext("2d").fillRect(0, 0, 12, 24);
    const photo = await new Promise(resolve => source.toBlob(resolve, "image/png"));
    const file = new File([photo], "synthetic-court.png", { type: "image/png" });
    const previewUrl = URL.createObjectURL(file);
    let blobFetchBlocked = false;
    try { await fetch(previewUrl); } catch { blobFetchBlocked = true; }
    URL.revokeObjectURL(previewUrl);
    const images = [];
    for (const { id: theme } of exports.storyThemes) {
      for (const withPhoto of [false, true]) {
        const canvas = document.createElement("canvas");
        canvas.width = 1080; canvas.height = 1920;
        const context = canvas.getContext("2d");
        context.fillStyle = "#635bde";
        context.fillRect(0, 0, canvas.width, canvas.height);
        if (withPhoto) await exports.drawStoryPhoto(context, file, 1080, 1920, 75);
        exports.drawStoryTheme(context, theme);
        const png = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
        const bitmap = await createImageBitmap(png);
        images.push({ theme, withPhoto, width: bitmap.width, height: bitmap.height, type: png.type });
        bitmap.close();
      }
    }
    return { blobFetchBlocked, images };
  })()`);
  expect(result.blobFetchBlocked).toBe(true);
  expect(result.images).toHaveLength(10);
  for (const image of result.images) {
    expect(image).toMatchObject({
      width: 1080,
      height: 1920,
      type: "image/png",
    });
  }
});
