import axios from 'axios'
import type {
  ConversationSummary,
  Message,
  MessagesResponse,
  SearchRequest,
  StatusResponse,
  UploadResponse,
} from '@/types/api'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiClient = {
  // Status
  getStatus: async (): Promise<StatusResponse> => {
    const { data } = await api.get<StatusResponse>('/status')
    return data
  },

  // Upload files
  uploadFiles: async (config: File, database: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('config', config)
    formData.append('database', database)

    const { data } = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  // Initialize from volume
  initFromVolume: async (signalPath: string = '/signal'): Promise<UploadResponse> => {
    const { data } = await api.post<UploadResponse>('/init-volume', null, {
      params: { signal_path: signalPath },
    })
    return data
  },

  // Conversations
  getConversations: async (limit: number = 100): Promise<ConversationSummary[]> => {
    const { data } = await api.get<ConversationSummary[]>('/conversations', {
      params: { limit },
    })
    return data
  },

  // Messages
  getMessages: async (
    conversationId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<MessagesResponse> => {
    const { data } = await api.get<MessagesResponse>(
      `/conversations/${conversationId}/messages`,
      {
        params: { page, page_size: pageSize },
      }
    )
    return data
  },

  // Search
  searchMessages: async (searchRequest: SearchRequest): Promise<Message[]> => {
    const { data } = await api.post<Message[]>('/search', searchRequest)
    return data
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const { data } = await api.get<{ status: string }>('/health')
    return data
  },
}
