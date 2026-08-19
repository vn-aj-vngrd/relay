import { hasValidImageSignature, imageExtension, isSupportedImageType } from "@/lib/image-file";

export async function validateAvatarFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return { error: "Choose a photo to upload." } as const;
  if (value.size > 5 * 1024 * 1024) return { error: "Choose a photo smaller than 5 MB." } as const;
  if (!isSupportedImageType(value.type)) return { error: "Use a JPG, PNG, or WebP photo." } as const;
  if (!(await hasValidImageSignature(value)))
    return { error: "That file doesn’t appear to be a valid image." } as const;
  return { file: value, extension: imageExtension(value.type) } as const;
}
