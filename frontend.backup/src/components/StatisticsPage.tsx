import { ArrowLeft, MessageSquare, TrendingUp, Clock, Calendar } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/services/api"

export function StatisticsPage() {
  const navigate = useNavigate()
  const { conversationId } = useParams<{ conversationId: string }>()

  // Fetch conversation details
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.getConversations(100),
  })

  // Fetch all messages for this conversation (paginate through all)
  const { data: messagesData } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => apiClient.getMessages(conversationId!, 1, 500),
    enabled: !!conversationId,
  })

  const conversation = conversations?.find(c => c.id === conversationId)

  if (!conversation || !messagesData) {
    return (
      <div className="min-h-screen bg-[var(--signal-bg-primary)] flex items-center justify-center">
        <div className="text-[var(--signal-text-primary)]">Loading statistics...</div>
      </div>
    )
  }

  // Calculate statistics
  const totalMessages = messagesData.total
  const messages = messagesData.messages
  const sentMessages = messages.filter(m => m.sent).length
  const receivedMessages = messages.filter(m => !m.sent).length

  // Calculate timeline data
  const timestamps = messages.map(m => new Date(m.timestamp).getTime()).sort((a, b) => a - b)
  const firstMessageDate = timestamps.length > 0
    ? new Date(timestamps[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'N/A'
  const lastMessageDate = timestamps.length > 0
    ? new Date(timestamps[timestamps.length - 1]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'N/A'

  // Calculate duration
  const durationMs = timestamps.length > 1 ? timestamps[timestamps.length - 1] - timestamps[0] : 0
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24))
  const averagePerDay = durationDays > 0 ? Math.round(totalMessages / durationDays) : 0

  // Calculate activity patterns
  const hourCounts = new Array(24).fill(0)
  const dayCounts = new Array(7).fill(0)
  messages.forEach(m => {
    const date = new Date(m.timestamp)
    hourCounts[date.getHours()]++
    dayCounts[date.getDay()]++
  })

  const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))
  const mostActiveDay = dayCounts.indexOf(Math.max(...dayCounts))
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="min-h-screen bg-[var(--signal-bg-primary)] text-[var(--signal-text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[var(--signal-text-tertiary)] hover:text-[var(--signal-blue)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Chat</span>
            </button>
            <Separator orientation="vertical" className="h-6 bg-[var(--signal-divider)]" />
            <div>
              <h1 className="text-xl font-semibold">Statistics</h1>
              <p className="text-sm text-[var(--signal-text-tertiary)]">{conversation.name || 'Unknown'}</p>
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
                <div className="flex gap-2">
                  <div
                    className="h-2 rounded-full bg-[var(--signal-blue)]"
                    style={{ width: `${totalMessages > 0 ? (sentMessages / totalMessages) * 100 : 50}%` }}
                  />
                  <div
                    className="h-2 rounded-full bg-[var(--signal-text-tertiary)]"
                    style={{ width: `${totalMessages > 0 ? (receivedMessages / totalMessages) * 100 : 50}%` }}
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
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">
                  {durationDays > 0 ? `${durationDays.toLocaleString()} ${durationDays === 1 ? 'day' : 'days'}` : 'N/A'}
                </p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Average per day</p>
                <p className="text-lg font-medium text-[var(--signal-blue)]">
                  {averagePerDay > 0 ? `${averagePerDay.toLocaleString()} messages` : 'N/A'}
                </p>
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
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">
                  {mostActiveHour > 0 ? `${mostActiveHour % 12 || 12}:00 ${mostActiveHour >= 12 ? 'PM' : 'AM'}` : 'N/A'}
                </p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Most active day</p>
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">
                  {dayNames[mostActiveDay]}
                </p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Messages analyzed</p>
                <p className="text-lg font-medium text-[var(--signal-blue)]">
                  {messages.length.toLocaleString()} of {totalMessages.toLocaleString()}
                </p>
              </div>

              <Separator className="bg-[var(--signal-divider)]" />

              <div>
                <p className="text-sm text-[var(--signal-text-tertiary)] mb-1">Response time</p>
                <p className="text-lg font-medium text-[var(--signal-text-primary)]">Coming soon</p>
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
