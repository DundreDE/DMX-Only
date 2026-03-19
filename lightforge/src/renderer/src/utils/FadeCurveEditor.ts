/**
 * Fade Curve Editor - Custom Bezier fade profiles
 * Professional fade curve definition and blending
 */

export type CurveType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'custom'

export interface BezierPoint {
  x: number // 0-1 (time)
  y: number // 0-1 (value)
}

export interface FadeCurve {
  id: string
  name: string
  type: CurveType
  controlPoints: BezierPoint[] // for custom curves
  duration: number // ms
  description: string
  tags: string[]
  createdAt: Date
}

/**
 * Fade Curve Calculator
 */
export class FadeCurveCalculator {
  /**
   * Linear fade (default)
   */
  static linear(t: number): number {
    return Math.max(0, Math.min(1, t))
  }

  /**
   * Ease-in (quadratic)
   */
  static easeIn(t: number): number {
    t = Math.max(0, Math.min(1, t))
    return t * t
  }

  /**
   * Ease-out (quadratic)
   */
  static easeOut(t: number): number {
    t = Math.max(0, Math.min(1, t))
    return 1 - (1 - t) * (1 - t)
  }

  /**
   * Ease-in-out (quadratic)
   */
  static easeInOut(t: number): number {
    t = Math.max(0, Math.min(1, t))
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  /**
   * Cubic easing in
   */
  static easeInCubic(t: number): number {
    t = Math.max(0, Math.min(1, t))
    return t * t * t
  }

  /**
   * Cubic easing out
   */
  static easeOutCubic(t: number): number {
    t = Math.max(0, Math.min(1, t))
    return 1 - Math.pow(1 - t, 3)
  }

  /**
   * Exponential easing in
   */
  static easeInExpo(t: number): number {
    t = Math.max(0, Math.min(1, t))
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
  }

  /**
   * Exponential easing out
   */
  static easeOutExpo(t: number): number {
    t = Math.max(0, Math.min(1, t))
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
  }

  /**
   * Cubic Bezier interpolation (4-point)
   * p0 = (0, 0), p3 = (1, 1) - fixed
   * p1, p2 = control points
   */
  static cubicBezier(t: number, p1: BezierPoint, p2: BezierPoint): number {
    t = Math.max(0, Math.min(1, t))

    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    const t2 = t * t
    const t3 = t2 * t

    // Bezier calculation
    const x = mt3 * 0 + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * 1
    const y = mt3 * 0 + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * 1

    // Find t value for x coordinate and return y
    let xt = t
    for (let i = 0; i < 5; i++) {
      const mxt = 1 - xt
      const dx = 3 * mxt * mxt * (p1.x - 0) + 6 * mxt * xt * (p2.x - p1.x) + 3 * xt * xt * (1 - p2.x)

      if (Math.abs(dx) < 0.001) break

      const fxt = mxt * mxt * mxt * 0 + 3 * mxt * mxt * xt * p1.x + 3 * mxt * xt * xt * p2.x + xt * xt * xt * 1 - x

      xt = xt - fxt / dx
    }

    // Calculate y at the found t
    const mxt = 1 - xt
    const yValue = mxt * mxt * mxt * 0 + 3 * mxt * mxt * xt * p1.y + 3 * mxt * xt * xt * p2.y + xt * xt * xt * 1

    return Math.max(0, Math.min(1, yValue))
  }

  /**
   * Get value at time for curve type
   */
  static getValue(t: number, curve: FadeCurve): number {
    const normalizedT = Math.max(0, Math.min(1, t))

    switch (curve.type) {
      case 'linear':
        return this.linear(normalizedT)

      case 'easeIn':
        return this.easeInCubic(normalizedT)

      case 'easeOut':
        return this.easeOutCubic(normalizedT)

      case 'easeInOut':
        return this.easeInOut(normalizedT)

      case 'custom':
        if (curve.controlPoints.length >= 2) {
          return this.cubicBezier(normalizedT, curve.controlPoints[0]!, curve.controlPoints[1]!)
        }
        return this.linear(normalizedT)

      default:
        return this.linear(normalizedT)
    }
  }

  /**
   * Sample curve into array
   */
  static sampleCurve(curve: FadeCurve, samples: number = 100): number[] {
    const values: number[] = []

    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1)
      values.push(this.getValue(t, curve))
    }

    return values
  }
}

/**
 * Fade Curve Manager
 */
export class FadeCurveManager {
  private curves: Map<string, FadeCurve> = new Map()

  // Built-in curves
  private builtInCurves: Record<CurveType, FadeCurve> = {
    linear: {
      id: 'built_in_linear',
      name: 'Linear',
      type: 'linear',
      controlPoints: [],
      duration: 1000,
      description: 'Constant rate of change',
      tags: ['built-in', 'standard'],
      createdAt: new Date()
    },
    easeIn: {
      id: 'built_in_easeIn',
      name: 'Ease In',
      type: 'easeIn',
      controlPoints: [],
      duration: 1000,
      description: 'Slow start, accelerate',
      tags: ['built-in', 'standard'],
      createdAt: new Date()
    },
    easeOut: {
      id: 'built_in_easeOut',
      name: 'Ease Out',
      type: 'easeOut',
      controlPoints: [],
      duration: 1000,
      description: 'Fast start, decelerate',
      tags: ['built-in', 'standard'],
      createdAt: new Date()
    },
    easeInOut: {
      id: 'built_in_easeInOut',
      name: 'Ease In Out',
      type: 'easeInOut',
      controlPoints: [],
      duration: 1000,
      description: 'Slow start and end',
      tags: ['built-in', 'standard'],
      createdAt: new Date()
    },
    custom: {
      id: 'built_in_custom',
      name: 'Custom',
      type: 'custom',
      controlPoints: [
        { x: 0.33, y: 0.5 },
        { x: 0.67, y: 0.8 }
      ],
      duration: 1000,
      description: 'User-defined curve',
      tags: ['built-in', 'custom'],
      createdAt: new Date()
    }
  }

  constructor() {
    // Initialize with built-in curves
    Object.values(this.builtInCurves).forEach(curve => {
      this.curves.set(curve.id, curve)
    })
    this.loadCurves()
  }

  /**
   * Create custom fade curve
   */
  createCurve(
    name: string,
    controlPoints: BezierPoint[],
    duration: number = 1000
  ): FadeCurve {
    const curve: FadeCurve = {
      id: `curve_${Date.now()}`,
      name,
      type: 'custom',
      controlPoints,
      duration,
      description: '',
      tags: [],
      createdAt: new Date()
    }

    this.curves.set(curve.id, curve)
    this.saveCurves()
    return curve
  }

  /**
   * Get curve by ID
   */
  getCurve(curveId: string): FadeCurve | undefined {
    return this.curves.get(curveId)
  }

  /**
   * Get all curves
   */
  getAllCurves(): FadeCurve[] {
    return Array.from(this.curves.values())
  }

  /**
   * Get built-in curves only
   */
  getBuiltInCurves(): FadeCurve[] {
    return Object.values(this.builtInCurves)
  }

  /**
   * Get custom curves only
   */
  getCustomCurves(): FadeCurve[] {
    return Array.from(this.curves.values()).filter(c => !c.id.startsWith('built_in_'))
  }

  /**
   * Update curve
   */
  updateCurve(curveId: string, updates: Partial<FadeCurve>): void {
    const curve = this.curves.get(curveId)
    if (curve && !curveId.startsWith('built_in_')) {
      Object.assign(curve, updates)
      this.saveCurves()
    }
  }

  /**
   * Delete curve
   */
  deleteCurve(curveId: string): void {
    if (!curveId.startsWith('built_in_')) {
      this.curves.delete(curveId)
      this.saveCurves()
    }
  }

  /**
   * Duplicate curve
   */
  duplicateCurve(curveId: string, newName: string): FadeCurve | null {
    const original = this.curves.get(curveId)
    if (!original) return null

    return this.createCurve(newName, original.controlPoints, original.duration)
  }

  /**
   * Get fade value at time
   */
  getValue(curveId: string, currentTime: number, totalDuration: number): number {
    const curve = this.curves.get(curveId)
    if (!curve) return 0

    const t = currentTime / totalDuration
    return FadeCurveCalculator.getValue(t, curve)
  }

  /**
   * Sample curve for visualization
   */
  sampleCurve(curveId: string, samples: number = 100): number[] {
    const curve = this.curves.get(curveId)
    if (!curve) return []

    return FadeCurveCalculator.sampleCurve(curve, samples)
  }

  /**
   * Find curves by tag
   */
  findByTag(tag: string): FadeCurve[] {
    return Array.from(this.curves.values()).filter(c => c.tags.includes(tag))
  }

  /**
   * Export curve as SVG path
   */
  exportAsSVG(curveId: string, width: number = 200, height: number = 100): string {
    const samples = this.sampleCurve(curveId, 100)
    if (samples.length === 0) return ''

    const points = samples.map((y, i) => {
      const x = (i / (samples.length - 1)) * width
      const py = height - y * height
      return `${x},${py}`
    })

    const pathData = `M${points[0]} L${points.join(' L')}`

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="${pathData}" stroke="currentColor" stroke-width="2" fill="none"/>
    </svg>`
  }

  /**
   * Save curves to localStorage
   */
  private saveCurves(): void {
    const customCurves = this.getCustomCurves()
    localStorage.setItem('fade_curves', JSON.stringify(customCurves))
  }

  /**
   * Load curves from localStorage
   */
  private loadCurves(): void {
    try {
      const data = localStorage.getItem('fade_curves')
      if (data) {
        const curves = JSON.parse(data) as FadeCurve[]
        curves.forEach(c => {
          c.createdAt = new Date(c.createdAt)
          this.curves.set(c.id, c)
        })
      }
    } catch (error) {
      console.error('Failed to load fade curves:', error)
    }
  }

  /**
   * Export curves as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.getCustomCurves(), null, 2)
  }

  /**
   * Import curves from JSON
   */
  importJSON(jsonData: string): void {
    try {
      const curves = JSON.parse(jsonData) as FadeCurve[]
      curves.forEach(c => {
        c.createdAt = new Date(c.createdAt)
        this.curves.set(c.id, c)
      })
      this.saveCurves()
    } catch (error) {
      console.error('Failed to import curves:', error)
    }
  }
}

export const fadeCurveManager = new FadeCurveManager()
