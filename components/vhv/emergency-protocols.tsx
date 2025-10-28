"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Phone,
  AlertTriangle,
  Clock,
  Package,
  ChevronRight,
  ArrowLeft,
  Video,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { EMERGENCY_PROTOCOLS, PROTOCOL_CATEGORIES, EMERGENCY_HOTLINE, type EmergencyProtocol } from "@/lib/protocols"

interface EmergencyProtocolsProps {
  patientId?: string
  patientName?: string
}

export function EmergencyProtocols({ patientId, patientName }: EmergencyProtocolsProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<EmergencyProtocol | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [currentStep, setCurrentStep] = useState(0)

  const filteredProtocols = EMERGENCY_PROTOCOLS.filter((protocol) => {
    const matchesSearch =
      protocol.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || protocol.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleEmergencyCall = () => {
    const patientInfo =
      patientId && patientName
        ? `Patient: ${patientName} (ID: ${patientId})\nProtocol: ${selectedProtocol?.title || "General Emergency"}`
        : `Protocol: ${selectedProtocol?.title || "General Emergency"}`

    console.log("[v0] Emergency call initiated:", patientInfo)
    alert(
      `📞 Calling Emergency Hotline ${EMERGENCY_HOTLINE}\n\n${patientInfo}\n\nIn a real system, this would:\n- Automatically dial emergency services\n- Send patient location and information\n- Alert nearby medical facilities`,
    )
  }

  if (selectedProtocol) {
    return (
      <div className="space-y-4">
        {/* Header with back button and emergency call */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedProtocol(null);
              setCurrentStep(0);
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Protocols
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleEmergencyCall}
            className="gap-2"
          >
            <Phone className="h-5 w-5" />
            Call {EMERGENCY_HOTLINE}
          </Button>
        </div>

        {/* Protocol header */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">
                    {selectedProtocol.title}
                  </CardTitle>
                  <Badge
                    variant={
                      selectedProtocol.severity === "critical"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {selectedProtocol.severity.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  {selectedProtocol.description}
                </CardDescription>
              </div>
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedProtocol.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedProtocol.requiredEquipment.length} items needed
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedProtocol.warningSignals.length} warning signs
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Warning signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Warning Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedProtocol.warningSignals.map((signal, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-sm">{signal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Required equipment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Required Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedProtocol.requiredEquipment.map((item, index) => (
                <Badge key={index} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Video guidance */}
        {/* {selectedProtocol.videoUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Guidance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <img
                  src={selectedProtocol.videoUrl || "/placeholder.svg"}
                  alt={`${selectedProtocol.title} demonstration`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        )} */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/7lMiXJH_bw4?si=f-WOq3fCDUzECf0Y"
                title="Video Guidance"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step-by-step instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
            <CardDescription>
              Follow these steps carefully. Read all critical notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProtocol.steps.map((step, index) => (
              <div key={step.stepNumber} className="space-y-2">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index <= currentStep
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.stepNumber
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-lg">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.instruction}
                    </p>
                    {step.criticalNote && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="font-medium">
                          {step.criticalNote}
                        </AlertDescription>
                      </Alert>
                    )}
                    {index === currentStep &&
                      index < selectedProtocol.steps.length - 1 && (
                        <Button
                          onClick={() => setCurrentStep(currentStep + 1)}
                          className="mt-2"
                        >
                          Next Step
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                  </div>
                </div>
                {index < selectedProtocol.steps.length - 1 && (
                  <Separator className="ml-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Emergency call button at bottom */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="font-semibold text-lg">Need immediate help?</p>
                <p className="text-sm text-muted-foreground">
                  Call emergency services if situation worsens
                </p>
              </div>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEmergencyCall}
                className="gap-2 w-full md:w-auto"
              >
                <Phone className="h-5 w-5" />
                Emergency Call {EMERGENCY_HOTLINE}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Emergency Protocols</h2>
        <p className="text-muted-foreground">Quick access to standardized emergency response procedures</p>
      </div>

      {/* Emergency call button */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg">Emergency Hotline</p>
                <p className="text-sm text-muted-foreground">Available 24/7 for immediate assistance</p>
              </div>
            </div>
            <Button variant="destructive" size="lg" onClick={handleEmergencyCall} className="gap-2 w-full md:w-auto">
              <Phone className="h-5 w-5" />
              Call {EMERGENCY_HOTLINE}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search protocols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All Protocols
          </Button>
          {PROTOCOL_CATEGORIES.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Protocol list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProtocols.map((protocol) => (
          <Card
            key={protocol.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedProtocol(protocol)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">{protocol.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{protocol.description}</CardDescription>
                </div>
                <Badge variant={protocol.severity === "critical" ? "destructive" : "default"} className="ml-2">
                  {protocol.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {protocol.estimatedTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {protocol.requiredEquipment.length} items
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  View Protocol
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProtocols.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No protocols found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
