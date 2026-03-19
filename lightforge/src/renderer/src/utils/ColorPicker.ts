/**
 * Professional Color Picker - RGB, HSL, Hex support
 * DasLight-style color selection
 */

export interface RGBColor {
  r: number
  g: number
  b: number
}

export interface HSLColor {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

export interface HSVColor {
  h: number // 0-360
  s: number // 0-100
  v: number // 0-100
}

export interface ColorSnapshot {
  id: string
  name: string
  hex: string
  rgb: RGBColor
  hsl: HSLColor
  notes: string
  createdAt: Date
}

/**
 * Color conversion utilities
 */
export class ColorConverter {
  /**
   * Hex to RGB
   */
  static hexToRgb(hex: string): RGBColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    if (!result) {
      return { r: 0, g: 0, b: 0 }
    }

    return {
      r: parseInt(result[1]!, 16),
      g: parseInt(result[2]!, 16),
      b: parseInt(result[3]!, 16)
    }
  }

  /**
   * RGB to Hex
   */
  static rgbToHex(color: RGBColor): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
      return hex.length === 1 ? `0${hex}` : hex
    }

    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase()
  }

  /**
   * RGB to HSL
   */
  static rgbToHsl(color: RGBColor): HSLColor {
    let r = color.r / 255
    let g = color.g / 255
    let b = color.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  /**
   * HSL to RGB
   */
  static hslToRgb(color: HSLColor): RGBColor {
    const h = color.h / 360
    const s = color.s / 100
    const l = color.l / 100

    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q

      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }

  /**
   * RGB to HSV
   */
  static rgbToHsv(color: RGBColor): HSVColor {
    let r = color.r / 255
    let g = color.g / 255
    let b = color.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    let h = 0
    const s = max === 0 ? 0 : d / max
    const v = max

    if (max !== min) {
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    }
  }

  /**
   * HSV to RGB
   */
  static hsvToRgb(color: HSVColor): RGBColor {
    const h = color.h / 360
    const s = color.s / 100
    const v = color.v / 100

    const c = v * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = v - c

    let r = 0,
      g = 0,
      b = 0

    if (h < 1 / 6) {
      r = c
      g = x
    } else if (h < 2 / 6) {
      r = x
      g = c
    } else if (h < 3 / 6) {
      g = c
      b = x
    } else if (h < 4 / 6) {
      g = x
      b = c
    } else if (h < 5 / 6) {
      r = x
      b = c
    } else {
      r = c
      b = x
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    }
  }
}

/**
 * Color Picker Manager
 */
export class ColorPickerManager {
  private snapshots: Map<string, ColorSnapshot> = new Map()

  /**
   * Create color snapshot
   */
  createSnapshot(name: string, hex: string, notes: string = ''): ColorSnapshot {
    const rgb = ColorConverter.hexToRgb(hex)
    const hsl = ColorConverter.rgbToHsl(rgb)

    const snapshot: ColorSnapshot = {
      id: `color_${Date.now()}`,
      name,
      hex: hex.toUpperCase(),
      rgb,
      hsl,
      notes,
      createdAt: new Date()
    }

    this.snapshots.set(snapshot.id, snapshot)
    this.saveSnapshots()
    return snapshot
  }

  /**
   * Get color from hex
   */
  getColorFromHex(hex: string) {
    const rgb = ColorConverter.hexToRgb(hex)
    const hsl = ColorConverter.rgbToHsl(rgb)
    const hsv = ColorConverter.rgbToHsv(rgb)

    return { hex, rgb, hsl, hsv }
  }

  /**
   * Create complementary color
   */
  getComplementaryColor(hex: string): string {
    const rgb = ColorConverter.hexToRgb(hex)
    const hsl = ColorConverter.rgbToHsl(rgb)

    hsl.h = (hsl.h + 180) % 360

    const complementaryRgb = ColorConverter.hslToRgb(hsl)
    return ColorConverter.rgbToHex(complementaryRgb)
  }

  /**
   * Create analogous colors (nearby hues)
   */
  getAnalogousColors(hex: string, angle: number = 30): string[] {
    const rgb = ColorConverter.hexToRgb(hex)
    const hsl = ColorConverter.rgbToHsl(rgb)

    const colors: string[] = []

    for (let offset of [-angle, 0, angle]) {
      const newHue = (hsl.h + offset + 360) % 360
      const newHsl = { ...hsl, h: newHue }
      const newRgb = ColorConverter.hslToRgb(newHsl)
      colors.push(ColorConverter.rgbToHex(newRgb))
    }

    return colors
  }

  /**
   * Get color palette (monochromatic)
   */
  getMonochromaticPalette(hex: string, steps: number = 5): string[] {
    const rgb = ColorConverter.hexToRgb(hex)
    const hsl = ColorConverter.rgbToHsl(rgb)

    const palette: string[] = []

    for (let i = 0; i < steps; i++) {
      const lightness = (100 / steps) * (i + 1)
      const newHsl = { ...hsl, l: lightness }
      const newRgb = ColorConverter.hslToRgb(newHsl)
      palette.push(ColorConverter.rgbToHex(newRgb))
    }

    return palette
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): ColorSnapshot[] {
    return Array.from(this.snapshots.values())
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(snapshotId: string): void {
    this.snapshots.delete(snapshotId)
    this.saveSnapshots()
  }

  /**
   * Search snapshots
   */
  searchSnapshots(query: string): ColorSnapshot[] {
    const lower = query.toLowerCase()
    return Array.from(this.snapshots.values()).filter(
      s => s.name.toLowerCase().includes(lower) || s.hex.includes(query)
    )
  }

  /**
   * Export snapshot as swatch
   */
  exportAsCSS(snapshotId: string): string | null {
    const snapshot = this.snapshots.get(snapshotId)
    if (!snapshot) return null

    return `.color-${snapshot.id} { 
  background-color: ${snapshot.hex};
  color: #${snapshot.name};
}`
  }

  /**
   * Save snapshots
   */
  private saveSnapshots(): void {
    const data = Array.from(this.snapshots.values())
    localStorage.setItem('color_snapshots', JSON.stringify(data))
  }

  /**
   * Load snapshots
   */
  loadSnapshots(): void {
    try {
      const data = localStorage.getItem('color_snapshots')
      if (data) {
        const snapshots = JSON.parse(data) as ColorSnapshot[]
        snapshots.forEach(s => {
          s.createdAt = new Date(s.createdAt)
          this.snapshots.set(s.id, s)
        })
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error)
    }
  }
}

export const colorPickerManager = new ColorPickerManager()
