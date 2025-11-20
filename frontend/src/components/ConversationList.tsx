import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import type { ConversationSummary } from '@/types/api'

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void
  selectedConversationId: string | null
}

export function ConversationList({
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.getConversations(),
  })

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading conversations...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400">
        Failed to load conversations
      </div>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No conversations found
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedConversationId}
          onClick={() => onSelectConversation(conversation.id)}
        />
      ))}
    </div>
  )
}

interface ConversationItemProps {
  conversation: ConversationSummary
  isSelected: boolean
  onClick: () => void
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 border-b dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">
          {conversation.name || 'Unknown'}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
          {formatDate(conversation.last_message_timestamp)}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
        {conversation.last_message || 'No messages'}
      </p>
      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
        <span>{conversation.message_count} messages</span>
        {conversation.unread_count > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full">
            {conversation.unread_count}
          </span>
        )}
      </div>
    </button>
  )
}
