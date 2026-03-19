/**
 * Professional Fixture Group Management System
 * Organize and manage fixture groups with advanced selection and operations
 */

export interface FixtureGroup {
  id: string
  name: string
  description: string
  fixtures: string[]
  color?: string
  icon?: string
  tags: string[]
  createdAt: Date
  modifiedAt: Date
}

export interface GroupOperation {
  type: 'setLevel' | 'setColor' | 'setEffect' | 'fadeIn' | 'fadeOut' | 'blackout'
  groupId: string
  parameters: Record<string, any>
  duration?: number
}

export interface GroupHierarchy {
  parentId?: string
  children: string[]
}

/**
 * Fixture Group Manager
 */
export class FixtureGroupManager {
  private groups: Map<string, FixtureGroup> = new Map()
  private hierarchy: Map<string, GroupHierarchy> = new Map()
  private operations: GroupOperation[] = []

  /**
   * Create new fixture group
   */
  createGroup(
    name: string,
    fixtureIds: string[] = [],
    description: string = ''
  ): FixtureGroup {
    const group: FixtureGroup = {
      id: `group_${Date.now()}`,
      name,
      description,
      fixtures: fixtureIds,
      tags: [],
      createdAt: new Date(),
      modifiedAt: new Date()
    }

    this.groups.set(group.id, group)
    this.hierarchy.set(group.id, { children: [] })
    this.saveGroups()
    return group
  }

  /**
   * Add fixtures to group
   */
  addFixturesToGroup(groupId: string, fixtureIds: string[]): void {
    const group = this.groups.get(groupId)
    if (group) {
      const existing = new Set(group.fixtures)
      fixtureIds.forEach(id => existing.add(id))
      group.fixtures = Array.from(existing)
      group.modifiedAt = new Date()
      this.saveGroups()
    }
  }

  /**
   * Remove fixtures from group
   */
  removeFixturesFromGroup(groupId: string, fixtureIds: string[]): void {
    const group = this.groups.get(groupId)
    if (group) {
      const toRemove = new Set(fixtureIds)
      group.fixtures = group.fixtures.filter(id => !toRemove.has(id))
      group.modifiedAt = new Date()
      this.saveGroups()
    }
  }

  /**
   * Create group hierarchy (nested groups)
   */
  setGroupParent(childGroupId: string, parentGroupId: string | null): void {
    const child = this.hierarchy.get(childGroupId)
    if (!child) return

    if (parentGroupId) {
      const parent = this.hierarchy.get(parentGroupId)
      if (parent) {
        child.parentId = parentGroupId
        parent.children.push(childGroupId)
      }
    } else {
      if (child.parentId) {
        const oldParent = this.hierarchy.get(child.parentId)
        if (oldParent) {
          oldParent.children = oldParent.children.filter(id => id !== childGroupId)
        }
      }
      child.parentId = undefined
    }

    this.saveGroups()
  }

  /**
   * Get all fixtures in group (including nested)
   */
  getAllFixturesInGroup(groupId: string): string[] {
    const fixtures = new Set<string>()
    const hierarchy = this.hierarchy.get(groupId)
    const group = this.groups.get(groupId)

    if (group) {
      group.fixtures.forEach(f => fixtures.add(f))
    }

    if (hierarchy?.children) {
      hierarchy.children.forEach(childId => {
        const childFixtures = this.getAllFixturesInGroup(childId)
        childFixtures.forEach(f => fixtures.add(f))
      })
    }

    return Array.from(fixtures)
  }

  /**
   * Apply operation to group
   */
  applyOperation(groupId: string, operation: Omit<GroupOperation, 'groupId'>): void {
    const fullOperation: GroupOperation = {
      ...operation,
      groupId
    }

    this.operations.push(fullOperation)

    const fixtures = this.getAllFixturesInGroup(groupId)
    this.executeGroupOperation(fixtures, fullOperation)
  }

  /**
   * Execute group operation
   */
  private executeGroupOperation(fixtureIds: string[], op: GroupOperation): void {
    switch (op.type) {
      case 'setLevel':
        fixtureIds.forEach(id => {
          console.log(`Set level for fixture ${id} to ${op.parameters.level}`)
        })
        break

      case 'setColor':
        fixtureIds.forEach(id => {
          console.log(`Set color for fixture ${id} to ${op.parameters.color}`)
        })
        break

      case 'fadeIn':
        fixtureIds.forEach(id => {
          console.log(`Fade in fixture ${id} over ${op.duration}ms`)
        })
        break

      case 'fadeOut':
        fixtureIds.forEach(id => {
          console.log(`Fade out fixture ${id} over ${op.duration}ms`)
        })
        break

      case 'blackout':
        fixtureIds.forEach(id => {
          console.log(`Blackout fixture ${id}`)
        })
        break

      case 'setEffect':
        fixtureIds.forEach(id => {
          console.log(`Apply effect to fixture ${id}:`, op.parameters.effect)
        })
        break
    }
  }

  /**
   * Tag fixtures in group
   */
  tagGroup(groupId: string, tags: string[]): void {
    const group = this.groups.get(groupId)
    if (group) {
      const existingTags = new Set(group.tags)
      tags.forEach(t => existingTags.add(t))
      group.tags = Array.from(existingTags)
      group.modifiedAt = new Date()
      this.saveGroups()
    }
  }

  /**
   * Find groups by tag
   */
  findGroupsByTag(tag: string): FixtureGroup[] {
    return Array.from(this.groups.values()).filter(g => g.tags.includes(tag))
  }

  /**
   * Combine multiple groups
   */
  combineGroups(groupIds: string[], name: string): FixtureGroup | null {
    const allFixtures = new Set<string>()

    groupIds.forEach(id => {
      const fixtures = this.getAllFixturesInGroup(id)
      fixtures.forEach(f => allFixtures.add(f))
    })

    if (allFixtures.size === 0) return null

    return this.createGroup(name, Array.from(allFixtures), `Combined from ${groupIds.length} groups`)
  }

  /**
   * Get group statistics
   */
  getGroupStats(groupId: string) {
    const group = this.groups.get(groupId)
    if (!group) return null

    const allFixtures = this.getAllFixturesInGroup(groupId)
    const hierarchy = this.hierarchy.get(groupId)

    return {
      groupId,
      name: group.name,
      directFixtures: group.fixtures.length,
      totalFixtures: allFixtures.length,
      childGroups: hierarchy?.children.length || 0,
      tags: group.tags,
      createdAt: group.createdAt,
      modifiedAt: group.modifiedAt
    }
  }

  /**
   * Delete group
   */
  deleteGroup(groupId: string): void {
    const hierarchy = this.hierarchy.get(groupId)
    if (hierarchy?.parentId) {
      const parent = this.hierarchy.get(hierarchy.parentId)
      if (parent) {
        parent.children = parent.children.filter(id => id !== groupId)
      }
    }

    this.groups.delete(groupId)
    this.hierarchy.delete(groupId)
    this.saveGroups()
  }

  /**
   * Get all groups
   */
  getAllGroups(): FixtureGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * Get group by ID
   */
  getGroup(groupId: string): FixtureGroup | undefined {
    return this.groups.get(groupId)
  }

  /**
   * Save groups to localStorage
   */
  private saveGroups(): void {
    const data = {
      groups: Array.from(this.groups.values()),
      hierarchy: Array.from(this.hierarchy.entries())
    }
    localStorage.setItem('fixture_groups', JSON.stringify(data))
  }

  /**
   * Load groups from localStorage
   */
  loadGroups(): void {
    try {
      const data = localStorage.getItem('fixture_groups')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.groups.forEach((g: FixtureGroup) => {
          g.createdAt = new Date(g.createdAt)
          g.modifiedAt = new Date(g.modifiedAt)
          this.groups.set(g.id, g)
        })

        parsed.hierarchy.forEach(([key, value]: [string, GroupHierarchy]) => {
          this.hierarchy.set(key, value)
        })
      }
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  /**
   * Export groups as JSON
   */
  exportGroups(): string {
    const data = {
      groups: Array.from(this.groups.values()),
      exported: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import groups from JSON
   */
  importGroups(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)
      data.groups.forEach((g: FixtureGroup) => {
        g.createdAt = new Date(g.createdAt)
        g.modifiedAt = new Date(g.modifiedAt)
        this.groups.set(g.id, g)
        this.hierarchy.set(g.id, { children: [] })
      })
      this.saveGroups()
    } catch (error) {
      console.error('Failed to import groups:', error)
    }
  }
}

export const fixtureGroupManager = new FixtureGroupManager()
