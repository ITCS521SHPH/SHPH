"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText } from "lucide-react"

type FormField = {
  id: string
  type: "text" | "textarea" | "radio" | "checkbox" | "number" | "date"
  label: string
  required?: boolean
  options?: string[]
  placeholder?: string
}

type TaskFormSchema = {
  title: string
  description?: string
  fields: FormField[]
}

type Props = {
  task: any
  onSubmit: (formData: Record<string, any>) => Promise<void>
  onCancel: () => void
}

export function TaskFormViewer({ task, onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Extract form schema from task description
  const extractFormSchema = (description: string): TaskFormSchema | null => {
    try {
      const match = description.match(/<FORM_SCHEMA>([\s\S]*?)<\/FORM_SCHEMA>/)
      if (match && match[1]) {
        return JSON.parse(match[1].trim())
      }
    } catch (error) {
      console.error("Failed to parse form schema:", error)
    }
    return null
  }

  const formSchema = extractFormSchema(task.description || "")
  const cleanDescription = (task.description || "").replace(/<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/g, "").trim()

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!formSchema) return

    // Validate required fields
    const missingFields = formSchema.fields
      .filter((field) => field.required && !formData[field.id])
      .map((field) => field.label)

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(", ")}`)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Failed to submit form:", error)
      alert("Failed to submit form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!formSchema) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <CardDescription>{cleanDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>This task does not have a form to fill out.</p>
            <p className="text-sm mt-2">You can mark it as complete when done.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!formSchema.fields || !Array.isArray(formSchema.fields)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{formSchema.title || task.title}</CardTitle>
          <CardDescription>{formSchema.description || cleanDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>This form has no fields defined.</p>
            <p className="text-sm mt-2">Please check the task configuration.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{formSchema.title || task.title}</CardTitle>
            <CardDescription>{formSchema.description || cleanDescription}</CardDescription>
          </div>
          <Badge variant="outline">Form Task</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {formSchema.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {field.type === "text" && (
              <Input
                id={field.id}
                placeholder={field.placeholder}
                value={formData[field.id] || ""}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
            )}

            {field.type === "number" && (
              <Input
                id={field.id}
                type="number"
                placeholder={field.placeholder}
                value={formData[field.id] || ""}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
            )}

            {field.type === "date" && (
              <Input
                id={field.id}
                type="date"
                value={formData[field.id] || ""}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
            )}

            {field.type === "textarea" && (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                value={formData[field.id] || ""}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                rows={4}
              />
            )}

            {field.type === "radio" && field.options && (
              <RadioGroup
                value={formData[field.id] || ""}
                onValueChange={(value) => handleFieldChange(field.id, value)}
              >
                {field.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                    <Label htmlFor={`${field.id}-${option}`} className="font-normal">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {field.type === "checkbox" && field.options && (
              <div className="space-y-2">
                {field.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.id}-${option}`}
                      checked={(formData[field.id] || []).includes(option)}
                      onCheckedChange={(checked) => {
                        const currentValues = formData[field.id] || []
                        const newValues = checked
                          ? [...currentValues, option]
                          : currentValues.filter((v: string) => v !== option)
                        handleFieldChange(field.id, newValues)
                      }}
                    />
                    <Label htmlFor={`${field.id}-${option}`} className="font-normal">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            {isSubmitting ? "Submitting..." : "Submit Form & Complete Task"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
