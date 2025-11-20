import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import type { ConversationSummary } from '@/types/api'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'

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
      <div className="p-4 space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-sm font-medium text-destructive">Failed to load conversations</div>
        <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page</p>
      </div>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No conversations found</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedConversationId}
            onClick={() => onSelectConversation(conversation.id)}
          />
        ))}
      </div>
    </ScrollArea>
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
      className={`w-full p-4 text-left hover:bg-accent/50 transition-all duration-150 ${
        isSelected ? 'bg-accent border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <h3 className={`font-semibold truncate flex-1 ${isSelected ? 'text-foreground' : 'text-foreground'}`}>
          {conversation.name || 'Unknown'}
        </h3>
        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
          {formatDate(conversation.last_message_timestamp)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground truncate mb-2">
        {conversation.last_message || 'No messages'}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">
          {conversation.message_count} messages
        </span>
        {conversation.unread_count > 0 && (
          <Badge variant="default" className="h-5 px-2 text-xs">
            {conversation.unread_count}
          </Badge>
        )}
      </div>
    </button>
  )
}
