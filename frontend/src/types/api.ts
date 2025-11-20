export interface ConversationSummary {
  id: string
  name: string | null
  type: string
  last_message: string | null
  last_message_timestamp: string | null
  message_count: number
  unread_count: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  body: string | null
  timestamp: string
  sent: boolean
  has_attachments: boolean
  quote_id: string | null
}

export interface MessagesResponse {
  messages: Message[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface SearchRequest {
  query: string
  conversation_id?: string
  start_date?: string
  end_date?: string
  limit?: number
}

export interface UploadResponse {
  success: boolean
  message: string
  conversation_count?: number
}

export interface StatusResponse {
  initialized: boolean
  mode: string | null
  conversation_count: number | null
}
