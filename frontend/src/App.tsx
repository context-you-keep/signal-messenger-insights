import { useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { UploadForm } from '@/components/UploadForm'
import { ConversationList } from '@/components/ConversationList'
import { MessageView } from '@/components/MessageView'

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

  const handleUploadSuccess = () => {
    refetchStatus()
  }

  if (!status?.initialized) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <UploadForm onUploadSuccess={handleUploadSuccess} />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Signal Archive Viewer
          </h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {status.conversation_count} conversations
            {status.mode && (
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {status.mode}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
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

        {/* Message View */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900">
          {selectedConversationId ? (
            <MessageView conversationId={selectedConversationId} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a conversation to view messages
            </div>
          )}
        </div>
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
