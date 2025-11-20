"use client"

import { useState } from "react"
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

// Sample data
const conversations: Conversation[] = [
  {
    id: "1",
    name: "Alice Johnson",
    lastMessage: "See you tomorrow!",
    timestamp: "2:45 PM",
    avatar: "/diverse-woman-portrait.png",
    unread: 2,
  },
  {
    id: "2",
    name: "Bob Smith",
    lastMessage: "Thanks for the help",
    timestamp: "1:30 PM",
    avatar: "/man.jpg",
  },
  {
    id: "3",
    name: "Team Updates",
    lastMessage: "Meeting at 3 PM",
    timestamp: "Yesterday",
    avatar: "/diverse-professional-team.png",
    isGroup: true,
    unread: 5,
  },
  {
    id: "4",
    name: "Sarah Williams",
    lastMessage: "Got the documents",
    timestamp: "Monday",
    avatar: "/woman-2.jpg",
  },
  {
    id: "5",
    name: "Design Team",
    lastMessage: "New mockups ready",
    timestamp: "Sunday",
    avatar: "/abstract-design-elements.png",
    isGroup: true,
  },
]

const messages: Record<string, Message[]> = {
  "1": [
    {
      id: "1",
      content: "Hey! How are you doing?",
      timestamp: "2:30 PM",
      sender: "Alice Johnson",
      isSent: false,
      avatar: "/diverse-woman-portrait.png",
    },
    {
      id: "2",
      content: "I'm doing great, thanks! How about you?",
      timestamp: "2:32 PM",
      sender: "You",
      isSent: true,
      status: "read",
    },
    {
      id: "3",
      content: "Pretty good! Are we still on for tomorrow?",
      timestamp: "2:35 PM",
      sender: "Alice Johnson",
      isSent: false,
      avatar: "/diverse-woman-portrait.png",
    },
    {
      id: "4",
      content: "Looking forward to it.",
      timestamp: "2:40 PM",
      sender: "You",
      isSent: true,
      status: "read",
    },
    {
      id: "5",
      content: "See you tomorrow!",
      timestamp: "2:45 PM",
      sender: "Alice Johnson",
      isSent: false,
      avatar: "/diverse-woman-portrait.png",
    },
  ],
  "2": [
    {
      id: "1",
      content: "Could you help me with the project setup?",
      timestamp: "1:15 PM",
      sender: "Bob Smith",
      isSent: false,
      avatar: "/man.jpg",
    },
    {
      id: "2",
      content: "What do you need help with?",
      timestamp: "1:20 PM",
      sender: "You",
      isSent: true,
      status: "delivered",
    },
    {
      id: "3",
      content: "Thanks for the help",
      timestamp: "1:30 PM",
      sender: "Bob Smith",
      isSent: false,
      avatar: "/man.jpg",
    },
  ],
}

export function SignalChatArchive() {
  const [selectedConversation, setSelectedConversation] = useState<string>("1")
  const activeConversation = conversations.find((c) => c.id === selectedConversation)
  const activeMessages = messages[selectedConversation] || []

  return (
    <div className="flex h-screen bg-[var(--signal-bg-primary)] dark">
      {/* Conversation List Sidebar */}
      <ConversationList
        conversations={conversations}
        selectedId={selectedConversation}
        onSelect={setSelectedConversation}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {activeConversation && (
          <>
            <ConversationHeader conversation={activeConversation} />
            <MessageView messages={activeMessages} />
          </>
        )}
      </div>

      {activeConversation && <ChatStatistics conversation={activeConversation} messages={activeMessages} />}
    </div>
  )
}
