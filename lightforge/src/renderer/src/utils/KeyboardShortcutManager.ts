/**
 * Keyboard Shortcuts Manager
 * Professional keyboard binding and shortcut system
 */

export type KeyModifier = 'ctrl' | 'shift' | 'alt' | 'meta'
export type ActionContext = 'global' | 'editor' | 'live' | 'settings' | 'modal'

export interface KeyBinding {
  id: string
  action: string
  description: string
  key: string // 'a', 'Enter', 'ArrowUp', etc.
  modifiers: KeyModifier[]
  context: ActionContext
  enabled: boolean
  userDefined: boolean
  createdAt: Date
}

export interface ShortcutAction {
  id: string
  name: string
  description: string
  category: string
  handler: () => void
  context: ActionContext
}

/**
 * Keyboard Shortcut Manager
 */
export class KeyboardShortcutManager {
  private bindings: Map<string, KeyBinding> = new Map()
  private actions: Map<string, ShortcutAction> = new Map()
  private listeners: Set<(e: KeyboardEvent) => void> = new Set()
  private recordingMode: { active: boolean; capture: (e: KeyboardEvent) => void } | null = null

  constructor() {
    this.loadBindings()
    this.initializeDefaultBindings()
  }

  /**
   * Register action
   */
  registerAction(action: ShortcutAction): void {
    this.actions.set(action.id, action)
  }

  /**
   * Create key binding
   */
  createBinding(
    actionId: string,
    key: string,
    modifiers: KeyModifier[] = [],
    context: ActionContext = 'global'
  ): KeyBinding | null {
    const action = this.actions.get(actionId)
    if (!action) return null

    const binding: KeyBinding = {
      id: `binding_${Date.now()}`,
      action: actionId,
      description: action.description,
      key,
      modifiers,
      context,
      enabled: true,
      userDefined: true,
      createdAt: new Date()
    }

    this.bindings.set(binding.id, binding)
    this.saveBindings()
    this.attachListener()

    return binding
  }

  /**
   * Get binding for action
   */
  getBindingForAction(actionId: string, context: ActionContext = 'global'): KeyBinding | undefined {
    return Array.from(this.bindings.values()).find(
      b => b.action === actionId && (b.context === context || b.context === 'global')
    )
  }

  /**
   * Get all bindings for context
   */
  getBindingsForContext(context: ActionContext): KeyBinding[] {
    return Array.from(this.bindings.values()).filter(
      b => (b.context === context || b.context === 'global') && b.enabled
    )
  }

  /**
   * Start recording key
   */
  startRecordingKey(callback: (key: string, modifiers: KeyModifier[]) => void): void {
    this.recordingMode = {
      active: true,
      capture: (e: KeyboardEvent) => {
        const modifiers: KeyModifier[] = []
        if (e.ctrlKey) modifiers.push('ctrl')
        if (e.shiftKey) modifiers.push('shift')
        if (e.altKey) modifiers.push('alt')
        if (e.metaKey) modifiers.push('meta')

        callback(e.key, modifiers)
        this.stopRecordingKey()
      }
    }

    document.addEventListener('keydown', this.recordingMode.capture)
  }

  /**
   * Stop recording key
   */
  stopRecordingKey(): void {
    if (this.recordingMode) {
      document.removeEventListener('keydown', this.recordingMode.capture)
      this.recordingMode = null
    }
  }

  /**
   * Check if key combination matches
   */
  private matchesKeyBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
    const eventModifiers: KeyModifier[] = []
    if (event.ctrlKey) eventModifiers.push('ctrl')
    if (event.shiftKey) eventModifiers.push('shift')
    if (event.altKey) eventModifiers.push('alt')
    if (event.metaKey) eventModifiers.push('meta')

    const keyMatches = event.key.toLowerCase() === binding.key.toLowerCase()
    const modifiersMatch =
      eventModifiers.length === binding.modifiers.length &&
      eventModifiers.every(m => binding.modifiers.includes(m))

    return keyMatches && modifiersMatch
  }

  /**
   * Attach global keyboard listener
   */
  private attachListener(): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (this.recordingMode?.active) return

      const matchedBindings = Array.from(this.bindings.values()).filter(
        b => b.enabled && this.matchesKeyBinding(event, b)
      )

      for (const binding of matchedBindings) {
        const action = this.actions.get(binding.action)
        if (action) {
          event.preventDefault()
          action.handler()
          break
        }
      }
    }

    if (this.listeners.size === 0) {
      document.addEventListener('keydown', handleKeyDown)
    }

    this.listeners.add(handleKeyDown)
  }

  /**
   * Disable binding
   */
  disableBinding(bindingId: string): void {
    const binding = this.bindings.get(bindingId)
    if (binding) {
      binding.enabled = false
      this.saveBindings()
    }
  }

  /**
   * Enable binding
   */
  enableBinding(bindingId: string): void {
    const binding = this.bindings.get(bindingId)
    if (binding) {
      binding.enabled = true
      this.saveBindings()
    }
  }

  /**
   * Update binding
   */
  updateBinding(bindingId: string, updates: Partial<KeyBinding>): void {
    const binding = this.bindings.get(bindingId)
    if (binding && binding.userDefined) {
      Object.assign(binding, updates)
      this.saveBindings()
    }
  }

  /**
   * Delete binding
   */
  deleteBinding(bindingId: string): void {
    const binding = this.bindings.get(bindingId)
    if (binding && binding.userDefined) {
      this.bindings.delete(bindingId)
      this.saveBindings()
    }
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    const userBindings = Array.from(this.bindings.values()).filter(b => b.userDefined)
    userBindings.forEach(b => this.bindings.delete(b.id))
    this.saveBindings()
  }

  /**
   * Get shortcut display string
   */
  getDisplayString(binding: KeyBinding): string {
    const mods = binding.modifiers.map(m => {
      switch (m) {
        case 'ctrl':
          return 'Ctrl'
        case 'shift':
          return 'Shift'
        case 'alt':
          return 'Alt'
        case 'meta':
          return 'Cmd'
      }
    })

    const key = binding.key === ' ' ? 'Space' : binding.key.toUpperCase()
    return [...mods, key].join('+')
  }

  /**
   * Export all bindings
   */
  exportBindings(): string {
    const data = Array.from(this.bindings.values())
      .filter(b => b.userDefined)
      .map(b => ({
        action: b.action,
        key: b.key,
        modifiers: b.modifiers,
        context: b.context
      }))

    return JSON.stringify(data, null, 2)
  }

  /**
   * Import bindings
   */
  importBindings(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)
      data.forEach(
        (b: { action: string; key: string; modifiers: KeyModifier[]; context: ActionContext }) => {
          this.createBinding(b.action, b.key, b.modifiers, b.context)
        }
      )
    } catch (error) {
      console.error('Failed to import bindings:', error)
    }
  }

  /**
   * Get all bindings
   */
  getAllBindings(): KeyBinding[] {
    return Array.from(this.bindings.values())
  }

  /**
   * Get conflicting bindings
   */
  getConflicts(): Array<{
    bindings: KeyBinding[]
    keyCombo: string
  }> {
    const conflicts: Array<{ bindings: KeyBinding[]; keyCombo: string }> = []
    const keyMap = new Map<string, KeyBinding[]>()

    this.bindings.forEach(binding => {
      if (!binding.enabled) return

      const keyCombo = `${binding.modifiers.join('+')}+${binding.key}`
      if (!keyMap.has(keyCombo)) {
        keyMap.set(keyCombo, [])
      }
      keyMap.get(keyCombo)!.push(binding)
    })

    keyMap.forEach((bindings, keyCombo) => {
      if (bindings.length > 1) {
        conflicts.push({ bindings, keyCombo })
      }
    })

    return conflicts
  }

  /**
   * Save bindings to localStorage
   */
  private saveBindings(): void {
    const userBindings = Array.from(this.bindings.values()).filter(b => b.userDefined)
    localStorage.setItem('keyboard_bindings', JSON.stringify(userBindings))
  }

  /**
   * Load bindings from localStorage
   */
  private loadBindings(): void {
    try {
      const data = localStorage.getItem('keyboard_bindings')
      if (data) {
        const bindings = JSON.parse(data) as KeyBinding[]
        bindings.forEach(b => {
          b.createdAt = new Date(b.createdAt)
          this.bindings.set(b.id, b)
        })
      }
    } catch (error) {
      console.error('Failed to load bindings:', error)
    }
  }

  /**
   * Initialize default bindings
   */
  private initializeDefaultBindings(): void {
    const defaultBindings: KeyBinding[] = [
      {
        id: 'default_play_pause',
        action: 'play-pause',
        description: 'Play/Pause playback',
        key: ' ',
        modifiers: [],
        context: 'live',
        enabled: true,
        userDefined: false,
        createdAt: new Date()
      },
      {
        id: 'default_blackout',
        action: 'blackout',
        description: 'Toggle blackout',
        key: 'b',
        modifiers: ['shift'],
        context: 'global',
        enabled: true,
        userDefined: false,
        createdAt: new Date()
      },
      {
        id: 'default_save',
        action: 'save-project',
        description: 'Save project',
        key: 's',
        modifiers: ['ctrl'],
        context: 'global',
        enabled: true,
        userDefined: false,
        createdAt: new Date()
      },
      {
        id: 'default_undo',
        action: 'undo',
        description: 'Undo last action',
        key: 'z',
        modifiers: ['ctrl'],
        context: 'editor',
        enabled: true,
        userDefined: false,
        createdAt: new Date()
      },
      {
        id: 'default_redo',
        action: 'redo',
        description: 'Redo last action',
        key: 'y',
        modifiers: ['ctrl'],
        context: 'editor',
        enabled: true,
        userDefined: false,
        createdAt: new Date()
      }
    ]

    defaultBindings.forEach(b => {
      if (!this.bindings.has(b.id)) {
        this.bindings.set(b.id, b)
      }
    })
  }
}

export const keyboardManager = new KeyboardShortcutManager()
