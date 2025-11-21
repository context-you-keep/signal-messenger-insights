import { ArrowLeft, MessageSquare, TrendingUp, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { headers } from "next/headers"

export const dynamic = 'force-dynamic'

async function fetchStats(id: string) {
  // Get the host from headers to construct the API URL
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  // Check x-forwarded-proto header for reverse proxy setups, default to http for local
  const forwardedProto = headersList.get('x-forwarded-proto')
  const protocol = forwardedProto || 'http'

  try {
    const response = await fetch(`${protocol}://${host}/api/stats/${id}`, {
      cache: 'no-store',
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
  return null
}

async function fetchConversations() {
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const forwardedProto = headersList.get('x-forwarded-proto')
  const protocol = forwardedProto || 'http'

  try {
    const response = await fetch(`${protocol}://${host}/api/conversations`, {
      cache: 'no-store',
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
  }
  return []
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch stats via API (shares global DB state with API routes)
  const [stats, conversations] = await Promise.all([
    fetchStats(id),
    fetchConversations(),
  ])

  // Find the conversation name
  const conversation = conversations.find((c: any) => c.id === id)
  const conversationName = conversation?.name || "Unknown"

  // Use real data or fallbacks (total = sent + received)
  const sentMessages = stats?.sentMessages ?? 0
  const receivedMessages = stats?.receivedMessages ?? 0
  const totalMessages = stats?.totalMessages ?? (sentMessages + receivedMessages)

  // Format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    } catch {
      return "N/A"
    }
  }

  const firstMessageDate = formatDate(stats?.firstMessageDate)
  const lastMessageDate = formatDate(stats?.lastMessageDate)

  // Calculate duration and average
  let durationText = "N/A"
  let avgPerDay = "N/A"

  if (stats?.firstMessageDate && stats?.lastMessageDate) {
    const first = new Date(stats.firstMessageDate)
    const last = new Date(stats.lastMessageDate)
    const diffMs = last.getTime() - first.getTime()
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    if (diffDays === 1) {
      durationText = "1 day"
    } else if (diffDays < 30) {
      durationText = `${diffDays} days`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      durationText = months === 1 ? "1 month" : `${months} months`
    } else {
      const years = Math.floor(diffDays / 365)
      const remainingMonths = Math.floor((diffDays % 365) / 30)
      durationText = years === 1 ? "1 year" : `${years} years`
      if (remainingMonths > 0) {
        durationText += `, ${remainingMonths} months`
      }
    }

    const avg = Math.round(totalMessages / diffDays)
    avgPerDay = `${avg} messages`
  }

  return (
    <div className="min-h-screen bg-[var(--signal-bg-primary)] text-[var(--signal-text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/viewer"
              className="flex items-center gap-2 text-[var(--signal-text-tertiary)] hover:text-[var(--signal-blue)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Chat</span>
            </Link>
            <Separator orientation="vertical" className="h-6 bg-[var(--signal-divider)]" />
            <div>
              <h1 className="text-xl font-semibold">Statistics</h1>
              <p className="text-sm text-[var(--signal-text-tertiary)]">{conversationName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
          {/* Message Overview */}
          <Card className="border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-[var(--signal-blue)]/10 p-3">
                <MessageSquare className="h-6 w-6 text-[var(--signal-blue)]" />
              </div>
              <h2 className="text-lg font-semibold">Message Overview</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Total messages</p>
                <p className="text-3xl font-bold text-[var(--signal-text-primary)]">{totalMessages.toLocaleString()}</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">From you</p>
                  <p className="text-2xl font-semibold text-[var(--signal-blue)]">{sentMessages.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">From them</p>
                  <p className="text-2xl font-semibold text-[var(--signal-text-primary)]">{receivedMessages.toLocaleString()}</p>
                </div>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-2">Balance</p>
                <div className="flex gap-1">
                  {totalMessages > 0 ? (
                    <>
                      <div
                        className="h-2 rounded-full bg-[var(--signal-blue)]"
                        style={{ width: `${(sentMessages / totalMessages) * 100}%` }}
                      />
                      <div
                        className="h-2 rounded-full bg-[var(--signal-text-tertiary)]"
                        style={{ width: `${(receivedMessages / totalMessages) * 100}%` }}
                      />
                    </>
                  ) : (
                    <div className="h-2 w-full rounded-full bg-[var(--signal-divider)]" />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-[var(--signal-blue)]/10 p-3">
                <Calendar className="h-6 w-6 text-[var(--signal-blue)]" />
              </div>
              <h2 className="text-lg font-semibold">Timeline</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">First message</p>
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">{firstMessageDate}</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Latest message</p>
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">{lastMessageDate}</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Duration</p>
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">{durationText}</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Average per day</p>
                <p className="text-lg font-medium text-[var(--signal-blue)]">{avgPerDay}</p>
              </div>
            </div>
          </Card>

          {/* Activity Patterns */}
          <Card className="border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-[var(--signal-blue)]/10 p-3">
                <Clock className="h-6 w-6 text-[var(--signal-blue)]" />
              </div>
              <h2 className="text-lg font-semibold">Activity Patterns</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Most active time</p>
                <p className="text-sm text-[var(--signal-text-secondary)]">Coming soon...</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Most active day</p>
                <p className="text-sm text-[var(--signal-text-secondary)]">Coming soon...</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Average response time</p>
                <p className="text-sm text-[var(--signal-text-secondary)]">Coming soon...</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Longest conversation</p>
                <p className="text-sm text-[var(--signal-text-secondary)]">Coming soon...</p>
              </div>
            </div>
          </Card>

          {/* AI-Enhanced Insights - Full Width */}
          <Card className="border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)] p-6 md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-[var(--signal-blue)]/10 p-3">
                <TrendingUp className="h-6 w-6 text-[var(--signal-blue)]" />
              </div>
              <h2 className="text-lg font-semibold">AI-Powered Insights</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-[var(--signal-text-tertiary)] mb-2">
                  Communication Style Analysis
                </p>
                <p className="text-sm text-[var(--signal-text-secondary)] leading-relaxed">
                  Analysis pending... This will show communication patterns and conversational dynamics.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--signal-text-tertiary)] mb-2">Emotional Tone Trends</p>
                <p className="text-sm text-[var(--signal-text-secondary)] leading-relaxed">
                  Analysis pending... This will display emotional sentiment patterns over time.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--signal-text-tertiary)] mb-2">Main Conversation Topics</p>
                <p className="text-sm text-[var(--signal-text-secondary)] leading-relaxed">
                  Analysis pending... This will identify and categorize key discussion themes.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
