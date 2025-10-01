"use client"

import { createClient } from "@/lib/supabase/client"

export interface QueuedRecord {
  id: string
  user_id: string
  record_data: any
  record_type: string
  created_at: string
  synced_at: string | null
}

class OfflineSyncManager {
  private supabase = createClient()
  private syncInProgress = false
  private listeners: Array<(status: SyncStatus) => void> = []

  constructor() {
    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline())
      window.addEventListener("offline", () => this.handleOffline())

      // Start periodic sync when online
      if (navigator.onLine) {
        this.startPeriodicSync()
      }
    }
  }

  private handleOnline() {
    console.log("[OfflineSync] Device came online, starting sync...")
    this.notifyListeners({ isOnline: true, isSyncing: false, queuedItems: 0 })
    this.syncQueuedRecords()
    this.startPeriodicSync()
  }

  private handleOffline() {
    console.log("[OfflineSync] Device went offline")
    this.notifyListeners({ isOnline: false, isSyncing: false, queuedItems: 0 })
    this.stopPeriodicSync()
  }

  private syncInterval: NodeJS.Timeout | null = null

  private startPeriodicSync() {
    if (this.syncInterval) return

    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncQueuedRecords()
      }
    }, 30000)
  }

  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async queueRecord(recordData: any, recordType = "visit_record"): Promise<void> {
    try {
      const { error } = await this.supabase.from("offline_queue").insert({
        record_data: recordData,
        record_type: recordType,
      })

      if (error) throw error

      console.log("[OfflineSync] Record queued for sync:", recordType)
      this.updateQueueStatus()
    } catch (error) {
      console.error("[OfflineSync] Failed to queue record:", error)
      throw error
    }
  }

  async syncQueuedRecords(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return

    this.syncInProgress = true
    this.notifyListeners({ isOnline: true, isSyncing: true, queuedItems: 0 })

    try {
      // Get all unsynced records
      const { data: queuedRecords, error: fetchError } = await this.supabase
        .from("offline_queue")
        .select("*")
        .is("synced_at", null)
        .order("created_at", { ascending: true })

      if (fetchError) throw fetchError

      if (!queuedRecords || queuedRecords.length === 0) {
        console.log("[OfflineSync] No records to sync")
        this.syncInProgress = false
        this.notifyListeners({ isOnline: true, isSyncing: false, queuedItems: 0 })
        return
      }

      console.log(`[OfflineSync] Syncing ${queuedRecords.length} queued records...`)

      let successCount = 0
      let failureCount = 0

      for (const queuedRecord of queuedRecords) {
        try {
          await this.processQueuedRecord(queuedRecord)
          successCount++

          // Mark as synced
          await this.supabase
            .from("offline_queue")
            .update({ synced_at: new Date().toISOString() })
            .eq("id", queuedRecord.id)
        } catch (error) {
          console.error(`[OfflineSync] Failed to sync record ${queuedRecord.id}:`, error)
          failureCount++
        }
      }

      console.log(`[OfflineSync] Sync completed: ${successCount} success, ${failureCount} failures`)

      // Clean up old synced records (older than 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      await this.supabase
        .from("offline_queue")
        .delete()
        .not("synced_at", "is", null)
        .lt("synced_at", weekAgo.toISOString())
    } catch (error) {
      console.error("[OfflineSync] Sync failed:", error)
    } finally {
      this.syncInProgress = false
      this.updateQueueStatus()
    }
  }

  private async processQueuedRecord(queuedRecord: QueuedRecord): Promise<void> {
    const { record_data, record_type } = queuedRecord

    switch (record_type) {
      case "visit_record":
        await this.syncVisitRecord(record_data)
        break
      default:
        throw new Error(`Unknown record type: ${record_type}`)
    }
  }

  private async syncVisitRecord(recordData: any): Promise<void> {
    const { action, draftId, ...visitData } = recordData

    // Prepare the record for database insertion
    const dbRecord = {
      patient_id: visitData.patientId,
      symptoms: visitData.symptoms || null,
      blood_pressure: visitData.bloodPressure || null,
      heart_rate: visitData.heartRate ? Number.parseInt(visitData.heartRate) : null,
      temperature: visitData.temperature ? Number.parseFloat(visitData.temperature) : null,
      notes: visitData.notes || null,
      status: visitData.status || "pending",
    }

    if (action === "update" && draftId) {
      // Update existing draft
      const { error } = await this.supabase.from("visit_records").update(dbRecord).eq("id", draftId)
      if (error) throw error
    } else {
      // Create new record
      const { error } = await this.supabase.from("visit_records").insert(dbRecord)
      if (error) throw error
    }
  }

  private async updateQueueStatus(): Promise<void> {
    try {
      const { data: queuedRecords } = await this.supabase.from("offline_queue").select("id").is("synced_at", null)

      const queuedCount = queuedRecords?.length || 0
      this.notifyListeners({
        isOnline: navigator.onLine,
        isSyncing: this.syncInProgress,
        queuedItems: queuedCount,
      })
    } catch (error) {
      console.error("[OfflineSync] Failed to update queue status:", error)
    }
  }

  // Public API
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach((callback) => callback(status))
  }

  async getQueueStatus(): Promise<SyncStatus> {
    try {
      const { data: queuedRecords } = await this.supabase.from("offline_queue").select("id").is("synced_at", null)

      return {
        isOnline: navigator.onLine,
        isSyncing: this.syncInProgress,
        queuedItems: queuedRecords?.length || 0,
      }
    } catch (error) {
      console.error("[OfflineSync] Failed to get queue status:", error)
      return {
        isOnline: navigator.onLine,
        isSyncing: false,
        queuedItems: 0,
      }
    }
  }

  async forcSync(): Promise<void> {
    if (navigator.onLine) {
      await this.syncQueuedRecords()
    }
  }
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  queuedItems: number
}

// Singleton instance
export const offlineSyncManager = new OfflineSyncManager()
