/**
 * ColorFXEngine.ts
 * Color FX Engine for Daslight 5
 * Handles color transitions, hue shifts, rainbow chasing, etc.
 */

export interface ColorFXConfig {
  mode: 'rainbow' | 'pulse' | 'strobe' | 'transition' | 'hueShift'
  speed: number           // 0.1 - 10x
  phase: number          // 0 - 1 (0-360 degrees)
  amplitude: number      // 0 - 255
  colorWheel: string[]   // Predefined colors or hex
  targetChannels: number[] // Which channels to affect (RGB channels)
}

export interface RGBColor {
  r: number  // 0-255
  g: number
  b: number
}

/**
 * Color FX Engine - generates color effects
 */
export class ColorFXEngine {
  private colorPalette: RGBColor[] = []
  private currentIndex: number = 0
  private lastUpdate: number = 0

  constructor(private config: ColorFXConfig) {
    this.initializeColorPalette()
  }

  /**
   * Initialize color palette from wheel
   */
  private initializeColorPalette(): void {
    this.colorPalette = this.config.colorWheel.map((color) => {
      if (color.startsWith('#')) {
        return this.hexToRGB(color)
      }
      return this.namedColorToRGB(color)
    })
  }

  /**
   * Calculate current color for time
   */
  public calculateColor(time: number): RGBColor {
    switch (this.config.mode) {
      case 'rainbow':
        return this.rainbowMode(time)
      case 'pulse':
        return this.pulseMode(time)
      case 'strobe':
        return this.strobeMode(time)
      case 'transition':
        return this.transitionMode(time)
      case 'hueShift':
        return this.hueShiftMode(time)
      default:
        return { r: 0, g: 0, b: 0 }
    }
  }

  /**
   * Rainbow mode - cycle through colors
   */
  private rainbowMode(time: number): RGBColor {
    const cycleTime = (1 / this.config.speed) * 1000
    const position = ((time % cycleTime) / cycleTime) * this.colorPalette.length
    const index = Math.floor(position) % this.colorPalette.length
    const nextIndex = (index + 1) % this.colorPalette.length
    const blend = position - Math.floor(position)

    return this.blendColors(
      this.colorPalette[index],
      this.colorPalette[nextIndex],
      blend
    )
  }

  /**
   * Pulse mode - fade in and out
   */
  private pulseMode(time: number): RGBColor {
    const cycleTime = (1 / this.config.speed) * 1000
    const progress = (time % cycleTime) / cycleTime
    const intensity = Math.abs(Math.sin(progress * Math.PI))

    const baseColor = this.colorPalette[0] || { r: 255, g: 255, b: 255 }
    return {
      r: Math.floor(baseColor.r * intensity),
      g: Math.floor(baseColor.g * intensity),
      b: Math.floor(baseColor.b * intensity),
    }
  }

  /**
   * Strobe mode - on/off flashing
   */
  private strobeMode(time: number): RGBColor {
    const strobeRate = this.config.speed * 10
    const cycleTime = 1000 / strobeRate
    const isOn = (time % cycleTime) < cycleTime * 0.5

    if (isOn) {
      return this.colorPalette[0] || { r: 255, g: 255, b: 255 }
    } else {
      return { r: 0, g: 0, b: 0 }
    }
  }

  /**
   * Transition mode - smoothly transition between palette
   */
  private transitionMode(time: number): RGBColor {
    const totalTime = this.colorPalette.length / this.config.speed * 1000
    const position = (time % totalTime) / totalTime
    const palettePosition = position * this.colorPalette.length
    const index = Math.floor(palettePosition) % this.colorPalette.length
    const nextIndex = (index + 1) % this.colorPalette.length
    const blend = palettePosition - Math.floor(palettePosition)

    return this.blendColors(
      this.colorPalette[index],
      this.colorPalette[nextIndex],
      blend
    )
  }

  /**
   * Hue shift mode - smooth hue rotation
   */
  private hueShiftMode(time: number): RGBColor {
    const cycleTime = (1 / this.config.speed) * 1000
    const hueProgress = (time % cycleTime) / cycleTime
    const hue = hueProgress * 360

    return this.hsvToRGB(hue, 255, 255)
  }

  /**
   * Blend two colors
   */
  private blendColors(c1: RGBColor, c2: RGBColor, blend: number): RGBColor {
    return {
      r: Math.floor(c1.r * (1 - blend) + c2.r * blend),
      g: Math.floor(c1.g * (1 - blend) + c2.g * blend),
      b: Math.floor(c1.b * (1 - blend) + c2.b * blend),
    }
  }

  /**
   * Convert hex to RGB
   */
  private hexToRGB(hex: string): RGBColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    }
    return { r: 0, g: 0, b: 0 }
  }

  /**
   * Convert named color to RGB
   */
  private namedColorToRGB(name: string): RGBColor {
    const colors: Record<string, RGBColor> = {
      red: { r: 255, g: 0, b: 0 },
      green: { r: 0, g: 255, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      white: { r: 255, g: 255, b: 255 },
      black: { r: 0, g: 0, b: 0 },
      yellow: { r: 255, g: 255, b: 0 },
      cyan: { r: 0, g: 255, b: 255 },
      magenta: { r: 255, g: 0, b: 255 },
      orange: { r: 255, g: 165, b: 0 },
      purple: { r: 128, g: 0, b: 128 },
    }
    return colors[name.toLowerCase()] || { r: 0, g: 0, b: 0 }
  }

  /**
   * Convert HSV to RGB
   */
  private hsvToRGB(h: number, s: number, v: number): RGBColor {
    const c = (v / 255) * (s / 255)
    const hPrime = h / 60
    const x = c * (1 - Math.abs((hPrime % 2) - 1))

    let r1 = 0,
      g1 = 0,
      b1 = 0

    if (hPrime >= 0 && hPrime < 1) {
      r1 = c
      g1 = x
    } else if (hPrime >= 1 && hPrime < 2) {
      r1 = x
      g1 = c
    } else if (hPrime >= 2 && hPrime < 3) {
      g1 = c
      b1 = x
    } else if (hPrime >= 3 && hPrime < 4) {
      g1 = x
      b1 = c
    } else if (hPrime >= 4 && hPrime < 5) {
      r1 = x
      b1 = c
    } else {
      r1 = c
      b1 = x
    }

    const m = v / 255 - c
    return {
      r: Math.floor((r1 + m) * 255),
      g: Math.floor((g1 + m) * 255),
      b: Math.floor((b1 + m) * 255),
    }
  }

  /**
   * Get current color at time
   */
  public getColorAtTime(time: number): RGBColor {
    return this.calculateColor(time)
  }

  /**
   * Convert RGB to DMX channels (assuming 3 consecutive channels for RGB)
   */
  public renderDMX(time: number): Record<number, number> {
    const color = this.getColorAtTime(time)
    const dmx: Record<number, number> = {}

    const channels = this.config.targetChannels
    if (channels.length >= 3) {
      dmx[channels[0]] = color.r
      dmx[channels[1]] = color.g
      dmx[channels[2]] = color.b
    }

    return dmx
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ColorFXConfig>): void {
    this.config = { ...this.config, ...config }
    this.initializeColorPalette()
  }
}
