import { afterEach, describe, expect, it } from "vitest";

import { groupImageUrl } from "./image";

const originalOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalOrigin;
});

describe("groupImageUrl", () => {
  it("resolves group images from the public owner-scoped media path", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://relay.supabase.co";
    expect(groupImageUrl("owner-id/group-group-id-crew photo.webp")).toBe(
      "https://relay.supabase.co/storage/v1/object/public/avatars/owner-id/group-group-id-crew%20photo.webp",
    );
  });

  it("keeps an existing group image URL", () => {
    expect(groupImageUrl("https://images.example.com/crew.webp")).toBe("https://images.example.com/crew.webp");
  });

  it("returns no URL when a group has no image", () => {
    expect(groupImageUrl(null)).toBeUndefined();
  });
});
