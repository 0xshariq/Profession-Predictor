import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface GuestAlertProps {
  predictionsCount: number
  maxPredictions: number
}

export function GuestAlert({ predictionsCount, maxPredictions }: GuestAlertProps) {
  const remainingPredictions = maxPredictions - predictionsCount
  const progressPercentage = (predictionsCount / maxPredictions) * 100

  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        Guest User
        <Link href="/signUp">
          <Button variant="outline" size="sm">
            Sign Up Now
          </Button>
        </Link>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>
            You are using the app as a guest. You have used {predictionsCount} out of {maxPredictions} predictions.
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Predictions Used</span>
              <span>{remainingPredictions} remaining</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            Sign up for unlimited predictions and access to advanced features!
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}

