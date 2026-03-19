// ════════════════════════════════════════════════════════════════════════════
//  OSCPanel — UI for OSC networking configuration and status
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useOSCStore } from '../../stores/oscStore'
import { oscEngine, OSC_ENDPOINTS } from '../../utils/oscEngine'

export function OSCPanel(): React.JSX.Element {
  const {
    config,
    isConnected,
    messages,
    setConfig,
    setConnected,
    addMessage,
    clearMessages,
    toggleEndpoint,
  } = useOSCStore()

  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const success = await oscEngine.connect()
      setConnected(success)
      if (success) {
        addMessage({
          direction: 'send',
          address: 'status',
          args: ['Connected to OSC network'],
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    oscEngine.disconnect()
    setConnected(false)
    addMessage({
      direction: 'send',
      address: 'status',
      args: ['Disconnected from OSC network'],
    })
  }

  const statusColor = isConnected ? 'bg-green-600' : 'bg-red-600'
  const statusText = isConnected ? 'Connected' : 'Disconnected'

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          🌐 OSC Networking
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
          <span className="text-xs text-slate-400">{statusText}</span>
        </div>
      </div>

      {/* Configuration */}
      <div className="px-4 py-3 border-b border-slate-700 space-y-2 shrink-0">
        {/* Host */}
        <div>
          <label className="text-xs text-slate-400 font-semibold">Host</label>
          <input
            type="text"
            value={config.remoteHost}
            onChange={e => setConfig({ remoteHost: e.target.value })}
            disabled={isConnected}
            className="w-full px-2 py-1 text-xs bg-slate-700 text-white rounded disabled:opacity-50"
          />
        </div>

        {/* Port */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 font-semibold">Local Port</label>
            <input
              type="number"
              value={config.localPort}
              onChange={e => {
                const port = parseInt(e.target.value, 10)
                if (!isNaN(port) && port >= 1 && port <= 65535) {
                  setConfig({ localPort: port })
                }
              }}
              disabled={isConnected}
              className="w-full px-2 py-1 text-xs bg-slate-700 text-white rounded disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold">Remote Port</label>
            <input
              type="number"
              value={config.remotePort}
              onChange={e => {
                const port = parseInt(e.target.value, 10)
                if (!isNaN(port) && port >= 1 && port <= 65535) {
                  setConfig({ remotePort: port })
                }
              }}
              disabled={isConnected}
              className="w-full px-2 py-1 text-xs bg-slate-700 text-white rounded disabled:opacity-50"
            />
          </div>
        </div>

        {/* Connect Button */}
        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isConnecting}
          className={`w-full px-4 py-2 rounded font-semibold text-sm transition-colors ${
            isConnected
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Endpoints */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <label className="text-xs text-slate-400 font-semibold block mb-2">
          Enabled Endpoints
        </label>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {Object.values(OSC_ENDPOINTS).map(endpoint => (
            <button
              key={endpoint}
              onClick={() => toggleEndpoint(endpoint)}
              className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                config.enabledEndpoints.includes(endpoint)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {config.enabledEndpoints.includes(endpoint) ? '✓' : '○'} {endpoint}
            </button>
          ))}
        </div>
      </div>

      {/* Message Log */}
      <div className="flex-1 border-b border-slate-700 overflow-hidden flex flex-col shrink-0">
        <div className="px-4 py-2 border-b border-slate-700 flex justify-between items-center">
          <label className="text-xs text-slate-400 font-semibold">Messages ({messages.length})</label>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {messages.map((msg, idx) => (
            <div key={idx} className="text-xs font-mono text-slate-400">
              <span className={msg.direction === 'send' ? 'text-blue-400' : 'text-green-400'}>
                {msg.direction === 'send' ? '→' : '←'}
              </span>{' '}
              <span className="text-slate-300">{msg.address}</span>
              {msg.args.length > 0 && (
                <span className="text-slate-500"> [{msg.args.join(', ')}]</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-2 text-xs text-slate-500 shrink-0">
        <div>💡 Enable endpoints to send OSC messages</div>
        <div>📡 Real-time networking support</div>
      </div>
    </div>
  )
}
