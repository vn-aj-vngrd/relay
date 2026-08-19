const imageSignatures = {
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

export type SupportedImageType = keyof typeof imageSignatures;

export function isSupportedImageType(type: string): type is SupportedImageType {
  return type in imageSignatures;
}

export function imageExtension(type: SupportedImageType) {
  return imageSignatures[type].extension;
}

export async function hasValidImageSignature(file: File) {
  if (!isSupportedImageType(file.type)) return false;
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return imageSignatures[file.type].valid(bytes);
}
