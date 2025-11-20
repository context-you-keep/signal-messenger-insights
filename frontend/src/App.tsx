import { useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { UploadForm } from '@/components/UploadForm'
import { ConversationList } from '@/components/ConversationList'
import { MessageView } from '@/components/MessageView'
import { ConversationHeader } from '@/components/ConversationHeader'
import { ChatStatistics } from '@/components/ChatStatistics'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['status'],
    queryFn: apiClient.getStatus,
    refetchInterval: 5000, // Check status every 5 seconds
  })

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.getConversations(100),
    enabled: status?.initialized === true,
  })

  const { data: messagesData } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => apiClient.getMessages(selectedConversationId!, 1, 1000),
    enabled: !!selectedConversationId,
  })

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId)

  const handleUploadSuccess = () => {
    refetchStatus()
  }

  if (!status?.initialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <UploadForm onUploadSuccess={handleUploadSuccess} />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <h1 className="text-2xl font-bold">
            Signal Archive Viewer
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium">{status.conversation_count} conversations</span>
            {status.mode && (
              <Badge variant="secondary" className="text-xs">
                {status.mode}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: 3-pane layout */}
      <div className="flex-1 flex overflow-hidden h-screen bg-[var(--signal-bg-primary)]">
        {/* Conversation List Sidebar */}
        <div className="w-80 bg-[var(--signal-bg-secondary)] border-r border-[var(--signal-divider)] flex flex-col">
          <div className="p-4 border-b border-[var(--signal-divider)]">
            <h2 className="text-lg font-semibold text-[var(--signal-text-primary)]">
              Conversations
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId}
            />
          </div>
        </div>

        {/* Message View with Header */}
        <div className="flex-1 flex flex-col bg-[var(--signal-bg-primary)]">
          {selectedConversationId && selectedConversation ? (
            <>
              <ConversationHeader conversation={selectedConversation} />
              <MessageView conversationId={selectedConversationId} />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--signal-text-tertiary)]">
              <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation to view messages</p>
              <p className="text-sm mt-1">Choose from the list on the left</p>
            </div>
          )}
        </div>

        {/* Statistics Sidebar */}
        {selectedConversationId && selectedConversation && messagesData ? (
          <ChatStatistics
            conversation={selectedConversation}
            messages={messagesData.messages}
          />
        ) : null}
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
