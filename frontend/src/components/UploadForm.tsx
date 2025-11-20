import { useState } from 'react'
import { apiClient } from '@/services/api'

interface UploadFormProps {
  onUploadSuccess: () => void
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [configFile, setConfigFile] = useState<File | null>(null)
  const [dbFile, setDbFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Signal Archive Viewer
      </h1>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Upload your Signal Desktop files to browse your message history.
          All processing happens locally in your browser. Your data never leaves your machine.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            config.json
          </label>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setConfigFile(e.target.files?.[0] || null)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={uploading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Located in your Signal Desktop directory
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            db.sqlite
          </label>
          <input
            type="file"
            accept=".sqlite,.db"
            onChange={(e) => setDbFile(e.target.files?.[0] || null)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={uploading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Located in the sql/ subdirectory
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900 text-red-900 dark:text-red-100 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900 text-green-900 dark:text-green-100 rounded">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !configFile || !dbFile}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded transition-colors"
        >
          {uploading ? 'Loading...' : 'Load Signal Database'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t dark:border-gray-700">
        <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
          Where to find your files:
        </h2>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li><strong>Linux:</strong> ~/.config/Signal/</li>
          <li><strong>macOS:</strong> ~/Library/Application Support/Signal/</li>
          <li><strong>Windows:</strong> %AppData%\Signal\</li>
        </ul>
      </div>
    </div>
  )
}
