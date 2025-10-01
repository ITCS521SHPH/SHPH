// Offline storage for healthcare system
// Uses localStorage for form data and IndexedDB for larger datasets

interface OfflineFormData {
  id: string
  intakeId?: string | null
  patientId: string
  formData: any
  completedSections: string[]
  lastModified: number
  synced: boolean
}

interface OfflineIntake {
  id: string
  patientId: string
  status: "draft" | "ready_for_submission" | "submitted"
  data: any
  createdAt: number
  lastModified: number
  synced: boolean
}

class OfflineStorageManager {
  private dbName = "healthcare-offline-db"
  private dbVersion = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create stores for different data types
        if (!db.objectStoreNames.contains("formData")) {
          const formStore = db.createObjectStore("formData", { keyPath: "id" })
          formStore.createIndex("patientId", "patientId", { unique: false })
          formStore.createIndex("synced", "synced", { unique: false })
        }

        if (!db.objectStoreNames.contains("intakes")) {
          const intakeStore = db.createObjectStore("intakes", { keyPath: "id" })
          intakeStore.createIndex("patientId", "patientId", { unique: false })
          intakeStore.createIndex("status", "status", { unique: false })
          intakeStore.createIndex("synced", "synced", { unique: false })
        }
      }
    })
  }

  // Form data management
  async saveFormData(data: OfflineFormData): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["formData"], "readwrite")
    const store = transaction.objectStore("formData")

    data.lastModified = Date.now()
    data.synced = data.synced === true ? true : false

    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getFormData(patientId: string): Promise<OfflineFormData | null> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["formData"], "readonly")
    const store = transaction.objectStore("formData")

    return new Promise((resolve, reject) => {
      // Try to get by the consistent ID first
      const request = store.get(`form-${patientId}`)
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result)
        } else {
          // Fallback: search by patientId index for backward compatibility
          const index = store.index("patientId")
          const fallbackRequest = index.get(patientId)
          fallbackRequest.onsuccess = () => resolve(fallbackRequest.result || null)
          fallbackRequest.onerror = () => reject(fallbackRequest.error)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAllUnsyncedFormData(): Promise<OfflineFormData[]> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["formData"], "readonly")
    const store = transaction.objectStore("formData")

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const allRecords = request.result
        // Filter for unsynced records (synced === false or undefined/null)
        const unsyncedRecords = allRecords.filter((record) => record.synced !== true)
        resolve(unsyncedRecords)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async markFormDataSynced(id: string): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["formData"], "readwrite")
    const store = transaction.objectStore("formData")

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const data = getRequest.result
        if (data) {
          data.synced = true
          const putRequest = store.put(data)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Intake management
  async saveIntake(intake: OfflineIntake): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["intakes"], "readwrite")
    const store = transaction.objectStore("intakes")

    intake.lastModified = Date.now()
    intake.synced = intake.synced === true ? true : false

    return new Promise((resolve, reject) => {
      const request = store.put(intake)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getIntake(id: string): Promise<OfflineIntake | null> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["intakes"], "readonly")
    const store = transaction.objectStore("intakes")

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllUnsyncedIntakes(): Promise<OfflineIntake[]> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["intakes"], "readonly")
    const store = transaction.objectStore("intakes")

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const allRecords = request.result
        // Filter for unsynced records (synced === false or undefined/null)
        const unsyncedRecords = allRecords.filter((record) => record.synced !== true)
        resolve(unsyncedRecords)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Connectivity and sync management
  isOnline(): boolean {
    return navigator.onLine
  }

  async syncData(): Promise<void> {
    if (!this.isOnline()) {
      console.log("Cannot sync - offline")
      return
    }

    try {
      // Import API functions dynamically to avoid circular dependencies
      const { intakesApi } = await import("./api")

      // Sync unsynced intakes first
      const unsyncedIntakes = await this.getAllUnsyncedIntakes()
      for (const intake of unsyncedIntakes) {
        try {
          if (intake.status === "ready_for_submission") {
            await intakesApi.create(intake.patientId)
            // Update form data with the new intake ID and sync
            const formData = await this.getFormData(intake.patientId)
            if (formData) {
              await intakesApi.update(intake.id, formData.formData)
              await intakesApi.submit(intake.id)
              await this.markFormDataSynced(formData.id)
            }
          }
          await this.markIntakeSynced(intake.id)
          console.log(`Synced intake ${intake.id}`)
        } catch (error) {
          console.error(`Failed to sync intake ${intake.id}:`, error)
        }
      }

      // Sync unsynced form data
      const unsyncedFormData = await this.getAllUnsyncedFormData()
      for (const formData of unsyncedFormData) {
        try {
          if (formData.intakeId) {
            await intakesApi.update(formData.intakeId, formData.formData)
            await this.markFormDataSynced(formData.id)
            console.log(`Synced form data ${formData.id}`)
          }
        } catch (error) {
          console.error(`Failed to sync form data ${formData.id}:`, error)
        }
      }

      console.log("Sync completed successfully")
    } catch (error) {
      console.error("Sync failed:", error)
    }
  }

  private async markIntakeSynced(id: string): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["intakes"], "readwrite")
    const store = transaction.objectStore("intakes")

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const data = getRequest.result
        if (data) {
          data.synced = true
          const putRequest = store.put(data)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Setup auto-sync when coming back online
  setupAutoSync(): void {
    window.addEventListener("online", () => {
      console.log("Connection restored - starting auto-sync")
      this.syncData()
    })

    // Also periodically sync when online
    setInterval(() => {
      if (this.isOnline()) {
        this.syncData()
      }
    }, 60000) // Sync every minute when online
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageManager()

// Utility functions for easier use
export const saveFormDataOffline = (
  patientId: string,
  intakeId: string | null,
  formData: any,
  completedSections: string[],
) => {
  return offlineStorage.saveFormData({
    id: `form-${patientId}`, // Use consistent ID for same patient
    intakeId,
    patientId,
    formData,
    completedSections,
    lastModified: Date.now(),
    synced: false,
  })
}

export const getOfflineFormData = (patientId: string) => {
  return offlineStorage.getFormData(patientId)
}

export const initOfflineStorage = () => {
  return offlineStorage.init().then(() => {
    offlineStorage.setupAutoSync()
  })
}
