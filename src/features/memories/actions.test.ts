import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  viewer: vi.fn(),
  store: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      sessions: { findFirst: mocks.session },
      memories: { findFirst: vi.fn(async () => ({ id: "memory" })) },
    },
  },
}));
vi.mock("@/features/auth/session", () => ({
  getCurrentUser: vi.fn(async () => null),
}));
vi.mock("@/features/sessions/viewer", () => ({
  getSessionViewer: mocks.viewer,
}));
vi.mock("@/features/billing/media", () => ({ storeGameMedia: mocks.store }));
vi.mock("@/lib/image-file", () => ({
  isSupportedImageType: vi.fn(() => true),
  hasValidImageSignature: vi.fn(async () => true),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));

import { uploadMemoryPhotoState } from "./actions";

const session = {
  id: "00000000-0000-4000-8000-000000000001",
  hostId: "host",
  slug: "pregame",
  title: "Saturday crew",
  status: "published",
  participantImagesEnabled: true,
};
function photoForm() {
  const data = new FormData();
  data.set("sessionId", session.id);
  data.set("photo", new File(["photo"], "crew.png", { type: "image/png" }));
  data.set("caption", "Before the first rally");
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue(session);
  mocks.viewer.mockResolvedValue({
    user: null,
    player: { id: "guest", role: "player", rsvp: "going" },
  });
  mocks.store.mockResolvedValue(undefined);
});

describe("game photo upload phases", () => {
  it.each(["published", "live", "completed"])(
    "allows Going guest uploads during %s",
    async (status) => {
      mocks.session.mockResolvedValue({ ...session, status });
      expect(await uploadMemoryPhotoState({}, photoForm())).toEqual({
        success: true,
      });
      expect(mocks.store).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: "host",
          sessionId: session.id,
          kind: "memory",
          actorKey: "guest:guest",
        }),
        expect.any(Function)
      );
      expect(mocks.revalidate).toHaveBeenCalledWith(
        `/games/${session.id}/story`
      );
      expect(mocks.revalidate).toHaveBeenCalledWith("/s/pregame/story");
    }
  );
  it.each(["draft", "cancelled"])(
    "blocks %s uploads even for the host",
    async (status) => {
      mocks.session.mockResolvedValue({ ...session, status });
      mocks.viewer.mockResolvedValue({ user: { id: "host" }, player: null });
      expect(await uploadMemoryPhotoState({}, photoForm())).toHaveProperty(
        "error"
      );
      expect(mocks.store).not.toHaveBeenCalled();
    }
  );
  it("blocks nonparticipants before the game", async () => {
    mocks.viewer.mockResolvedValue(null);
    expect(await uploadMemoryPhotoState({}, photoForm())).toHaveProperty(
      "error",
      "Only players and organizers can add game photos."
    );
    expect(mocks.store).not.toHaveBeenCalled();
  });
  it("preserves the host's participant-image restriction before the game", async () => {
    mocks.session.mockResolvedValue({
      ...session,
      participantImagesEnabled: false,
    });
    expect(await uploadMemoryPhotoState({}, photoForm())).toHaveProperty(
      "error",
      "The host has turned off participant image uploads for this game."
    );
    expect(mocks.store).not.toHaveBeenCalled();
    mocks.viewer.mockResolvedValue({ user: { id: "host" }, player: null });
    expect(await uploadMemoryPhotoState({}, photoForm())).toEqual({
      success: true,
    });
  });
});
