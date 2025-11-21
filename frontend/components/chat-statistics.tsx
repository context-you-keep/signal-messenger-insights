"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Sparkles, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { Conversation, Message } from "./signal-chat-archive"

interface ConversationStats {
  totalMessages: number
  sentMessages: number
  receivedMessages: number
  firstMessageDate: string | null
  lastMessageDate: string | null
  talkMorePercentage: number
}

interface ChatStatisticsProps {
  conversation: Conversation
  messages: Message[]
  totalMessages?: number
}

export function ChatStatistics({ conversation, messages, totalMessages: totalMessagesProp }: ChatStatisticsProps) {
  const [stats, setStats] = useState<ConversationStats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/stats/${conversation.id}`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }
    fetchStats()
  }, [conversation.id])

  // Use stats from API if available, otherwise fall back to counting loaded messages
  const sentMessages = stats?.sentMessages ?? messages.filter((m) => m.isSent).length
  const receivedMessages = stats?.receivedMessages ?? messages.filter((m) => !m.isSent).length
  const totalMessages = stats?.totalMessages ?? (sentMessages + receivedMessages)

  // Calculate who talks more
  const talkMorePercentage = stats?.talkMorePercentage ?? (totalMessages > 0 ? Math.round((sentMessages / totalMessages) * 100) : 50)
  const whoTalksMore = sentMessages > receivedMessages ? "You" : sentMessages < receivedMessages ? "Them" : "Equal"

  // Format dates
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A"
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
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

  const firstMessageDate = stats?.firstMessageDate ? formatDate(stats.firstMessageDate) : (messages.length > 0 ? "Loading..." : "N/A")
  const lastMessageDate = stats?.lastMessageDate ? formatDate(stats.lastMessageDate) : (messages.length > 0 ? "Loading..." : "N/A")

  return (
    <div className="flex w-80 flex-col border-l border-[var(--signal-divider)] bg-[var(--signal-bg-primary)]">
      <Link
        href={`/stats/${conversation.id}`}
        className="border-b border-[var(--signal-divider)] px-5 py-4 hover:bg-[var(--signal-bg-secondary)] transition-colors cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[var(--signal-text-primary)]">Statistics</h2>
            <p className="text-sm text-[var(--signal-text-tertiary)]">{conversation.name}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-[var(--signal-text-tertiary)] group-hover:text-[var(--signal-text-primary)] transition-colors" />
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Basic Statistics Box */}
        <Card className="border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)] p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-[var(--signal-blue)]/10 p-2">
              <MessageSquare className="h-5 w-5 text-[var(--signal-blue)]" />
            </div>
            <h3 className="font-semibold text-[var(--signal-text-primary)]">Chat Overview</h3>
          </div>

          <div className="space-y-3">
            {/* Total messages */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--signal-text-tertiary)]">Total messages</span>
              <span className="text-sm font-semibold text-[var(--signal-text-primary)]">{totalMessages}</span>
            </div>

            <Separator className="bg-[var(--signal-divider)]" />

            {/* Sent/Received breakdown */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--signal-text-tertiary)]">Messages from you</span>
              <span className="text-sm font-semibold text-[var(--signal-text-primary)]">{sentMessages}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--signal-text-tertiary)]">Messages from them</span>
              <span className="text-sm font-semibold text-[var(--signal-text-primary)]">{receivedMessages}</span>
            </div>

            <Separator className="bg-[var(--signal-divider)]" />

            {/* Who talks more */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--signal-text-tertiary)]">Who talks more?</span>
              <span className="text-sm font-semibold text-[var(--signal-blue)]">
                {whoTalksMore} ({talkMorePercentage}%)
              </span>
            </div>

            <Separator className="bg-[var(--signal-divider)]" />

            {/* First message */}
            <div>
              <p className="text-xs text-[var(--signal-text-tertiary)] mb-1">First message</p>
              <p className="text-sm font-medium text-[var(--signal-text-primary)]">{firstMessageDate}</p>
            </div>

            {/* Last message */}
            <div>
              <p className="text-xs text-[var(--signal-text-tertiary)] mb-1">Latest message</p>
              <p className="text-sm font-medium text-[var(--signal-text-primary)]">{lastMessageDate}</p>
            </div>
          </div>
        </Card>

        {/* AI-Enhanced Insights Box */}
        <Card className="border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)] p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-[var(--signal-blue)]/10 p-2">
              <Sparkles className="h-5 w-5 text-[var(--signal-blue)]" />
            </div>
            <h3 className="font-semibold text-[var(--signal-text-primary)]">AI Insights</h3>
          </div>

          <div className="space-y-3">
            {/* Communication style */}
            <div>
              <p className="text-xs text-[var(--signal-text-tertiary)] mb-1">Communication style</p>
              <p className="text-sm text-[var(--signal-text-secondary)] leading-relaxed">Analysis pending...</p>
            </div>

            <Separator className="bg-[var(--signal-divider)]" />

            {/* Emotional tone trends */}
            <div>
              <p className="text-xs text-[var(--signal-text-tertiary)] mb-1">Emotional tone trends</p>
              <p className="text-sm text-[var(--signal-text-secondary)] leading-relaxed">Analysis pending...</p>
            </div>

            <Separator className="bg-[var(--signal-divider)]" />

            {/* Main conversation topics */}
            <div>
              <p className="text-xs text-[var(--signal-text-tertiary)] mb-1">Main conversation topics</p>
              <p className="text-sm text-[var(--signal-text-secondary)] leading-relaxed">Analysis pending...</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
