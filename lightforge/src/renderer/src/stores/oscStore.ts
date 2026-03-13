// ════════════════════════════════════════════════════════════════════════════
//  OSCStore — Zustand store for OSC networking configuration
// ════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'

export interface OSCConfig {
  enabled: boolean
  localPort: number
  remoteHost: string
  remotePort: number
  enabledEndpoints: string[]
}

export interface OSCMessage {
  timestamp: number
  direction: 'send' | 'receive'
  address: string
  args: any[]
  error?: string
}

export interface OSCStore {
  // State
  config: OSCConfig
  isConnected: boolean
  messages: OSCMessage[]
  maxMessages: number

  // Queries
  getConfig: () => OSCConfig
  isEnabled: () => boolean
  getMessages: () => OSCMessage[]
  getConnectionStatus: () => string

  // Actions
  setConfig: (config: Partial<OSCConfig>) => void
  setConnected: (connected: boolean) => void
  addMessage: (message: Omit<OSCMessage, 'timestamp'>) => void
  clearMessages: () => void
  enableEndpoint: (endpoint: string) => void
  disableEndpoint: (endpoint: string) => void
  toggleEndpoint: (endpoint: string) => void
}

const DEFAULT_CONFIG: OSCConfig = {
  enabled: false,
  localPort: 9000,
  remoteHost: 'localhost',
  remotePort: 9001,
  enabledEndpoints: ['/scene/play', '/scene/stop', '/dmx/channel', '/status/scene'],
}

export const useOSCStore = create<OSCStore>((set, get) => ({
  // Initial state
  config: DEFAULT_CONFIG,
  isConnected: false,
  messages: [],
  maxMessages: 50,

  // Queries
  getConfig: () => get().config,
  isEnabled: () => get().config.enabled,
  getMessages: () => get().messages,
  getConnectionStatus: () => {
    const { isConnected, config } = get()
    if (!config.enabled) return 'disabled'
    if (isConnected) return 'connected'
    return 'disconnected'
  },

  // Actions
  setConfig: (updates: Partial<OSCConfig>) => {
    set(state => ({
      config: { ...state.config, ...updates },
    }))
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected })
  },

  addMessage: (message: Omit<OSCMessage, 'timestamp'>) => {
    set(state => {
      const newMessages = [
        { ...message, timestamp: Date.now() } as OSCMessage,
        ...state.messages,
      ].slice(0, state.maxMessages)
      return { messages: newMessages }
    })
  },

  clearMessages: () => {
    set({ messages: [] })
  },

  enableEndpoint: (endpoint: string) => {
    set(state => {
      const endpoints = new Set(state.config.enabledEndpoints)
      endpoints.add(endpoint)
      return {
        config: {
          ...state.config,
          enabledEndpoints: Array.from(endpoints),
        },
      }
    })
  },

  disableEndpoint: (endpoint: string) => {
    set(state => {
      const endpoints = new Set(state.config.enabledEndpoints)
      endpoints.delete(endpoint)
      return {
        config: {
          ...state.config,
          enabledEndpoints: Array.from(endpoints),
        },
      }
    })
  },

  toggleEndpoint: (endpoint: string) => {
    const state = get()
    if (state.config.enabledEndpoints.includes(endpoint)) {
      get().disableEndpoint(endpoint)
    } else {
      get().enableEndpoint(endpoint)
    }
  },
}))
