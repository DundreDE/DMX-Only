import React, { useRef, useEffect } from 'react'

interface WaveformPreviewProps {
  waveType: string
  speed: number
  phase: number
  amplitude: number
  offset: number
}

const generateWaveform = (
  type: string,
  speed: number,
  phase: number,
  amplitude: number,
  offset: number,
  width: number
): number[] => {
  const points: number[] = []
  const cycles = speed * 3

  for (let i = 0; i < width; i++) {
    const t = (i / width) * Math.PI * 2 * cycles + phase * Math.PI * 2

    let value = 0
    switch (type) {
      case 'sine':
        value = Math.sin(t)
        break
      case 'triangle':
        value = Math.asin(Math.sin(t)) * 2 / Math.PI
        break
      case 'square':
        value = Math.sin(t) > 0 ? 1 : -1
        break
      case 'sawtooth':
        value = 2 * ((t / (Math.PI * 2)) - Math.floor((t / (Math.PI * 2)) + 0.5))
        break
      case 'custom':
        value = Math.sin(t) * Math.cos(t)
        break
      default:
        value = Math.sin(t)
    }

    points.push(((value * amplitude) / 255 + offset / 255) * 128 + 64)
  }

  return points
}

export const WaveformPreview: React.FC<WaveformPreviewProps> = ({
  waveType,
  speed,
  phase,
  amplitude,
  offset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const width = canvasRef.current.width
    const height = canvasRef.current.height

    // Clear
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, height)

    // Background grid
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    for (let i = 0; i <= height; i += height / 4) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }

    // Center line
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // Generate waveform
    const points = generateWaveform(waveType, speed, phase, amplitude, offset, width)

    // Draw waveform
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, height - points[0])

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(i, height - points[i])
    }
    ctx.stroke()

    // Draw fill under waveform
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.fill()

    // Draw min/max markers
    const min = Math.min(...points)
    const max = Math.max(...points)

    ctx.fillStyle = '#ef4444'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(
      `Max: ${(((max - 64) / 128) * 255).toFixed(0)}`,
      width - 5,
      15
    )

    ctx.fillText(
      `Min: ${(((min - 64) / 128) * 255).toFixed(0)}`,
      width - 5,
      height - 5
    )

    // Wave type label
    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(waveType.toUpperCase(), 5, 15)

    // Statistics
    ctx.font = '10px monospace'
    ctx.fillStyle = '#64748b'
    ctx.fillText(`Speed: ${(speed * 100).toFixed(0)}%`, 5, 30)
    ctx.fillText(`Phase: ${(phase * 360).toFixed(0)}°`, 5, 42)
  }, [waveType, speed, phase, amplitude, offset])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="w-full border border-slate-700 rounded bg-slate-900"
      />
      <div className="text-xs text-slate-500 mt-2 text-center">
        Waveform visualization • {waveType}
      </div>
    </div>
  )
}
