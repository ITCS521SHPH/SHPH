"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { offlineSyncManager } from "@/lib/offline-sync"
import { useToast } from "@/hooks/use-toast"

export interface VisitFormData {
  patientId: string
  symptoms: string
  bloodPressure: string
  heartRate: string
  temperature: string
  notes: string
}

export interface VisitFormState {
  currentStep: number
  formData: VisitFormData
  isLoading: boolean
  error: string | null
  isDraft: boolean
  draftId?: string
}

type VisitFormAction =
  | { type: "SET_STEP"; step: number }
  | { type: "UPDATE_FIELD"; field: keyof VisitFormData; value: string }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_DRAFT"; isDraft: boolean; draftId?: string }
  | { type: "RESET_FORM" }
  | { type: "LOAD_DRAFT"; data: VisitFormData; draftId: string }

const initialState: VisitFormState = {
  currentStep: 0,
  formData: {
    patientId: "",
    symptoms: "",
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    notes: "",
  },
  isLoading: false,
  error: null,
  isDraft: false,
}

function visitFormReducer(state: VisitFormState, action: VisitFormAction): VisitFormState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step }
    case "UPDATE_FIELD":
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
        error: null,
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.loading }
    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false }
    case "SET_DRAFT":
      return { ...state, isDraft: action.isDraft, draftId: action.draftId }
    case "RESET_FORM":
      return { ...initialState }
    case "LOAD_DRAFT":
      return {
        ...state,
        formData: action.data,
        isDraft: true,
        draftId: action.draftId,
      }
    default:
      return state
  }
}

interface VisitFormContextType {
  state: VisitFormState
  dispatch: React.Dispatch<VisitFormAction>
  nextStep: () => void
  prevStep: () => void
  updateField: (field: keyof VisitFormData, value: string) => void
  saveDraft: () => Promise<void>
  submitForm: () => Promise<void>
  validateCurrentStep: () => boolean
}

const VisitFormContext = createContext<VisitFormContextType | undefined>(undefined)

export function VisitFormProvider({ children, patientId }: { children: React.ReactNode; patientId: string }) {
  const [state, dispatch] = useReducer(visitFormReducer, {
    ...initialState,
    formData: { ...initialState.formData, patientId },
  })

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const { data: drafts } = await supabase
          .from("visit_records")
          .select("*")
          .eq("patient_id", patientId)
          .eq("status", "draft")
          .order("created_at", { ascending: false })
          .limit(1)

        if (drafts && drafts.length > 0) {
          const draft = drafts[0]
          dispatch({
            type: "LOAD_DRAFT",
            data: {
              patientId,
              symptoms: draft.symptoms || "",
              bloodPressure: draft.blood_pressure || "",
              heartRate: draft.heart_rate?.toString() || "",
              temperature: draft.temperature?.toString() || "",
              notes: draft.notes || "",
            },
            draftId: draft.id,
          })
        }
      } catch (error) {
        console.error("Error loading draft:", error)
      }
    }

    if (patientId) {
      loadDraft()
    }
  }, [patientId, supabase])

  const nextStep = () => {
    if (validateCurrentStep() && state.currentStep < 3) {
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 })
    }
  }

  const prevStep = () => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 })
    }
  }

  const updateField = (field: keyof VisitFormData, value: string) => {
    dispatch({ type: "UPDATE_FIELD", field, value })
  }

  const validateCurrentStep = (): boolean => {
    const { formData } = state

    switch (state.currentStep) {
      case 0: // Symptoms
        if (formData.symptoms.length < 5) {
          dispatch({ type: "SET_ERROR", error: "Symptoms must be at least 5 characters long" })
          return false
        }
        break
      case 1: // Vitals
        // Blood pressure validation (###/##)
        if (formData.bloodPressure && !/^[0-9]{2,3}\/[0-9]{2}$/.test(formData.bloodPressure)) {
          dispatch({ type: "SET_ERROR", error: "Blood pressure must be in format ###/## (e.g., 120/80)" })
          return false
        }
        // Heart rate validation (40-220)
        if (formData.heartRate) {
          const hr = Number.parseInt(formData.heartRate)
          if (isNaN(hr) || hr < 40 || hr > 220) {
            dispatch({ type: "SET_ERROR", error: "Heart rate must be between 40 and 220" })
            return false
          }
        }
        // Temperature validation (30.0-43.0)
        if (formData.temperature) {
          const temp = Number.parseFloat(formData.temperature)
          if (isNaN(temp) || temp < 30.0 || temp > 43.0) {
            dispatch({ type: "SET_ERROR", error: "Temperature must be between 30.0 and 43.0°C" })
            return false
          }
        }
        break
      case 2: // Notes - no validation required
        break
      case 3: // Review - final validation
        if (formData.symptoms.length < 5) {
          dispatch({ type: "SET_ERROR", error: "Please complete all required fields" })
          return false
        }
        break
    }

    dispatch({ type: "SET_ERROR", error: null })
    return true
  }

  const saveDraft = async () => {
    dispatch({ type: "SET_LOADING", loading: true })

    try {
      const recordData = {
        patient_id: state.formData.patientId,
        symptoms: state.formData.symptoms || null,
        blood_pressure: state.formData.bloodPressure || null,
        heart_rate: state.formData.heartRate ? Number.parseInt(state.formData.heartRate) : null,
        temperature: state.formData.temperature ? Number.parseFloat(state.formData.temperature) : null,
        notes: state.formData.notes || null,
        status: "draft",
      }

      if (state.draftId) {
        const { error } = await supabase.from("visit_records").update(recordData).eq("id", state.draftId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from("visit_records").insert(recordData).select().single()
        if (error) throw error
        dispatch({ type: "SET_DRAFT", isDraft: true, draftId: data.id })
      }

      dispatch({ type: "SET_DRAFT", isDraft: true })
      toast({
        title: "Draft Saved",
        description: "Your visit record has been saved as a draft.",
      })
    } catch (error: any) {
      if (!navigator.onLine) {
        try {
          await offlineSyncManager.queueRecord({
            ...state.formData,
            status: "draft",
            action: state.draftId ? "update" : "create",
            draftId: state.draftId,
          })
          dispatch({ type: "SET_DRAFT", isDraft: true })
          toast({
            title: "Draft Saved Offline",
            description: "Your draft will be synced when connection is restored.",
          })
        } catch (queueError) {
          dispatch({ type: "SET_ERROR", error: "Failed to save offline. Please try again." })
          toast({
            title: "Save Failed",
            description: "Failed to save draft. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        dispatch({ type: "SET_ERROR", error: error.message })
        toast({
          title: "Save Failed",
          description: error.message,
          variant: "destructive",
        })
      }
    } finally {
      dispatch({ type: "SET_LOADING", loading: false })
    }
  }

  const submitForm = async () => {
    if (!validateCurrentStep()) return

    dispatch({ type: "SET_LOADING", loading: true })

    try {
      const recordData = {
        patient_id: state.formData.patientId,
        symptoms: state.formData.symptoms,
        blood_pressure: state.formData.bloodPressure || null,
        heart_rate: state.formData.heartRate ? Number.parseInt(state.formData.heartRate) : null,
        temperature: state.formData.temperature ? Number.parseFloat(state.formData.temperature) : null,
        notes: state.formData.notes || null,
        status: "pending",
      }

      if (state.draftId) {
        const { error } = await supabase.from("visit_records").update(recordData).eq("id", state.draftId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("visit_records").insert(recordData)
        if (error) throw error
      }

      dispatch({ type: "RESET_FORM" })
      toast({
        title: "Visit Record Submitted",
        description: "Your visit record has been submitted for doctor review.",
      })
    } catch (error: any) {
      if (!navigator.onLine) {
        try {
          await offlineSyncManager.queueRecord({
            ...state.formData,
            status: "pending",
            action: state.draftId ? "update" : "create",
            draftId: state.draftId,
          })
          dispatch({ type: "RESET_FORM" })
          toast({
            title: "Submitted Offline",
            description: "Your record will be submitted when connection is restored.",
          })
        } catch (queueError) {
          dispatch({ type: "SET_ERROR", error: "Failed to submit offline. Please try again." })
          toast({
            title: "Submit Failed",
            description: "Failed to submit offline. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        dispatch({ type: "SET_ERROR", error: error.message })
        toast({
          title: "Submit Failed",
          description: error.message,
          variant: "destructive",
        })
      }
    } finally {
      dispatch({ type: "SET_LOADING", loading: false })
    }
  }

  return (
    <VisitFormContext.Provider
      value={{
        state,
        dispatch,
        nextStep,
        prevStep,
        updateField,
        saveDraft,
        submitForm,
        validateCurrentStep,
      }}
    >
      {children}
    </VisitFormContext.Provider>
  )
}

export function useVisitForm() {
  const context = useContext(VisitFormContext)
  if (context === undefined) {
    throw new Error("useVisitForm must be used within a VisitFormProvider")
  }
  return context
}
