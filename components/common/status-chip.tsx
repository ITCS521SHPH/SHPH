import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react"

interface StatusChipProps {
  status: "pending" | "approved" | "rejected" | "draft"
  size?: "sm" | "default" | "lg"
  showIcon?: boolean
}

export function StatusChip({ status, size = "default", showIcon = true }: StatusChipProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          variant: "default" as const,
          label: "Approved",
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-200",
        }
      case "rejected":
        return {
          variant: "destructive" as const,
          label: "Rejected",
          icon: XCircle,
          className: "bg-red-100 text-red-800 border-red-200",
        }
      case "pending":
        return {
          variant: "secondary" as const,
          label: "Pending",
          icon: Clock,
          className: "bg-orange-100 text-orange-800 border-orange-200",
        }
      case "draft":
        return {
          variant: "outline" as const,
          label: "Draft",
          icon: FileText,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        }
      default:
        return {
          variant: "outline" as const,
          label: status,
          icon: FileText,
          className: "",
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`${config.className} ${size === "sm" ? "text-xs px-2 py-0.5" : ""}`}>
      {showIcon && <Icon className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} mr-1`} />}
      {config.label}
    </Badge>
  )
}
