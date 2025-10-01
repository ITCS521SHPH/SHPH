"use client"

import { useState, useEffect } from "react"
import { offlineSyncManager } from "@/lib/offline-sync"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SyncStatusComponent() {
  const [status, setStatus] = useState({
    isOnline: true,
    isSyncing: false,
    queuedItems: 0,
  })
  const [isVisible, setIsVisible] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Get initial status
    offlineSyncManager.getQueueStatus().then(setStatus)

    // Subscribe to status changes
    const unsubscribe = offlineSyncManager.onStatusChange((newStatus) => {
      const wasOffline = !status.isOnline
      const isNowOnline = newStatus.isOnline

      // Show toast when coming back online
      if (wasOffline && isNowOnline) {
        toast({
          title: "Connection Restored",
          description: "Syncing your data...",
        })
      }

      // Show toast when sync completes
      if (status.isSyncing && !newStatus.isSyncing && newStatus.queuedItems === 0) {
        toast({
          title: "Sync Complete",
          description: "All your data has been synced successfully.",
        })
      }

      setStatus(newStatus)
    })

    return unsubscribe
  }, [status.isOnline, status.isSyncing, toast])

  useEffect(() => {
    // Show status when offline or when there are queued items
    setIsVisible(!status.isOnline || status.queuedItems > 0 || status.isSyncing)
  }, [status])

  const handleForceSync = async () => {
    await offlineSyncManager.forcSync()
    toast({
      title: "Sync Started",
      description: "Manually syncing your data...",
    })
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-2 shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status.isOnline ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Offline</span>
                  </>
                )}
              </div>

              {status.isOnline && (
                <Button variant="ghost" size="sm" onClick={handleForceSync} disabled={status.isSyncing}>
                  <RefreshCw className={`h-3 w-3 ${status.isSyncing ? "animate-spin" : ""}`} />
                </Button>
              )}
            </div>

            {/* Sync Status */}
            {status.isSyncing && (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertDescription>Syncing data...</AlertDescription>
              </Alert>
            )}

            {/* Queued Items */}
            {status.queuedItems > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Queued items:</span>
                </div>
                <Badge variant="secondary">{status.queuedItems}</Badge>
              </div>
            )}

            {/* Offline Notice */}
            {!status.isOnline && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  You're offline. Changes will be saved locally and synced when connection is restored.
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {status.isOnline && status.queuedItems === 0 && !status.isSyncing && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">All data is synced</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
