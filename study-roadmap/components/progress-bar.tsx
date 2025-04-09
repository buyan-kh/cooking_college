interface ProgressBarProps {
  progress: number
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between">
        <span className="text-sm font-medium text-card-foreground">{progress}% Complete</span>
        <span className="text-sm font-medium text-muted-foreground">{progress}/100</span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}

