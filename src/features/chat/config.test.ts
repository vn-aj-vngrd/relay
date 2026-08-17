import { describe, expect, it } from "vitest";
import { formatChatImageLimit, validateChatImageFile, validateChatImageMetadata } from "./config";

describe("chat image limits", () => {
  it("formats practical byte limits", () => {
    expect(formatChatImageLimit(1024 * 1024)).toBe("1 MB");
    expect(formatChatImageLimit(512 * 1024)).toBe("512 KB");
  });

  it("rejects unsupported and oversized uploads", () => {
    expect(validateChatImageMetadata({ type: "image/gif", size: 10 }, 1024)).toBe("Use a JPG, PNG, or WebP photo.");
    expect(validateChatImageMetadata({ type: "image/jpeg", size: 1025 }, 1024)).toBe("Choose a photo no larger than 1 KB.");
  });

  it("checks that the declared image type matches a real signature", async () => {
    const fake = new File(["not an image"], "fake.jpg", { type: "image/jpeg" });
    await expect(validateChatImageFile(fake, 1024)).resolves.toEqual({ error: "That file doesn’t appear to be a valid image." });
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], "real.jpg", { type: "image/jpeg" });
    const result = await validateChatImageFile(jpeg, 1024);
    expect(result).toMatchObject({ extension: "jpg" });
  });
});
