import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Phone, Video, MoreVertical } from "lucide-react"

interface Conversation {
  id: string
  name: string
  avatar?: string
  isGroup?: boolean
}

interface ConversationHeaderProps {
  conversation: Conversation
}

export function ConversationHeader({ conversation }: ConversationHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)] px-6 py-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={conversation.name} />
          <AvatarFallback className="bg-[var(--signal-blue)] text-white">{conversation.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-[var(--signal-text-primary)]">{conversation.name}</h2>
          <p className="text-sm text-[var(--signal-text-tertiary)]">
            {conversation.isGroup ? `${Math.floor(Math.random() * 10) + 3} members` : "Last seen recently"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--signal-text-secondary)] hover:bg-[var(--signal-bg-tertiary)] hover:text-[var(--signal-text-primary)]"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--signal-text-secondary)] hover:bg-[var(--signal-bg-tertiary)] hover:text-[var(--signal-text-primary)]"
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--signal-text-secondary)] hover:bg-[var(--signal-bg-tertiary)] hover:text-[var(--signal-text-primary)]"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
