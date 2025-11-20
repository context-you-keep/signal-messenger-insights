import { ArrowLeft, MessageSquare, TrendingUp, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default async function StatsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Placeholder data - you'll replace this with actual conversation data
  const conversationName = "Sarah Chen"
  const totalMessages = 1247
  const sentMessages = 623
  const receivedMessages = 624
  const firstMessageDate = "Jan 15, 2024 10:30 AM"
  const lastMessageDate = "Jan 20, 2024 2:45 PM"

  return (
    <div className="min-h-screen bg-[var(--signal-bg-primary)] text-[var(--signal-text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
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
                <p className="text-3xl font-bold text-[var(--signal-text-primary)]">{totalMessages}</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">From you</p>
                  <p className="text-2xl font-semibold text-[var(--signal-blue)]">{sentMessages}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">From them</p>
                  <p className="text-2xl font-semibold text-[var(--signal-text-primary)]">{receivedMessages}</p>
                </div>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-2">Balance</p>
                <div className="flex gap-2">
                  <div
                    className="h-2 rounded-full bg-[var(--signal-blue)]"
                    style={{ width: `${(sentMessages / totalMessages) * 100}%` }}
                  />
                  <div
                    className="h-2 rounded-full bg-[var(--signal-text-tertiary)]"
                    style={{ width: `${(receivedMessages / totalMessages) * 100}%` }}
                  />
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
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">5 days</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Average per day</p>
                <p className="text-lg font-medium text-[var(--signal-blue)]">249 messages</p>
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
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">2:00 PM - 5:00 PM</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Most active day</p>
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">Wednesday</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Average response time</p>
                <p className="text-lg font-medium text-[var(--signal-blue)]">3 minutes</p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Longest conversation</p>
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">47 messages</p>
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
