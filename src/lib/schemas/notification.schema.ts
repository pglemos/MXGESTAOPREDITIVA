import { z } from 'zod'

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  priority: z.string(),
  read: z.boolean(),
  recipient_id: z.string(),
  sender_id: z.string().nullable().optional(),
  store_id: z.string().nullable().optional(),
  target_role: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  broadcast_id: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})

export type Notification = z.infer<typeof NotificationSchema>

export function parseNotification(data: unknown): Notification {
  return NotificationSchema.parse(data)
}

export function parseNotificationArray(data: unknown): Notification[] {
  return z.array(NotificationSchema).parse(data)
}
