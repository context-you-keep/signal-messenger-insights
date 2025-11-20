"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Search, Users, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient } from "@/services/api"

interface Conversation {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  timestamp: string
  unread?: number
  isGroup?: boolean
  messageCount?: number
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string
  onSelect: (id: string) => void
  onLogout?: () => void
}

export function ConversationList({ conversations, selectedId, onSelect, onLogout }: ConversationListProps) {
  const handleLogout = async () => {
    try {
      await apiClient.logout()
      if (onLogout) {
        onLogout()
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="flex w-80 flex-col border-r border-[var(--signal-divider)] bg-[var(--signal-bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--signal-divider)] px-4 py-4">
        <h1 className="text-xl font-semibold text-[var(--signal-text-primary)]">Signal</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-[var(--signal-text-tertiary)] hover:text-[var(--signal-text-primary)] hover:bg-[var(--signal-bg-secondary)]"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="border-b border-[var(--signal-divider)] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--signal-text-tertiary)]" />
          <Input
            placeholder="Search"
            className="border-none bg-[var(--signal-bg-secondary)] pl-9 text-[var(--signal-text-primary)] placeholder:text-[var(--signal-text-tertiary)] focus-visible:ring-1 focus-visible:ring-[var(--signal-blue)]"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--signal-bg-tertiary)]",
                selectedId === conversation.id && "bg-[var(--signal-bg-secondary)]",
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={conversation.name} />
                  <AvatarFallback className="bg-[var(--signal-blue)] text-white">
                    {conversation.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {conversation.isGroup && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-[var(--signal-bg-primary)] p-0.5">
                    <Users className="h-3 w-3 text-[var(--signal-text-secondary)]" />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-hidden text-left">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate font-semibold text-[var(--signal-text-primary)]">{conversation.name}</h3>
                  <span className="shrink-0 text-xs text-[var(--signal-text-tertiary)]">{conversation.timestamp}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-[var(--signal-text-secondary)]">{conversation.lastMessage}</p>
                  {conversation.unread && conversation.unread > 0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--signal-blue)] text-xs font-semibold text-white">
                      {conversation.unread}
                    </span>
                  )}
                </div>
                {conversation.messageCount !== undefined && conversation.messageCount > 0 && (
                  <div className="mt-1 text-xs text-[var(--signal-text-tertiary)]">
                    {conversation.messageCount.toLocaleString()} messages
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
