import React, { useRef, useEffect } from 'react'

interface Cue {
  id: string
  name: string
  duration: number
  fadeIn: number
  fadeOut: number
  dmxValues?: Record<string, number>
}

interface PreviewProps {
  cue: Cue
}

export const CuePreview: React.FC<PreviewProps> = ({ cue }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const width = canvasRef.current.width
    const height = canvasRef.current.height

    // Background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, height)

    // Timeline background
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 10, width, height - 20)

    // Duration bar
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(0, 15, width, 10)

    // Fade In
    ctx.fillStyle = '#60a5fa'
    const fadeInWidth = (cue.fadeIn / cue.duration) * width
    ctx.fillRect(0, 15, fadeInWidth, 10)

    // Fade Out
    ctx.fillStyle = '#fbbf24'
    const fadeOutWidth = (cue.fadeOut / cue.duration) * width
    ctx.fillRect(width - fadeOutWidth, 15, fadeOutWidth, 10)

    // Timeline line at center
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // DMX Channel Preview
    const dmxValues = cue.dmxValues || {}
    const channels = Object.entries(dmxValues).slice(0, 8)

    channels.forEach(([ _label, value], idx) => {
      const x = 5 + (idx * (width / 8))
      const barHeight = (value / 255) * 20

      // Channel bg
      ctx.fillStyle = '#334155'
      ctx.fillRect(x, height - 25, width / 8 - 2, 20)

      // Channel value
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(x, height - 25 + (20 - barHeight), width / 8 - 2, barHeight)

      // Channel label
      ctx.fillStyle = '#94a3b8'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(String(value), x + width / 16 - 1, height - 3)
    })

    // Labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${cue.name}`, 5, 12)

    // Duration label
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${(cue.duration / 1000).toFixed(2)}s`, width - 5, 12)
  }, [cue])

  const dmxCount = Object.keys(cue.dmxValues || {}).length

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <canvas
        ref={canvasRef}
        width={280}
        height={80}
        className="flex-1 border border-slate-700 bg-slate-950 rounded"
      />
      <div className="text-xs text-slate-500">
        <div>Duration: {(cue.duration / 1000).toFixed(2)}s</div>
        <div>DMX Channels: {dmxCount}</div>
      </div>
    </div>
  )
}
