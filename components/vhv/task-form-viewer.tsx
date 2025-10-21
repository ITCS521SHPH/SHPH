"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// No checkbox needed; closed-ended uses radio buttons
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText } from "lucide-react"

type Question = {
  id: string
  text: string
  type: "open" | "close"
  options?: string[]
}

type TaskFormSchema = {
  questions: Question[]
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

  // Closed-ended inputs are single-select radios; no checkbox handler needed

  const handleSubmit = async () => {
    if (!formSchema || !formSchema.questions || formSchema.questions.length === 0) return

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

  if (!formSchema.questions || !Array.isArray(formSchema.questions) || formSchema.questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <CardDescription>{cleanDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>This form has no questions defined.</p>
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
            <CardTitle>{task.title}</CardTitle>
            <CardDescription>{cleanDescription}</CardDescription>
          </div>
          <Badge variant="outline">Form Task</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {formSchema.questions.map((question, index) => (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.id}>
              {index + 1}. {question.text}
            </Label>

            {question.type === "open" && (
              <Textarea
                id={question.id}
                placeholder="Enter your answer..."
                value={formData[question.id] || ""}
                onChange={(e) => handleFieldChange(question.id, e.target.value)}
                rows={3}
              />
            )}

            {question.type === "close" && question.options && question.options.length > 0 && (
              <div className="space-y-2">
                {question.options.map((option) => {
                  const selected = (formData[question.id] as string) === option

                  return (
                    <label key={option} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={selected}
                        onChange={() => handleFieldChange(question.id, option)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  )
                })}
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
