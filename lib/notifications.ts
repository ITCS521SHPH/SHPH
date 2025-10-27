import { createClient } from "@/lib/supabase-server"

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  relatedId?: string
  relatedType?: string
  read: boolean
  createdAt: string
  updatedAt: string
}

export async function createNotification(data: {
  userId: string
  type: string
  title: string
  message: string
  relatedId?: string
  relatedType?: string
}): Promise<Notification | null> {
  try {
    const supabase = await createClient()

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        related_id: data.relatedId,
        related_type: data.relatedType,
        read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to create notification:", error)
      return null
    }

    return {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.related_id,
      relatedType: notification.related_type,
      read: notification.read,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
    }
  } catch (error) {
    console.error("[v0] Notification creation error:", error)
    return null
  }
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("read", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch notifications:", error)
      return []
    }

    return (data || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      relatedId: n.related_id,
      relatedType: n.related_type,
      read: n.read,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }))
  } catch (error) {
    console.error("[v0] Notification fetch error:", error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("id", notificationId)

    if (error) {
      console.error("[v0] Failed to mark notification as read:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Notification update error:", error)
    return false
  }
}

export async function notifyAppointmentCreated(
  patientId: string,
  appointmentDetails: {
    type: string
    date: string
    time: string
    providerName: string
    appointmentId: string
  },
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: "appointment_created",
    title: "New Appointment Scheduled",
    message: `Your ${appointmentDetails.type} appointment with ${appointmentDetails.providerName} has been scheduled for ${appointmentDetails.date} at ${appointmentDetails.time}.`,
    relatedId: appointmentDetails.appointmentId,
    relatedType: "appointment",
  })
}

export async function notifyAppointmentUpdated(
  patientId: string,
  appointmentDetails: {
    type: string
    date: string
    time: string
    appointmentId: string
  },
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: "appointment_updated",
    title: "Appointment Updated",
    message: `Your ${appointmentDetails.type} appointment has been rescheduled to ${appointmentDetails.date} at ${appointmentDetails.time}.`,
    relatedId: appointmentDetails.appointmentId,
    relatedType: "appointment",
  })
}

export async function notifyAppointmentCancelled(
  patientId: string,
  appointmentDetails: {
    type: string
    date: string
    appointmentId: string
  },
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: "appointment_cancelled",
    title: "Appointment Cancelled",
    message: `Your ${appointmentDetails.type} appointment scheduled for ${appointmentDetails.date} has been cancelled.`,
    relatedId: appointmentDetails.appointmentId,
    relatedType: "appointment",
  })
}

export async function notifyAppointmentReminder(
  patientId: string,
  appointmentDetails: {
    type: string
    date: string
    time: string
    providerName: string
    appointmentId: string
  },
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: "appointment_reminder",
    title: "Appointment Reminder",
    message: `Reminder: You have a ${appointmentDetails.type} appointment with ${appointmentDetails.providerName} tomorrow at ${appointmentDetails.time}.`,
    relatedId: appointmentDetails.appointmentId,
    relatedType: "appointment",
  })
}
