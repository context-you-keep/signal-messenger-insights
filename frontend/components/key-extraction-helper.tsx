'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Eye, EyeOff, AlertTriangle, CheckCircle2, Terminal } from 'lucide-react'

interface KeyExtractionHelperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  encryptedKey?: string
  onKeyExtracted?: (plainKey: string) => void
}

type OS = 'linux' | 'macos' | 'windows'

export function KeyExtractionHelper({
  open,
  onOpenChange,
  encryptedKey = '',
  onKeyExtracted
}: KeyExtractionHelperProps) {
  const [selectedOS, setSelectedOS] = useState<OS>('linux')
  const [extractedKey, setExtractedKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [copiedCommand, setCopiedCommand] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [step, setStep] = useState<'guide' | 'extracted'>('guide')

  // Auto-detect OS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const platform = window.navigator.platform.toLowerCase()
      if (platform.includes('mac')) setSelectedOS('macos')
      else if (platform.includes('win')) setSelectedOS('windows')
      else setSelectedOS('linux')
    }
  }, [])

  // Auto-clear timer
  useEffect(() => {
    if (step === 'extracted' && extractedKey && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleClear()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, extractedKey, timeRemaining])

  const getExtractionCommand = (os: OS) => {
    const commands = {
      linux: `secret-tool lookup application signal`,
      macos: `security find-generic-password -ws "Signal Safe Storage"`,
      windows: `# Windows DPAPI decryption requires advanced tools - see instructions below`
    }
    return commands[os]
  }

  const getSignalPath = (os: OS) => {
    const paths = {
      linux: '~/.config/Signal/',
      macos: '~/Library/Application Support/Signal/',
      windows: '%AppData%\\Signal\\'
    }
    return paths[os]
  }

  const copyToClipboard = async (text: string) => {
    try {
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
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleCopyCommand = async () => {
    await copyToClipboard(getExtractionCommand(selectedOS))
    setCopiedCommand(true)
    setTimeout(() => setCopiedCommand(false), 2000)
  }

  const handleCopyKey = async () => {
    await copyToClipboard(extractedKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleExtractKey = () => {
    // In real implementation, this would come from user input
    // For now, simulating extraction
    if (extractedKey.trim()) {
      setStep('extracted')
      setTimeRemaining(30)
      setShowKey(false)
    }
  }

  const handleUseKey = () => {
    if (onKeyExtracted && extractedKey) {
      onKeyExtracted(extractedKey)
      handleClear()
      onOpenChange(false)
    }
  }

  const handleClear = () => {
    setExtractedKey('')
    setShowKey(false)
    setTimeRemaining(30)
    setStep('guide')
    setCopiedCommand(false)
    setCopiedKey(false)
  }

  const handleClose = () => {
    handleClear()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-signal-blue" />
            Extract Signal Encryption Key
          </DialogTitle>
          <DialogDescription>
            {step === 'guide'
              ? 'Follow these steps to safely extract your decryption key'
              : 'Your key has been extracted successfully'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'guide' && (
          <div className="space-y-6">
            <Alert className="border-amber-500/20 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> The encrypted key can only be decrypted on the machine where Signal Desktop was installed and used.
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-sm font-medium mb-3 block">Select Your Operating System</Label>
              <Tabs value={selectedOS} onValueChange={(v) => setSelectedOS(v as OS)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="linux">Linux</TabsTrigger>
                  <TabsTrigger value="macos">macOS</TabsTrigger>
                  <TabsTrigger value="windows">Windows</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedOS} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Step 1: Navigate to Signal Directory</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`cd ${getSignalPath(selectedOS)}`}
                        readOnly
                        className="font-mono text-sm bg-signal-surface"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await copyToClipboard(`cd ${getSignalPath(selectedOS)}`)
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Step 2: Run Command to Extract Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getExtractionCommand(selectedOS)}
                        readOnly
                        className="font-mono text-xs bg-signal-surface"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyCommand}
                      >
                        {copiedCommand ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    {selectedOS === 'macos' && (
                      <p className="text-xs text-emerald-400">
                        ✓ This command is built into macOS - no installation needed!
                      </p>
                    )}
                    {selectedOS === 'linux' && (
                      <p className="text-xs text-amber-400">
                        ⚠ Requires secret-tool: sudo apt install libsecret-tools
                      </p>
                    )}
                    {selectedOS === 'windows' && (
                      <p className="text-xs text-muted-foreground">
                        Windows DPAPI decryption is complex. Consider using a Windows-specific tool or exporting from a Mac/Linux system.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Step 3: Paste the Decryption Key</Label>
                    <Input
                      type="text"
                      placeholder="Paste the key from terminal output here..."
                      value={extractedKey}
                      onChange={(e) => setExtractedKey(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      The output will be a long hexadecimal string (64 characters).
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleExtractKey}
                      disabled={!extractedKey.trim()}
                      className="flex-1 bg-signal-blue hover:bg-signal-blue/90"
                    >
                      Continue with This Key
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {step === 'extracted' && (
          <div className="space-y-6">
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Key extracted successfully and copied to clipboard
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Your Decryption Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={extractedKey}
                  readOnly
                  className="font-mono text-sm pr-24 bg-signal-surface"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowKey(!showKey)}
                    className="h-7 px-2"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyKey}
                    className="h-7 px-2"
                  >
                    {copiedKey ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Alert className="border-amber-500/20 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="space-y-2">
                <p className="text-sm">
                  <strong>Security Notice:</strong> This key will be automatically cleared in {timeRemaining} seconds.
                </p>
                <p className="text-xs text-muted-foreground">
                  Store this key securely. Do not share it with anyone or save it in plaintext.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUseKey}
                className="flex-1 bg-signal-blue hover:bg-signal-blue/90"
              >
                Use This Key Now
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Clear & Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
