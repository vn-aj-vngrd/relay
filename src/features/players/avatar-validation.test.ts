import { describe, expect, it } from "vitest";

import { validateAvatarFile } from "./avatar-validation";

describe("validateAvatarFile", () => {
  it("accepts a real supported image signature", async () => {
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])], "avatar.png", { type: "image/png" });
    await expect(validateAvatarFile(png)).resolves.toMatchObject({ extension: "png", file: png });
  });

  it("rejects unsupported and spoofed files", async () => {
    const text = new File(["hello"], "avatar.txt", { type: "text/plain" });
    const spoofed = new File(["not an image"], "avatar.png", { type: "image/png" });
    await expect(validateAvatarFile(text)).resolves.toEqual({ error: "Use a JPG, PNG, or WebP photo." });
    await expect(validateAvatarFile(spoofed)).resolves.toEqual({
      error: "That file doesn’t appear to be a valid image.",
    });
  });

  it("enforces the storage bucket size limit before upload", async () => {
    const large = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" });
    await expect(validateAvatarFile(large)).resolves.toEqual({ error: "Choose a photo smaller than 5 MB." });
  });
});
