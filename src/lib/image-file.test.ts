import { describe, expect, it } from "vitest";

import { hasValidImageSignature, imageExtension, isSupportedImageType } from "./image-file";

describe("image file validation", () => {
  it.each([
    ["image/jpeg", [0xff, 0xd8, 0xff, 0x00]],
    ["image/png", [0x89, 0x50, 0x4e, 0x47]],
    ["image/webp", [...new TextEncoder().encode("RIFF0000WEBP")]],
  ])("accepts a matching %s signature", async (type, bytes) => {
    const file = new File([new Uint8Array(bytes)], "image", { type });
    await expect(hasValidImageSignature(file)).resolves.toBe(true);
  });

  it("rejects a spoofed image and unsupported content type", async () => {
    await expect(hasValidImageSignature(new File(["not an image"], "fake.png", { type: "image/png" }))).resolves.toBe(
      false,
    );
    await expect(hasValidImageSignature(new File(["<svg />"], "fake.svg", { type: "image/svg+xml" }))).resolves.toBe(
      false,
    );
  });

  it("provides the storage extension only for supported types", () => {
    expect(isSupportedImageType("image/jpeg")).toBe(true);
    expect(isSupportedImageType("text/html")).toBe(false);
    expect(imageExtension("image/jpeg")).toBe("jpg");
  });
});
