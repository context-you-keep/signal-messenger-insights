import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { UploadForm } from '@/components/UploadForm'
import { ConversationList } from '@/components/ConversationList'
import { MessageView } from '@/components/MessageView'
import { ConversationHeader } from '@/components/ConversationHeader'
import { ChatStatistics } from '@/components/ChatStatistics'
import { StatisticsPage } from '@/components/StatisticsPage'
import type { ConversationSummary, Message } from '@/types/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// ============================================================================
// DATA TRANSFORMATION LAYER
// Maps backend API types → v0 component expected types
// ============================================================================

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'N/A'

  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // Today: show time
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    // This week: show day name
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  } else {
    // Older: show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

function transformConversation(conv: ConversationSummary) {
  return {
    id: conv.id,
    name: conv.name || 'Unknown',
    lastMessage: conv.last_message || 'No messages',
    timestamp: formatTimestamp(conv.last_message_timestamp),
    avatar: undefined, // We don't have avatars in backend
    unread: conv.unread_count > 0 ? conv.unread_count : undefined,
    isGroup: conv.type === 'group',
    messageCount: conv.message_count,
  }
}

function transformMessage(msg: Message, conversationName: string) {
  return {
    id: msg.id,
    content: msg.body || '[No content]',
    isSent: msg.sent,
    sender: msg.sent ? 'You' : conversationName,
    avatar: undefined, // We don't have avatars in backend
    timestamp: formatTimestamp(msg.timestamp),
    status: msg.sent ? ('read' as const) : undefined, // Default to 'read' for sent messages
  }
}

// ============================================================================
// APP CONTENT
// ============================================================================

function AppContent() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  // Check initialization status
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['status'],
    queryFn: apiClient.getStatus,
    refetchInterval: 5000,
  })

  // Fetch conversations from backend (only when initialized)
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.getConversations(100),
    enabled: status?.initialized === true,
  })

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => apiClient.getMessages(selectedConversationId!, 1, 500),
    enabled: !!selectedConversationId,
  })

  // Find selected conversation
  const selectedConversation = conversations?.find(c => c.id === selectedConversationId)

  // Transform data for v0 components
  const transformedConversations = conversations?.map(transformConversation) || []
  const transformedMessages = messagesData?.messages.map(msg =>
    transformMessage(msg, selectedConversation?.name || 'Unknown')
  ) || []

  const handleUploadSuccess = () => {
    refetchStatus()
  }

  // Show upload form if not initialized
  if (!status?.initialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <UploadForm onUploadSuccess={handleUploadSuccess} />
      </div>
    )
  }

  // Debug logging
  console.log('Debug:', {
    selectedConversationId,
    messagesDataExists: !!messagesData,
    messagesCount: messagesData?.messages?.length,
    transformedCount: transformedMessages.length,
    messagesLoading,
    messagesError: messagesError?.message,
  })

  // Loading state
  if (conversationsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--signal-bg-primary)]">
        <div className="text-[var(--signal-text-primary)]">Loading conversations...</div>
      </div>
    )
  }

  // No conversations state
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--signal-bg-primary)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--signal-text-primary)] mb-2">No conversations found</h2>
          <p className="text-sm text-[var(--signal-text-secondary)]">Upload a Signal database to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[var(--signal-bg-primary)] dark">
      {/* Conversation List Sidebar */}
      <ConversationList
        conversations={transformedConversations}
        selectedId={selectedConversationId || ''}
        onSelect={setSelectedConversationId}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {selectedConversationId && selectedConversation ? (
          <>
            <ConversationHeader
              conversation={{
                id: selectedConversation.id,
                name: selectedConversation.name || 'Unknown',
                avatar: undefined,
                isGroup: selectedConversation.type === 'group',
              }}
            />
            {messagesLoading ? (
              <div className="flex-1 flex items-center justify-center bg-[var(--signal-bg-primary)]">
                <div className="text-[var(--signal-text-secondary)]">Loading messages...</div>
              </div>
            ) : (
              <MessageView messages={transformedMessages} />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[var(--signal-bg-primary)]">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[var(--signal-text-primary)] mb-2">Select a conversation</h2>
              <p className="text-sm text-[var(--signal-text-tertiary)]">Choose from the list on the left</p>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Sidebar */}
      {selectedConversationId && selectedConversation && messagesData && (
        <ChatStatistics
          conversation={{
            id: selectedConversation.id,
            name: selectedConversation.name || 'Unknown',
          }}
          messages={transformedMessages}
          totalMessages={messagesData.total}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/stats/:conversationId" element={<StatisticsPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
