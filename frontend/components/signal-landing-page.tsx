"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Shield,
  CheckCircle,
  FileJson,
  Database,
  Info,
  ExternalLink,
  Download,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  HelpCircle,
} from "lucide-react"
import { KeyExtractionHelper } from "@/components/key-extraction-helper"

export function SignalLandingPage() {
  const router = useRouter()
  const [configFile, setConfigFile] = useState<File | null>(null)
  const [dbFile, setDbFile] = useState<File | null>(null)
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [encryptedKeyValue, setEncryptedKeyValue] = useState("")
  const [extractedKey, setExtractedKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dragOver, setDragOver] = useState<"config" | "db" | null>(null)
  const [copiedPath, setCopiedPath] = useState<"linux" | "macos" | "windows" | null>(null)
  const [showKeyHelper, setShowKeyHelper] = useState(false)

  const handleConfigUpload = async (file: File) => {
    setConfigFile(file)

    // Check if config contains encrypted key
    const text = await file.text()
    try {
      const config = JSON.parse(text)
      const encrypted = !!config.encryptedKey
      setIsEncrypted(encrypted)
      if (encrypted) {
        setEncryptedKeyValue(config.encryptedKey)
      }
    } catch (e) {
      console.error("Error parsing config:", e)
    }
  }

  const handleDbUpload = (file: File) => {
    setDbFile(file)
  }

  const handleDrop = (e: React.DragEvent, type: "config" | "db") => {
    e.preventDefault()
    setDragOver(null)
    const file = e.dataTransfer.files[0]
    if (file) {
      if (type === "config") {
        handleConfigUpload(file)
      } else {
        handleDbUpload(file)
      }
    }
  }


  const copyToClipboard = async (text: string, os: "linux" | "macos" | "windows") => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedPath(os)
      setTimeout(() => setCopiedPath(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      // Still show feedback even if copy failed
      setCopiedPath(os)
      setTimeout(() => setCopiedPath(null), 2000)
    }
  }

  const handleLoadDatabase = async () => {
    if (!configFile || !dbFile) return

    setIsLoading(true)

    try {
      // Create FormData to upload files
      const formData = new FormData()
      formData.append("config", configFile)
      formData.append("database", dbFile)

      // Include extracted key if user pasted one (for encrypted configs)
      if (extractedKey.trim()) {
        formData.append("extractedKey", extractedKey.trim())
      }

      // Call upload API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      console.log(`Successfully loaded ${data.conversationCount} conversations`)

      // Navigate to viewer
      router.push("/viewer")
    } catch (error) {
      console.error("Failed to load database:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Upload failed"}`)
      setIsLoading(false)
    }
  }

  const canLoadDatabase = configFile && dbFile && (!isEncrypted || extractedKey.trim().length > 0)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-signal-bg via-signal-surface to-signal-bg">
      <Card className="w-full max-w-2xl border-signal-border/20 bg-signal-surface/95 backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-foreground">Signal Messenger Insights</CardTitle>
          </div>
          <CardDescription className="text-base text-muted-foreground">
            Browse your Signal message history. All processing happens locally - your data never leaves your machine.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Config File Upload */}
            <div
              onDrop={(e) => handleDrop(e, "config")}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver("config")
              }}
              onDragLeave={() => setDragOver(null)}
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragOver === "config"
                  ? "border-signal-blue bg-signal-blue/5"
                  : "border-signal-border/40 hover:border-signal-border/60"
              }`}
            >
              <input
                type="file"
                accept=".json"
                onChange={(e) => e.target.files?.[0] && handleConfigUpload(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <FileJson className="h-8 w-8 text-signal-blue" />
                <div className="text-sm font-medium text-foreground">config.json</div>
                {configFile ? (
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {configFile.name}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Drop or click to upload</div>
                )}
              </div>
            </div>

            {/* Database File Upload */}
            <div
              onDrop={(e) => handleDrop(e, "db")}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver("db")
              }}
              onDragLeave={() => setDragOver(null)}
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragOver === "db"
                  ? "border-signal-blue bg-signal-blue/5"
                  : "border-signal-border/40 hover:border-signal-border/60"
              }`}
            >
              <input
                type="file"
                accept=".sqlite,.db"
                onChange={(e) => e.target.files?.[0] && handleDbUpload(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <Database className="h-8 w-8 text-signal-blue" />
                <div className="text-sm font-medium text-foreground">db.sqlite</div>
                {dbFile ? (
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {dbFile.name}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Drop or click to upload</div>
                )}
              </div>
            </div>
          </div>

          {/* Encrypted Config Detection */}
          {isEncrypted && (
            <Alert className="border-amber-500/20 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Encrypted Configuration Detected</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your Signal data is encrypted for security. To view your messages, we need to decrypt the database
                    key.
                  </p>

                  <Button
                    onClick={() => setShowKeyHelper(true)}
                    variant="outline"
                    className="mb-4 border-signal-blue/30 hover:bg-signal-blue/10"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Need Help Extracting Your Key?
                  </Button>

                  <div className="bg-signal-surface rounded-lg p-4 mb-4 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                      <Shield className="h-4 w-4" />
                      <span className="font-semibold text-sm">Your Privacy is Protected:</span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        <span>All decryption happens on YOUR computer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        <span>No data is sent to any server</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        <span>Processing is 100% local</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-semibold text-foreground">One-Time Setup (takes 30 seconds)</h5>

                    {/* Step 1: Run command */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-signal-blue text-white text-xs">
                          1
                        </div>
                        Run this command on your computer
                      </div>

                      {/* Linux Command */}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Linux:</div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-signal-bg rounded-lg p-3 font-mono text-xs text-muted-foreground border border-signal-border/40 overflow-x-auto">
                            bash &lt;(curl -sL {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/scripts/extract-signal-key.sh) | xclip -selection clipboard
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`bash <(curl -sL ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/scripts/extract-signal-key.sh) | xclip -selection clipboard`, "linux")}
                            className="h-auto px-3 hover:bg-signal-blue/10"
                          >
                            {copiedPath === "linux" ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* macOS Command */}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">macOS:</div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-signal-bg rounded-lg p-3 font-mono text-xs text-muted-foreground border border-signal-border/40 overflow-x-auto">
                            bash &lt;(curl -sL {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/scripts/extract-signal-key-macos.sh) | pbcopy
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`bash <(curl -sL ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/scripts/extract-signal-key-macos.sh) | pbcopy`, "macos")}
                            className="h-auto px-3 hover:bg-signal-blue/10"
                          >
                            {copiedPath === "macos" ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        ✓ This command extracts your key and copies it to clipboard automatically
                      </p>
                    </div>

                    {/* Step 2: Paste */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-signal-blue text-white text-xs">
                          2
                        </div>
                        Paste the key here (Ctrl+V / Cmd+V)
                      </div>
                      <Textarea
                        value={extractedKey}
                        onChange={(e) => setExtractedKey(e.target.value)}
                        placeholder="Paste the encryption key here..."
                        className="font-mono text-sm min-h-[100px] bg-signal-bg border-signal-border/40"
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-signal-border/40">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="why" className="border-none">
                        <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-2">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Why is this needed?
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          Signal encrypts your database using your system's keyring (Keychain on Mac, Keyring on Linux).
                          Web browsers can't access this for security reasons, so we need you to extract it manually
                          using a simple Python script that runs on your computer.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <ExternalLink className="h-3 w-3" />
                      <a href="#" className="hover:text-signal-blue transition-colors">
                        Open Source: View the decryption script source on GitHub
                      </a>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Load Button */}
          <Button
            onClick={handleLoadDatabase}
            disabled={!canLoadDatabase || isLoading}
            className="w-full bg-signal-blue hover:bg-signal-blue/90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isEncrypted ? (
              "Decrypt & Load Messages"
            ) : (
              "Load Signal Database"
            )}
          </Button>

          <div className="rounded-lg bg-signal-bg border border-signal-border/40 p-4">
            <div className="text-sm font-medium text-foreground mb-3">Signal Desktop Locations:</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-medium text-muted-foreground min-w-[80px]">Linux</span>
                <code className="flex-1 text-foreground font-mono bg-signal-surface px-2 py-1 rounded">
                  ~/.config/Signal/
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("~/.config/Signal/", "linux")}
                  className="h-8 w-8 p-0 hover:bg-signal-blue/10"
                >
                  {copiedPath === "linux" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-muted-foreground min-w-[80px]">macOS</span>
                <code className="flex-1 text-foreground font-mono bg-signal-surface px-2 py-1 rounded">
                  ~/Library/Application Support/Signal/
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("~/Library/Application Support/Signal/", "macos")}
                  className="h-8 w-8 p-0 hover:bg-signal-blue/10"
                >
                  {copiedPath === "macos" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-muted-foreground min-w-[80px]">Windows</span>
                <code className="flex-1 text-foreground font-mono bg-signal-surface px-2 py-1 rounded">
                  %AppData%\Signal\
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("%AppData%\\Signal\\", "windows")}
                  className="h-8 w-8 p-0 hover:bg-signal-blue/10"
                >
                  {copiedPath === "windows" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Extraction Helper Dialog */}
      <KeyExtractionHelper
        open={showKeyHelper}
        onOpenChange={setShowKeyHelper}
        encryptedKey={encryptedKeyValue}
        onKeyExtracted={(plainKey) => {
          setExtractedKey(plainKey)
          setShowKeyHelper(false)
        }}
      />
    </div>
  )
}
