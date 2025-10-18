"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Heart, Activity, Brain, Utensils, Moon, Dumbbell } from "lucide-react"

type Resource = {
  title: string
  description: string
  url: string
  category: string
  icon: React.ReactNode
}

const resources: Resource[] = [
  {
    title: "WHO Health Topics",
    description: "Comprehensive health information from the World Health Organization",
    url: "https://www.who.int/health-topics",
    category: "General Health",
    icon: <Heart className="h-5 w-5" />,
  },
  {
    title: "CDC Health Information",
    description: "Trusted health information and disease prevention guidelines",
    url: "https://www.cdc.gov/health-topics.html",
    category: "Disease Prevention",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    title: "Mental Health Resources",
    description: "Mental health support and wellness information",
    url: "https://www.mentalhealth.gov",
    category: "Mental Health",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: "Nutrition Guidelines",
    description: "Evidence-based nutrition and dietary recommendations",
    url: "https://www.nutrition.gov",
    category: "Nutrition",
    icon: <Utensils className="h-5 w-5" />,
  },
  {
    title: "Sleep Foundation",
    description: "Expert guidance on sleep health and sleep disorders",
    url: "https://www.sleepfoundation.org",
    category: "Sleep Health",
    icon: <Moon className="h-5 w-5" />,
  },
  {
    title: "Exercise Guidelines",
    description: "Physical activity recommendations for all ages",
    url: "https://health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
    category: "Physical Activity",
    icon: <Dumbbell className="h-5 w-5" />,
  },
  {
    title: "Diabetes Self-Management",
    description: "Resources for managing diabetes and blood sugar",
    url: "https://www.diabetes.org/diabetes",
    category: "Chronic Conditions",
    icon: <Heart className="h-5 w-5" />,
  },
  {
    title: "Heart Health Information",
    description: "Cardiovascular health and heart disease prevention",
    url: "https://www.heart.org",
    category: "Chronic Conditions",
    icon: <Heart className="h-5 w-5" />,
  },
]

const categories = Array.from(new Set(resources.map((r) => r.category)))

export function SelfCareResources() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Health & Wellness Resources</CardTitle>
          <CardDescription>
            Trusted external resources to help you learn about health conditions and self-care
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline">{category}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources
                    .filter((r) => r.category === category)
                    .map((resource, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">{resource.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{resource.title}</h4>
                              <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                              <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2"
                                >
                                  Visit Resource
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Important Note</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                These resources are for educational purposes only and should not replace professional medical advice.
                Always consult with your healthcare provider before making any changes to your treatment plan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
