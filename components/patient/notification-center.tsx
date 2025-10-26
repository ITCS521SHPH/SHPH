"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react"
import { notificationsApi } from "@/lib/api"
import type { Notification } from "@/lib/types"

interface NotificationCenterProps {
  userId: string
  userRole: string
}

export function NotificationCenter({ userId, userRole }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await notificationsApi.getByUser(userId, filter === "unread")
      setNotifications(data)
    } catch (error) {
      console.error("[v0] Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId, filter])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      await fetchNotifications()
    } catch (error) {
      console.error("[v0] Failed to mark notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead(userId)
      await fetchNotifications()
    } catch (error) {
      console.error("[v0] Failed to mark all as read:", error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsApi.delete(notificationId)
      await fetchNotifications()
    } catch (error) {
      console.error("[v0] Failed to delete notification:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "✅"
      case "WARNING":
        return "⚠️"
      case "ERROR":
        return "❌"
      default:
        return "ℹ️"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "border-l-green-500 bg-green-50/50 dark:bg-green-950/10"
      case "WARNING":
        return "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10"
      case "ERROR":
        return "border-l-red-500 bg-red-50/50 dark:bg-red-950/10"
      default:
        return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10"
    }
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading notifications...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount} New</Badge>}
            </CardTitle>
            <CardDescription>Stay updated on your health data status</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilter(filter === "all" ? "unread" : "all")}>
              {filter === "all" ? "Show Unread" : "Show All"}
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications at this time</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-l-4 ${getNotificationColor(notification.type)} ${
                !notification.readAt ? "shadow-md" : "opacity-75"
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <h4 className="font-semibold">{notification.title}</h4>
                      {!notification.readAt && (
                        <Badge variant="default" className="bg-blue-500 text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.readAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(notification.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  )
}
