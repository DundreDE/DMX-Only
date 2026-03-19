/**
 * Theme Manager - Custom color theme creation and management
 * Professional theme system with preset templates
 */

export type ThemeColorKey =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'background'
  | 'surface'
  | 'text'
  | 'textSecondary'
  | 'border'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
  info: string
}

export interface Theme {
  id: string
  name: string
  description: string
  colors: ThemeColors
  isBuiltIn: boolean
  tags: string[]
  createdAt: Date
  modifiedAt: Date
}

/**
 * Color utility functions
 */
class ColorUtils {
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1]!, 16),
          g: parseInt(result[2]!, 16),
          b: parseInt(result[3]!, 16)
        }
      : null
  }

  static rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? `0${hex}` : hex
    }).join('')}`
  }

  static lighten(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return hex

    const adjust = (val: number) => Math.min(255, Math.round(val + (255 - val) * (percent / 100)))

    return this.rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b))
  }

  static darken(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return hex

    const adjust = (val: number) => Math.max(0, Math.round(val * (1 - percent / 100)))

    return this.rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b))
  }

  static getContrast(hex: string): 'light' | 'dark' {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return 'light'

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
    return luminance > 0.5 ? 'dark' : 'light'
  }
}

/**
 * Theme Manager
 */
export class ThemeManager {
  private themes: Map<string, Theme> = new Map()
  private currentTheme: Theme | null = null
  private subscribers: Set<(theme: Theme) => void> = new Set()

  // Built-in themes
  private builtInThemes: Theme[] = [
    {
      id: 'dark_mode',
      name: 'Dark Mode',
      description: 'Professional dark theme for lighting control',
      colors: {
        primary: '#6c63ff',
        secondary: '#2563eb',
        accent: '#ec4899',
        background: '#0f1117',
        surface: '#1e2130',
        text: '#e0e0e0',
        textSecondary: '#8b92b0',
        border: '#373d4a',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      isBuiltIn: true,
      tags: ['professional', 'default', 'dark'],
      createdAt: new Date(),
      modifiedAt: new Date()
    },
    {
      id: 'light_mode',
      name: 'Light Mode',
      description: 'Light theme for daytime use',
      colors: {
        primary: '#6366f1',
        secondary: '#2563eb',
        accent: '#f43f5e',
        background: '#ffffff',
        surface: '#f3f4f6',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#d1d5db',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#0284c7'
      },
      isBuiltIn: true,
      tags: ['light', 'daytime'],
      createdAt: new Date(),
      modifiedAt: new Date()
    },
    {
      id: 'neon_theme',
      name: 'Neon',
      description: 'Vibrant neon theme for creative studios',
      colors: {
        primary: '#ff00ff',
        secondary: '#00ffff',
        accent: '#ffff00',
        background: '#0a0a0a',
        surface: '#1a1a2e',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        border: '#00ffff',
        success: '#00ff00',
        warning: '#ff9900',
        error: '#ff0066',
        info: '#00ccff'
      },
      isBuiltIn: true,
      tags: ['neon', 'creative', 'vibrant'],
      createdAt: new Date(),
      modifiedAt: new Date()
    },
    {
      id: 'vintage_theme',
      name: 'Vintage',
      description: 'Warm vintage theme with classic colors',
      colors: {
        primary: '#a0522d',
        secondary: '#8b4513',
        accent: '#cd853f',
        background: '#1a140f',
        surface: '#2f2419',
        text: '#e8dcc8',
        textSecondary: '#b8a998',
        border: '#5d4a38',
        success: '#9acd32',
        warning: '#daa520',
        error: '#cc5500',
        info: '#87ceeb'
      },
      isBuiltIn: true,
      tags: ['vintage', 'warm', 'classic'],
      createdAt: new Date(),
      modifiedAt: new Date()
    }
  ]

  constructor() {
    this.builtInThemes.forEach(t => this.themes.set(t.id, t))
    this.loadThemes()
    this.setCurrentTheme(this.getTheme('dark_mode'))
  }

  /**
   * Create custom theme
   */
  createTheme(name: string, colors: Partial<ThemeColors>, description: string = ''): Theme {
    const defaultColors: ThemeColors = {
      primary: '#6c63ff',
      secondary: '#2563eb',
      accent: '#ec4899',
      background: '#0f1117',
      surface: '#1e2130',
      text: '#e0e0e0',
      textSecondary: '#8b92b0',
      border: '#373d4a',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }

    const theme: Theme = {
      id: `theme_${Date.now()}`,
      name,
      description,
      colors: { ...defaultColors, ...colors },
      isBuiltIn: false,
      tags: [],
      createdAt: new Date(),
      modifiedAt: new Date()
    }

    this.themes.set(theme.id, theme)
    this.saveThemes()
    return theme
  }

  /**
   * Get theme by ID
   */
  getTheme(themeId: string): Theme | undefined {
    return this.themes.get(themeId)
  }

  /**
   * Get all themes
   */
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values())
  }

  /**
   * Get built-in themes only
   */
  getBuiltInThemes(): Theme[] {
    return this.builtInThemes
  }

  /**
   * Get custom themes only
   */
  getCustomThemes(): Theme[] {
    return Array.from(this.themes.values()).filter(t => !t.isBuiltIn)
  }

  /**
   * Set current theme and apply to DOM
   */
  setCurrentTheme(theme: Theme | undefined): void {
    if (!theme) return

    this.currentTheme = theme

    // Apply CSS variables to document root
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--color-${this.toCssVar(key)}`
      document.documentElement.style.setProperty(cssVar, value)
    })

    // Store preference
    localStorage.setItem('current_theme', theme.id)

    // Notify subscribers
    this.subscribers.forEach(cb => cb(theme))
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme | null {
    return this.currentTheme
  }

  /**
   * Update theme colors
   */
  updateTheme(themeId: string, updates: Partial<ThemeColors>): void {
    const theme = this.themes.get(themeId)
    if (theme && !theme.isBuiltIn) {
      Object.assign(theme.colors, updates)
      theme.modifiedAt = new Date()

      if (this.currentTheme?.id === themeId) {
        this.setCurrentTheme(theme)
      }

      this.saveThemes()
    }
  }

  /**
   * Delete custom theme
   */
  deleteTheme(themeId: string): void {
    const theme = this.themes.get(themeId)
    if (theme && !theme.isBuiltIn) {
      this.themes.delete(themeId)

      if (this.currentTheme?.id === themeId) {
        const fallback = this.getTheme('dark_mode')
        if (fallback) this.setCurrentTheme(fallback)
      }

      this.saveThemes()
    }
  }

  /**
   * Generate theme variations
   */
  generateVariations(baseThemeId: string, count: number = 3): Theme[] {
    const base = this.getTheme(baseThemeId)
    if (!base) return []

    const variations: Theme[] = []

    for (let i = 0; i < count; i++) {
      const intensity = (i + 1) / (count + 1)
      const newColors: ThemeColors = { ...base.colors }

      // Lighten accent colors slightly
      newColors.primary = ColorUtils.lighten(base.colors.primary, intensity * 20)
      newColors.accent = ColorUtils.lighten(base.colors.accent, intensity * 15)

      const theme = this.createTheme(
        `${base.name} Variation ${i + 1}`,
        newColors,
        `Generated variation of ${base.name}`
      )
      variations.push(theme)
    }

    return variations
  }

  /**
   * Get complementary colors
   */
  getComplementaryColors(color: string): { complementary: string; analogous: string[] } {
    const rgb = ColorUtils.hexToRgb(color)
    if (!rgb) return { complementary: color, analogous: [color] }

    // Simple complementary (inverted)
    const complementary = ColorUtils.rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b)

    // Analogous (rotate by 30 degrees in HSL)
    const analogous = [
      ColorUtils.lighten(color, 10),
      ColorUtils.darken(color, 10)
    ]

    return { complementary, analogous }
  }

  /**
   * Export theme as JSON
   */
  exportTheme(themeId: string): string | null {
    const theme = this.getTheme(themeId)
    if (!theme) return null

    return JSON.stringify(theme, null, 2)
  }

  /**
   * Import theme from JSON
   */
  importTheme(jsonData: string): Theme | null {
    try {
      const theme = JSON.parse(jsonData) as Theme
      theme.id = `theme_${Date.now()}`
      theme.isBuiltIn = false
      theme.createdAt = new Date()
      theme.modifiedAt = new Date()

      this.themes.set(theme.id, theme)
      this.saveThemes()
      return theme
    } catch (error) {
      console.error('Failed to import theme:', error)
      return null
    }
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(callback: (theme: Theme) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Save themes to localStorage
   */
  private saveThemes(): void {
    const customThemes = this.getCustomThemes()
    localStorage.setItem('custom_themes', JSON.stringify(customThemes))
  }

  /**
   * Load themes from localStorage
   */
  private loadThemes(): void {
    try {
      const data = localStorage.getItem('custom_themes')
      if (data) {
        const themes = JSON.parse(data) as Theme[]
        themes.forEach(t => {
          t.createdAt = new Date(t.createdAt)
          t.modifiedAt = new Date(t.modifiedAt)
          this.themes.set(t.id, t)
        })
      }

      // Load last used theme
      const lastThemeId = localStorage.getItem('current_theme')
      if (lastThemeId) {
        const theme = this.getTheme(lastThemeId)
        if (theme) {
          this.setCurrentTheme(theme)
        }
      }
    } catch (error) {
      console.error('Failed to load themes:', error)
    }
  }

  /**
   * Convert camelCase to CSS var format
   */
  private toCssVar(key: string): string {
    return key.replace(/([A-Z])/g, '-$1').toLowerCase()
  }
}

export const themeManager = new ThemeManager()
