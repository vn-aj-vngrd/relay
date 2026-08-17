export { DEFAULT_CHAT_IMAGE_MAX_BYTES } from "@/lib/upload-config";

const imageTypes = {
  "image/jpeg": { extension: "jpg", valid: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", valid: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", valid: (bytes: Uint8Array) => new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP" },
} as const;

export function formatChatImageLimit(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const megabytes = bytes / (1024 * 1024);
  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
}

export function validateChatImageMetadata(file: { type: string; size: number }, maxBytes: number) {
  if (!(file.type in imageTypes)) return "Use a JPG, PNG, or WebP photo.";
  if (file.size > maxBytes) return `Choose a photo no larger than ${formatChatImageLimit(maxBytes)}.`;
  return null;
}

export async function validateChatImageFile(file: File, maxBytes: number) {
  const metadataError = validateChatImageMetadata(file, maxBytes);
  if (metadataError) return { error: metadataError } as const;
  const type = imageTypes[file.type as keyof typeof imageTypes];
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!type.valid(bytes)) return { error: "That file doesn’t appear to be a valid image." } as const;
  return { file, extension: type.extension } as const;
}
