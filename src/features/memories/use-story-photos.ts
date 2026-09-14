import { useEffect, useRef, useState } from "react";
import { hasValidImageSignature, isSupportedImageType } from "@/lib/image-file";
import {
  defaultPhotoCrop,
  type StoryPhotoCrop,
  type StorySelectedPhoto,
  storyPhotoLimit,
} from "./story-collage";
import { decodeStoryPhoto } from "./story-photo";

export function useStoryPhotos() {
  const [photos, setPhotos] = useState<StorySelectedPhoto[]>([]);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const current = useRef(photos);
  const generation = useRef(0);
  const ownedUrls = useRef(new Set<string>());

  function update(next: StorySelectedPhoto[]) {
    current.current = next;
    setPhotos(next);
  }

  useEffect(
    () => () => {
      generation.current += 1;
      for (const url of ownedUrls.current) URL.revokeObjectURL(url);
      ownedUrls.current.clear();
    },
    []
  );

  function remove(id: string) {
    const photo = current.current.find((item) => item.id === id);
    update(current.current.filter((item) => item.id !== id));
    if (photo && ownedUrls.current.delete(photo.imageUrl))
      URL.revokeObjectURL(photo.imageUrl);
    setMessage("");
  }

  function toggle(photo: { id: string; url: string; alt: string }) {
    const id = `photo:${photo.id}`;
    if (current.current.some((item) => item.id === id)) return remove(id);
    if (current.current.length >= storyPhotoLimit) {
      setMessage("This collage holds 4 photos. Remove one to choose another.");
      return;
    }
    update([
      ...current.current,
      {
        id,
        label: photo.alt,
        imageUrl: photo.url,
        crop: { ...defaultPhotoCrop },
      },
    ]);
    setMessage("");
  }

  async function addFiles(files: File[]) {
    if (!files.length) return;
    const request = ++generation.current;
    setAdding(true);
    setMessage("Adding your photos…");
    let rejected = 0;
    let added = 0;
    let full = false;
    try {
      for (const file of files) {
        if (request !== generation.current) return;
        if (current.current.length >= storyPhotoLimit) {
          full = true;
          break;
        }
        try {
          if (
            !isSupportedImageType(file.type) ||
            file.size === 0 ||
            file.size > 10 * 1024 * 1024 ||
            !(await hasValidImageSignature(file))
          ) {
            rejected += 1;
            continue;
          }
          const bitmap = await decodeStoryPhoto(file);
          bitmap.close();
        } catch {
          rejected += 1;
          continue;
        }
        if (request !== generation.current) return;
        if (current.current.length >= storyPhotoLimit) {
          full = true;
          break;
        }
        const imageUrl = URL.createObjectURL(file);
        ownedUrls.current.add(imageUrl);
        update([
          ...current.current,
          {
            id: imageUrl,
            label: file.name,
            imageUrl,
            file,
            crop: { ...defaultPhotoCrop },
          },
        ]);
        added += 1;
      }
      if (request === generation.current)
        setMessage(
          [
            added
              ? `${added} ${added === 1 ? "photo added" : "photos added"} to this story only. Nothing was uploaded.`
              : "",
            rejected
              ? "Some photos couldn’t be added. Choose readable JPG, PNG, or WebP files under 10 MB each."
              : "",
            full
              ? "This collage holds 4 photos. Remove one to add another."
              : "",
          ]
            .filter(Boolean)
            .join(" ")
        );
    } finally {
      if (request === generation.current) setAdding(false);
    }
  }

  function crop(id: string, value: StoryPhotoCrop) {
    update(
      current.current.map((item) =>
        item.id === id ? { ...item, crop: value } : item
      )
    );
  }

  function move(id: string, direction: -1 | 1) {
    const next = [...current.current];
    const index = next.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  return {
    photos,
    adding,
    message,
    toggle,
    addFiles,
    remove,
    crop,
    move,
    clearMessage: () => setMessage(""),
  };
}
