import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  isSent: boolean
  sender: string
  avatar?: string
  timestamp: string
  status?: "sent" | "delivered" | "read"
}

interface MessageViewProps {
  messages: Message[]
}

export function MessageView({ messages }: MessageViewProps) {
  return (
    <ScrollArea className="flex-1 bg-[var(--signal-bg-primary)]">
      <div className="flex flex-col gap-3 p-6">
        {messages.map((message, index) => {
          const showAvatar =
            !message.isSent && (index === messages.length - 1 || messages[index + 1]?.isSent !== message.isSent)

          return (
            <div key={message.id} className={cn("flex gap-2", message.isSent ? "justify-end" : "justify-start")}>
              {!message.isSent && (
                <div className="w-8 shrink-0">
                  {showAvatar && message.avatar && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.sender} />
                      <AvatarFallback className="bg-[var(--signal-blue)] text-xs text-white">
                        {message.sender.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}

              <div className={cn("flex max-w-[65%] flex-col gap-1", message.isSent ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2",
                    message.isSent
                      ? "bg-[var(--signal-message-sent)] text-white"
                      : "bg-[var(--signal-message-received)] text-[var(--signal-text-primary)]",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                </div>

                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs text-[var(--signal-text-tertiary)]">{message.timestamp}</span>
                  {message.isSent && message.status && (
                    <span className="text-[var(--signal-text-tertiary)]">
                      {message.status === "read" ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
