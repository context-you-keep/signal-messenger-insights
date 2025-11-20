import { useState, useRef } from 'react'
import { apiClient } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileJson, Database, Info, Loader2 } from 'lucide-react'

interface UploadFormProps {
  onUploadSuccess: () => void
}

// Known Signal Desktop locations by platform
const SIGNAL_PATHS = {
  linux: '~/.config/Signal/',
  macos: '~/Library/Application Support/Signal/',
  windows: '%AppData%\\Signal\\',
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [configFile, setConfigFile] = useState<File | null>(null)
  const [dbFile, setDbFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const configInputRef = useRef<HTMLInputElement>(null)
  const dbInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!configFile || !dbFile) {
      setError('Please select both files')
      return
    }

    setUploading(true)

    try {
      const response = await apiClient.uploadFiles(configFile, dbFile)
      setSuccess(response.message)
      onUploadSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-3xl font-bold">Signal Archive Viewer</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Privacy First
          </Badge>
        </div>
        <CardDescription className="text-base">
          Browse your Signal message history. All processing happens locally - your data never leaves your machine.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="flex gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Quick Setup</p>
            <p>Upload your Signal Desktop files below. The browser file picker will attempt to navigate to your Signal directory automatically.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Config File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <div className="flex items-center gap-2 mb-2">
                <FileJson className="w-4 h-4 text-muted-foreground" />
                <span>config.json</span>
              </div>
            </label>
            <div
              className="relative border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => configInputRef.current?.click()}
            >
              <input
                ref={configInputRef}
                type="file"
                accept=".json"
                onChange={(e) => setConfigFile(e.target.files?.[0] || null)}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                {configFile ? (
                  <>
                    <FileJson className="w-8 h-8 text-primary" />
                    <p className="text-sm font-medium">{configFile.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to browse for config.json</p>
                    <p className="text-xs text-muted-foreground">Located in your Signal Desktop directory</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Database File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span>db.sqlite</span>
              </div>
            </label>
            <div
              className="relative border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => dbInputRef.current?.click()}
            >
              <input
                ref={dbInputRef}
                type="file"
                accept=".sqlite,.db"
                onChange={(e) => setDbFile(e.target.files?.[0] || null)}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                {dbFile ? (
                  <>
                    <Database className="w-8 h-8 text-primary" />
                    <p className="text-sm font-medium">{dbFile.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to browse for db.sqlite</p>
                    <p className="text-xs text-muted-foreground">Located in the sql/ subdirectory</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              <p className="text-sm font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-lg">
              <p className="text-sm font-medium">Success</p>
              <p className="text-sm mt-1">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={uploading || !configFile || !dbFile}
            className="w-full h-11"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Database...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Load Signal Database
              </>
            )}
          </Button>
        </form>

        {/* File Locations Reference */}
        <div className="pt-6 border-t space-y-3">
          <p className="text-sm font-semibold">Signal Desktop Locations:</p>
          <div className="grid gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
              <Badge variant="outline" className="font-mono">Linux</Badge>
              <code className="text-muted-foreground">{SIGNAL_PATHS.linux}</code>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
              <Badge variant="outline" className="font-mono">macOS</Badge>
              <code className="text-muted-foreground">{SIGNAL_PATHS.macos}</code>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
              <Badge variant="outline" className="font-mono">Windows</Badge>
              <code className="text-muted-foreground">{SIGNAL_PATHS.windows}</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
