import { afterEach, describe, expect, it } from "vitest";

import { profileAvatarUrl } from "./avatar";

const originalOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalOrigin;
});

describe("profileAvatarUrl", () => {
  it("keeps provider avatars and resolves uploaded avatar paths", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://relay.supabase.co";
    expect(
      profileAvatarUrl("https://lh3.googleusercontent.com/avatar.jpg")
    ).toBe("https://lh3.googleusercontent.com/avatar.jpg");
    expect(profileAvatarUrl("user-id/profile photo.jpg")).toBe(
      "https://relay.supabase.co/storage/v1/object/public/avatars/user-id/profile%20photo.jpg"
    );
  });

  it("returns no image when the profile has no usable path", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    expect(profileAvatarUrl(null)).toBeUndefined();
    expect(profileAvatarUrl("user/avatar.jpg")).toBeUndefined();
  });
});
