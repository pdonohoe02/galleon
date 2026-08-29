import { z } from "zod";

export const galleonErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    retryable: z.boolean(),
    request_id: z.string().min(1),
    details: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
});

export type GalleonError = z.infer<typeof galleonErrorSchema>;

export const serviceStatusSchema = z.object({
  name: z.string().min(1),
  mode: z.literal("demo"),
  status: z.enum(["starting", "ready"]),
  version: z.string().min(1),
});

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;

export const platformSurfaces = {
  consumer: "consumer",
  marketing: "marketing",
  publisher: "publisher",
} as const;

export type PlatformSurface =
  (typeof platformSurfaces)[keyof typeof platformSurfaces];
