/**
 * AutoFocusSystem - Automatic Focus & Position on Stage Points
 * 
 * Professional feature: Position fixtures to "look at" specific stage locations
 * - Define focus points (stage positions, audience, etc)
 * - Auto-calculate pan/tilt for multiple fixtures
 * - Create focus tracking groups
 */

export interface FocusPoint {
  id: string
  name: string
  x: number                 // Stage X (0-100%)
  y: number                 // Stage Y (0-100%)
  z: number                 // Height (0-100%)
  description: string
}

export interface FixtureFocus {
  fixtureId: string
  panChannel: number
  tiltChannel: number
  panMin: number
  panMax: number
  tiltMin: number
  tiltMax: number
  focusOffset: { pan: number, tilt: number }  // Fixture-specific offset
}

export interface FocusTrackingGroup {
  id: string
  name: string
  fixtures: FixtureFocus[]
  currentFocusPoint: string | null
  isTracking: boolean
  transitionTime: number    // Fade time in seconds
}

export class AutoFocusSystem {
  private focusPoints = new Map<string, FocusPoint>()
  private trackingGroups = new Map<string, FocusTrackingGroup>()
  private subscribers: ((update: FocusUpdate) => void)[] = []

  /**
   * Create focus point
   */
  createFocusPoint(name: string, x: number, y: number, z: number = 50): FocusPoint {
    const point: FocusPoint = {
      id: crypto.randomUUID(),
      name,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      z: Math.max(0, Math.min(100, z)),
      description: ''
    }
    this.focusPoints.set(point.id, point)
    return point
  }

  /**
   * Create tracking group
   */
  createTrackingGroup(name: string, fixtures: FixtureFocus[]): FocusTrackingGroup {
    const group: FocusTrackingGroup = {
      id: crypto.randomUUID(),
      name,
      fixtures,
      currentFocusPoint: null,
      isTracking: false,
      transitionTime: 2
    }
    this.trackingGroups.set(group.id, group)
    return group
  }

  /**
   * Add fixture to tracking group
   */
  addFixtureToGroup(groupId: string, fixture: FixtureFocus): void {
    const group = this.trackingGroups.get(groupId)
    if (!group) throw new Error(`Group ${groupId} not found`)
    group.fixtures.push(fixture)
  }

  /**
   * Focus group on point
   */
  focusOnPoint(groupId: string, focusPointId: string, transitionTime?: number): FocusUpdate {
    const group = this.trackingGroups.get(groupId)
    const focusPoint = this.focusPoints.get(focusPointId)

    if (!group || !focusPoint) {
      throw new Error(`Group or focus point not found`)
    }

    if (transitionTime !== undefined) {
      group.transitionTime = transitionTime
    }

    group.currentFocusPoint = focusPointId

    // Calculate pan/tilt for each fixture
    const panTiltValues = new Map<string, { pan: number, tilt: number }>()

    for (const fixture of group.fixtures) {
      const { pan, tilt } = this.calculatePanTilt(focusPoint, fixture)
      panTiltValues.set(fixture.fixtureId, { pan, tilt })
    }

    const update: FocusUpdate = {
      groupId,
      focusPointId,
      fixtures: panTiltValues,
      transitionTime: group.transitionTime
    }

    this.publish(update)
    return update
  }

  /**
   * Focus all fixtures in group on center stage
   */
  focusOnCenterStage(groupId: string): FocusUpdate {
    const centerFocus = this.createFocusPoint('Center Stage', 50, 50)
    return this.focusOnPoint(groupId, centerFocus.id)
  }

  /**
   * Focus on moving person/object (continuous tracking)
   */
  focusOnMovingTarget(groupId: string, x: number, y: number, z: number = 50, transitionTime: number = 0.5): FocusUpdate {
    const tempPoint: FocusPoint = {
      id: '__temp_target__',
      name: 'Moving Target',
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      z: Math.max(0, Math.min(100, z)),
      description: ''
    }

    const group = this.trackingGroups.get(groupId)
    if (!group) throw new Error(`Group ${groupId} not found`)

    const panTiltValues = new Map<string, { pan: number, tilt: number }>()

    for (const fixture of group.fixtures) {
      const { pan, tilt } = this.calculatePanTilt(tempPoint, fixture)
      panTiltValues.set(fixture.fixtureId, { pan, tilt })
    }

    const update: FocusUpdate = {
      groupId,
      focusPointId: '__temp_target__',
      fixtures: panTiltValues,
      transitionTime
    }

    this.publish(update)
    return update
  }

  /**
   * Calculate pan/tilt for fixture to look at focus point
   */
  private calculatePanTilt(focusPoint: FocusPoint, fixture: FixtureFocus): { pan: number, tilt: number } {
    // Simplified calculation - in real world would use 3D geometry
    // For now: map stage X/Y to fixture pan/tilt range

    const normalizedX = focusPoint.x / 100
    const normalizedY = focusPoint.y / 100

    // Calculate pan (based on X position)
    const panRange = fixture.panMax - fixture.panMin
    const pan = fixture.panMin + (panRange * normalizedX) + fixture.focusOffset.pan

    // Calculate tilt (based on Y and Z position)
    const tiltRange = fixture.tiltMax - fixture.tiltMin
    const depthFactor = (focusPoint.z / 100) * 0.5  // Z affects tilt less than X/Y
    const tilt = fixture.tiltMin + (tiltRange * normalizedY * (1 - depthFactor)) + fixture.focusOffset.tilt

    return {
      pan: Math.round(Math.max(0, Math.min(255, pan))),
      tilt: Math.round(Math.max(0, Math.min(255, tilt)))
    }
  }

  /**
   * Create preset focus groups (e.g., "Stage Left Wash", "Follow Spot")
   */
  createPresetGroups(): void {
    // Create standard lighting setups
    const presets = [
      {
        name: 'Stage Wash',
        focusX: 50,
        focusY: 50,
        focusZ: 70
      },
      {
        name: 'Follow Spot',
        focusX: 50,
        focusY: 80,
        focusZ: 60
      },
      {
        name: 'Back Light',
        focusX: 50,
        focusY: 30,
        focusZ: 40
      },
      {
        name: 'Side Light Left',
        focusX: 20,
        focusY: 50,
        focusZ: 50
      },
      {
        name: 'Side Light Right',
        focusX: 80,
        focusY: 50,
        focusZ: 50
      }
    ]

    for (const preset of presets) {
      this.createFocusPoint(preset.name, preset.focusX, preset.focusY, preset.focusZ)
    }
  }

  /**
   * Enable continuous tracking mode
   */
  startTracking(groupId: string): void {
    const group = this.trackingGroups.get(groupId)
    if (group) {
      group.isTracking = true
    }
  }

  /**
   * Stop tracking
   */
  stopTracking(groupId: string): void {
    const group = this.trackingGroups.get(groupId)
    if (group) {
      group.isTracking = false
    }
  }

  /**
   * Get all focus points
   */
  getFocusPoints(): FocusPoint[] {
    return Array.from(this.focusPoints.values())
  }

  /**
   * Get tracking group
   */
  getTrackingGroup(groupId: string): FocusTrackingGroup | undefined {
    return this.trackingGroups.get(groupId)
  }

  /**
   * Subscribe to focus updates
   */
  subscribe(callback: (update: FocusUpdate) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  private publish(update: FocusUpdate): void {
    this.subscribers.forEach(sub => sub(update))
  }
}

export interface FocusUpdate {
  groupId: string
  focusPointId: string
  fixtures: Map<string, { pan: number, tilt: number }>
  transitionTime: number
}

// Global singleton
export const autoFocusSystem = new AutoFocusSystem()
