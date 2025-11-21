"use client"

import { useState, useEffect } from "react"
import { ConversationList } from "./conversation-list"
import { MessageView } from "./message-view"
import { ConversationHeader } from "./conversation-header"
import { ChatStatistics } from "./chat-statistics"

export type Conversation = {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  avatar: string
  unread?: number
  isGroup?: boolean
}

export type Message = {
  id: string
  content: string
  timestamp: string
  sender: string
  isSent: boolean
  status?: "sent" | "delivered" | "read"
  avatar?: string
}

// Sample data removed - now fetched from API

export function SignalChatArchive() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [messageTotals, setMessageTotals] = useState<Record<string, number>>({})
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/conversations")
        if (!response.ok) {
          throw new Error("Failed to load conversations")
        }
        const data = await response.json()
        // Ensure data is an array
        const conversationsArray = Array.isArray(data) ? data : []
        setConversations(conversationsArray)

        // Select first conversation by default
        if (data.length > 0) {
          setSelectedConversation(data[0].id)
        }
      } catch (error) {
        console.error("Error loading conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [])

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return

    // If messages already loaded for this conversation, skip
    if (messages[selectedConversation]) return

    async function loadMessages() {
      if (!selectedConversation) return

      try {
        setLoadingMessages(true)
        setError(null)
        const response = await fetch(`/api/messages/${selectedConversation}?pageSize=100`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || "Failed to load messages")
        }
        const data = await response.json()

        setMessages((prev) => ({
          ...prev,
          [selectedConversation as string]: data.messages,
        }))

        setMessageTotals((prev) => ({
          ...prev,
          [selectedConversation as string]: data.total,
        }))
      } catch (error) {
        console.error("Error loading messages:", error)
        setError(error instanceof Error ? error.message : "Failed to load messages")
      } finally {
        setLoadingMessages(false)
      }
    }

    loadMessages()
  }, [selectedConversation, messages])

  const activeConversation = Array.isArray(conversations)
    ? conversations.find((c) => c.id === selectedConversation)
    : undefined
  const activeMessages = selectedConversation ? messages[selectedConversation] || [] : []
  const activeMessageTotal = selectedConversation ? messageTotals[selectedConversation] || 0 : 0

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--signal-bg-primary)] text-[var(--signal-text-primary)]">
        <div className="text-center">
          <div className="text-lg">Loading conversations...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[var(--signal-bg-primary)] dark">
      {/* Conversation List Sidebar */}
      <ConversationList
        conversations={conversations}
        selectedId={selectedConversation || ""}
        onSelect={setSelectedConversation}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {activeConversation && (
          <>
            <ConversationHeader conversation={activeConversation} />
            {error && (
              <div className="flex items-center justify-center p-4 bg-red-500/10 text-red-500 border-b border-red-500/20">
                <div className="text-sm">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}
            {loadingMessages && !error && (
              <div className="flex items-center justify-center p-8 text-[var(--signal-text-secondary)]">
                <div className="text-sm">Loading messages...</div>
              </div>
            )}
            {!loadingMessages && !error && <MessageView messages={activeMessages} />}
          </>
        )}
      </div>

      {activeConversation && <ChatStatistics conversation={activeConversation} messages={activeMessages} totalMessages={activeMessageTotal} />}
    </div>
  )
}
