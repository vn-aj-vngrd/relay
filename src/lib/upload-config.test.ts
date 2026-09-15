import { describe, expect, it } from "vitest";

import { imageMaxMiBSchema, resolveImageUploadLimits } from "./upload-config";

describe("admin image upload limits", () => {
  it.each([1, 2, 3, 4])("accepts %i MiB and converts it to bytes", (value) => {
    expect(imageMaxMiBSchema.parse(String(value))).toBe(value);
    expect(resolveImageUploadLimits({ chatImageMaxMiB: value })).toEqual({
      chatImageMaxBytes: value * 1024 * 1024,
      memoryImageMaxBytes: 4 * 1024 * 1024,
    });
  });

  it.each([
    null,
    undefined,
    "",
    "abc",
    0,
    -1,
    1.5,
    5,
    Number.POSITIVE_INFINITY,
  ])(
    "rejects invalid input %s and preserves independent defaults when reading",
    (value) => {
      expect(imageMaxMiBSchema.safeParse(value).success).toBe(false);
      expect(
        resolveImageUploadLimits({
          chatImageMaxMiB: value,
          memoryImageMaxMiB: value,
        })
      ).toEqual({
        chatImageMaxBytes: 4 * 1024 * 1024,
        memoryImageMaxBytes: 4 * 1024 * 1024,
      });
    }
  );
});
