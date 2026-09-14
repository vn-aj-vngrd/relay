import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useStoryPhotos } from "./use-story-photos";

vi.mock("@/lib/image-file", () => ({
  isSupportedImageType: (type: string) => type === "image/png",
  hasValidImageSignature: async () => true,
}));
vi.mock("./story-photo", () => ({
  decodeStoryPhoto: async () => ({ close: () => undefined }),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Story photo selection", () => {
  const photo = (id: number) => ({
    id: String(id),
    alt: `Moment ${id}`,
    url: `/photo-${id}.png`,
  });
  it("limits the composition to four without changing the album, and frees a slot on removal", () => {
    const { result } = renderHook(useStoryPhotos);
    act(() => {
      for (let id = 1; id <= 5; id += 1) result.current.toggle(photo(id));
    });
    expect(result.current.photos.map((item) => item.id)).toEqual([
      "photo:1",
      "photo:2",
      "photo:3",
      "photo:4",
    ]);
    expect(result.current.message).toContain("holds 4 photos");
    act(() => {
      result.current.remove("photo:2");
      result.current.toggle(photo(5));
    });
    expect(result.current.photos.map((item) => item.id)).toEqual([
      "photo:1",
      "photo:3",
      "photo:4",
      "photo:5",
    ]);
  });
  it("preserves independent crops through reordering and ignores moves beyond either end", () => {
    const { result } = renderHook(useStoryPhotos);
    act(() => {
      result.current.toggle(photo(1));
      result.current.toggle(photo(2));
      result.current.crop("photo:1", { x: 20, y: 80, zoom: 2 });
      result.current.move("photo:1", 1);
    });
    expect(result.current.photos[0].crop).toEqual({ x: 50, y: 50, zoom: 1 });
    expect(result.current.photos[1]).toMatchObject({
      id: "photo:1",
      crop: { x: 20, y: 80, zoom: 2 },
    });
    act(() => {
      result.current.move("photo:1", 1);
      result.current.move("photo:2", -1);
    });
    expect(result.current.photos.map((item) => item.id)).toEqual([
      "photo:2",
      "photo:1",
    ]);
  });
  it("adds local files in order and releases only owned URLs on removal and unmount", async () => {
    vi.spyOn(URL, "createObjectURL")
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const { result, unmount } = renderHook(useStoryPhotos);
    act(() => result.current.toggle(photo(1)));
    await act(() =>
      result.current.addFiles([
        new File(["a"], "a.png", { type: "image/png" }),
        new File(["b"], "b.png", { type: "image/png" }),
      ])
    );
    expect(result.current.photos.map((item) => item.label)).toEqual([
      "Moment 1",
      "a.png",
      "b.png",
    ]);
    act(() => result.current.remove("blob:first"));
    expect(revoke).toHaveBeenCalledWith("blob:first");
    expect(revoke).not.toHaveBeenCalledWith("blob:second");
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:second");
    expect(revoke).not.toHaveBeenCalledWith("/photo-1.png");
  });
  it("retains valid selections when additional files fail validation", async () => {
    const { result } = renderHook(useStoryPhotos);
    act(() => result.current.toggle(photo(1)));
    await act(() =>
      result.current.addFiles([
        new File(["bad"], "photo.heic", { type: "image/heic" }),
      ])
    );
    expect(result.current.photos).toHaveLength(1);
    expect(result.current.message).toContain("readable JPG, PNG, or WebP");
    expect(result.current.adding).toBe(false);
  });
});
