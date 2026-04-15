import { z } from "https://esm.sh/zod@3";

export const reportRequestSchema = z.object({
  store_id: z.string().uuid().optional(),
  dry_run: z.boolean().optional(),
  force: z.boolean().optional(),
});

export type ReportRequest = z.infer<typeof reportRequestSchema>;

export const sendFeedbackSchema = z.object({
  feedbackId: z.string().uuid(),
});

export const oauthInitSchema = z.object({
  clientId: z.string().optional(),
});

export const calendarEventsSchema = z.object({
  clientId: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
  timeMin: z.string().min(1).optional(),
  timeMax: z.string().min(1).optional(),
});

export async function parseReportBody(req: Request): Promise<ReportRequest> {
  if (req.method !== "POST") return {};
  try {
    const raw = await req.json();
    const result = reportRequestSchema.safeParse(raw);
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

export async function parseStrictBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<T> {
  const raw = await req.json();
  return schema.parse(raw);
}
