import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Phone, Video, MoreVertical } from "lucide-react"
import type { ConversationSummary } from "@/types/api"

interface ConversationHeaderProps {
  conversation: ConversationSummary
}

export function ConversationHeader({ conversation }: ConversationHeaderProps) {
  const isGroup = conversation.type === "group"

  return (
    <div className="flex items-center justify-between border-b border-[var(--signal-divider)] bg-[var(--signal-bg-secondary)] px-6 py-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-[var(--signal-blue)] text-white">
            {conversation.name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-[var(--signal-text-primary)]">
            {conversation.name || "Unknown"}
          </h2>
          <p className="text-sm text-[var(--signal-text-tertiary)]">
            {isGroup ? `Group conversation` : "Archive"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--signal-text-secondary)] hover:bg-[var(--signal-bg-tertiary)] hover:text-[var(--signal-text-primary)]"
          disabled
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--signal-text-secondary)] hover:bg-[var(--signal-bg-tertiary)] hover:text-[var(--signal-text-primary)]"
          disabled
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--signal-text-secondary)] hover:bg-[var(--signal-bg-tertiary)] hover:text-[var(--signal-text-primary)]"
          disabled
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
