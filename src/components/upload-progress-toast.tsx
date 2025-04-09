import { Progress } from "~/components/ui/progress"
import { X, CheckCircle2 } from "lucide-react"
import { Button } from "~/components/ui/button"

interface UploadProgressToastProps {
  files: Array<{
    name: string
    progress: number
    error?: string
  }>
  totalFiles: number
  isComplete?: boolean
  onRemove: (fileName: string) => void
}

export function UploadProgressToast({ files, totalFiles, isComplete, onRemove }: UploadProgressToastProps) {
  if (files.length === 0 && !isComplete) return null

  const completedFiles = files.filter(f => f.progress === 100).length
  const hasErrors = files.some(f => f.error)

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border rounded-lg shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        {isComplete ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <h3 className="font-medium">
              {hasErrors 
                ? `Uploaded ${completedFiles} of ${totalFiles} files`
                : `Successfully uploaded ${totalFiles} files`}
            </h3>
          </div>
        ) : (
          <h3 className="font-medium">Uploading {totalFiles} {totalFiles === 1 ? 'file' : 'files'}</h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => files.forEach(file => onRemove(file.name))}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {files.map((file) => (
          <div key={file.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate flex-1">{file.name}</span>
              <span className="ml-2 text-muted-foreground">{file.progress}%</span>
            </div>
            <Progress value={file.progress} className="h-1" />
            {file.error && (
              <p className="text-xs text-destructive">{file.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 