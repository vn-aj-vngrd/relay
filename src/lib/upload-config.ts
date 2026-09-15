import { z } from "zod";

export const DEFAULT_CHAT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const DEFAULT_MEMORY_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_MIB = 4;
export const imageMaxMiBSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_IMAGE_UPLOAD_MIB);
export const imageUploadLimitsSchema = z.object({
  chatImageMaxMiB: imageMaxMiBSchema,
  memoryImageMaxMiB: imageMaxMiBSchema,
});

export function resolveImageUploadLimits(
  settings?: {
    chatImageMaxMiB?: unknown;
    memoryImageMaxMiB?: unknown;
  } | null
) {
  const chat = imageMaxMiBSchema.safeParse(settings?.chatImageMaxMiB);
  const memory = imageMaxMiBSchema.safeParse(settings?.memoryImageMaxMiB);
  return {
    chatImageMaxBytes: chat.success
      ? chat.data * 1024 * 1024
      : DEFAULT_CHAT_IMAGE_MAX_BYTES,
    memoryImageMaxBytes: memory.success
      ? memory.data * 1024 * 1024
      : DEFAULT_MEMORY_IMAGE_MAX_BYTES,
  };
}
