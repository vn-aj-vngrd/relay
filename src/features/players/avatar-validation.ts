const imageTypes = {
  "image/jpeg": {
    extension: "jpg",
    valid: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    valid: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47,
  },
  "image/webp": {
    extension: "webp",
    valid: (bytes: Uint8Array) =>
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP",
  },
} as const;

export async function validateAvatarFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return { error: "Choose a photo to upload." } as const;
  if (value.size > 5 * 1024 * 1024) return { error: "Choose a photo smaller than 5 MB." } as const;
  const type = imageTypes[value.type as keyof typeof imageTypes];
  if (!type) return { error: "Use a JPG, PNG, or WebP photo." } as const;
  const bytes = new Uint8Array(await value.arrayBuffer());
  if (!type.valid(bytes)) return { error: "That file doesn’t appear to be a valid image." } as const;
  return { file: value, extension: type.extension } as const;
}
