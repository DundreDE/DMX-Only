/**
 * LightForge Design System Guide
 * Complete visual reference for all design tokens, components, and utilities
 */

export const DesignSystemGuide = () => {
  return (
    <div className="flex flex-col gap-8 p-8 bg-[var(--color-bg-base)] text-[var(--color-text-primary)] min-h-screen overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">LightForge Design System</h1>
        <p className="text-[var(--color-text-secondary)]">Professional DMX Lighting Control Interface</p>
      </div>

      {/* Color Palette */}
      <section className="card-elevated">
        <h2 className="text-2xl font-semibold mb-6">Color Palette</h2>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {/* Backgrounds */}
          <div>
            <h3 className="font-semibold mb-4">Backgrounds</h3>
            <div className="space-y-2">
              <div className="color-swatch bg-[var(--color-bg-base)] border border-[var(--color-border)] h-16 rounded flex items-center justify-center text-xs">
                Base
              </div>
              <div className="color-swatch bg-[var(--color-bg-surface)] border border-[var(--color-border)] h-16 rounded flex items-center justify-center text-xs">
                Surface
              </div>
              <div className="color-swatch bg-[var(--color-bg-elevated)] border border-[var(--color-border)] h-16 rounded flex items-center justify-center text-xs">
                Elevated
              </div>
              <div className="color-swatch bg-[var(--color-bg-input)] border border-[var(--color-border)] h-16 rounded flex items-center justify-center text-xs">
                Input
              </div>
            </div>
          </div>

          {/* Primary */}
          <div>
            <h3 className="font-semibold mb-4">Primary Accent</h3>
            <div className="space-y-2">
              <div className="color-swatch bg-[var(--color-accent)] h-16 rounded flex items-center justify-center text-xs text-white font-semibold">
                #6C63FF
              </div>
              <div className="color-swatch bg-[var(--color-accent-hover)] h-16 rounded flex items-center justify-center text-xs text-white font-semibold">
                Hover
              </div>
              <div className="color-swatch bg-[var(--color-accent-active)] h-16 rounded flex items-center justify-center text-xs text-white font-semibold">
                Active
              </div>
              <div className="color-swatch bg-[var(--color-accent-light)] h-16 rounded flex items-center justify-center text-xs text-white font-semibold">
                Light
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-semibold mb-4">Status Colors</h3>
            <div className="space-y-2">
              <div className="color-swatch bg-[var(--color-success)] h-16 rounded flex items-center justify-center text-xs text-black font-semibold">
                Success
              </div>
              <div className="color-swatch bg-[var(--color-warning)] h-16 rounded flex items-center justify-center text-xs text-black font-semibold">
                Warning
              </div>
              <div className="color-swatch bg-[var(--color-danger)] h-16 rounded flex items-center justify-center text-xs text-white font-semibold">
                Danger
              </div>
              <div className="color-swatch bg-[var(--color-info)] h-16 rounded flex items-center justify-center text-xs text-black font-semibold">
                Info
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <h3 className="font-semibold mb-4">Text Colors</h3>
            <div className="space-y-2">
              <div className="color-swatch bg-[var(--color-text-primary)] text-black h-16 rounded flex items-center justify-center text-xs font-semibold">
                Primary
              </div>
              <div className="color-swatch bg-[var(--color-text-secondary)] text-white h-16 rounded flex items-center justify-center text-xs font-semibold">
                Secondary
              </div>
              <div className="color-swatch bg-[var(--color-text-muted)] text-white h-16 rounded flex items-center justify-center text-xs font-semibold">
                Muted
              </div>
              <div className="color-swatch bg-[var(--color-text-disabled)] text-white h-16 rounded flex items-center justify-center text-xs font-semibold">
                Disabled
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Button Components */}
      <section className="card-elevated">
        <h2 className="text-2xl font-semibold mb-6">Button Components</h2>
        <div className="grid grid-cols-3 gap-8">
          {/* Primary */}
          <div>
            <h3 className="font-semibold mb-4">Primary</h3>
            <div className="space-y-3">
              <button className="btn btn-primary">Primary Button</button>
              <button className="btn btn-primary" disabled>
                Disabled
              </button>
              <button className="btn btn-primary text-sm">Small Button</button>
              <button className="btn btn-primary w-full">Full Width</button>
            </div>
          </div>

          {/* Secondary */}
          <div>
            <h3 className="font-semibold mb-4">Secondary</h3>
            <div className="space-y-3">
              <button className="btn btn-secondary">Secondary Button</button>
              <button className="btn btn-secondary" disabled>
                Disabled
              </button>
              <button className="btn btn-secondary text-sm">Small Button</button>
              <button className="btn btn-secondary w-full">Full Width</button>
            </div>
          </div>

          {/* Danger */}
          <div>
            <h3 className="font-semibold mb-4">Danger</h3>
            <div className="space-y-3">
              <button className="btn btn-danger">Danger Button</button>
              <button className="btn btn-danger" disabled>
                Disabled
              </button>
              <button className="btn btn-danger text-sm">Small Button</button>
              <button className="btn btn-danger w-full">Full Width</button>
            </div>
          </div>
        </div>
      </section>

      {/* Input Components */}
      <section className="card-elevated">
        <h2 className="text-2xl font-semibold mb-6">Input Components</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="label">Text Input</label>
            <input type="text" className="input w-full mb-4" placeholder="Enter text..." />

            <label className="label">Number Input</label>
            <input type="number" className="input w-full mb-4" placeholder="Enter number..." />

            <label className="label">Search Input</label>
            <input type="search" className="input w-full" placeholder="Search..." />
          </div>

          <div>
            <label className="label">Range Slider</label>
            <input type="range" className="input w-full mb-6" />

            <label className="label">Select Dropdown</label>
            <select className="input w-full mb-4">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>

            <label className="label">Textarea</label>
            <textarea className="input w-full" placeholder="Enter text..."></textarea>
          </div>
        </div>
      </section>

      {/* Card Components */}
      <section className="card-elevated">
        <h2 className="text-2xl font-semibold mb-6">Card Components</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="card">
            <h3 className="font-semibold mb-2">Card Base</h3>
            <p className="text-[var(--color-text-secondary)] text-sm">Standard card with border and shadow</p>
          </div>

          <div className="card-elevated">
            <h3 className="font-semibold mb-2">Elevated Card</h3>
            <p className="text-[var(--color-text-secondary)] text-sm">Card with enhanced shadow and darker background</p>
          </div>
        </div>
      </section>

      {/* Panel Components */}
      <section className="card-elevated">
        <h2 className="text-2xl font-semibold mb-6">Panel Components</h2>
        <div className="panel mb-6">
          <div className="panel-header">Scene Editor Settings</div>
          <div className="panel-content">
            <div className="space-y-4">
              <div>
                <label className="label">Effect Type</label>
                <select className="input w-full">
                  <option>Sine Wave</option>
                  <option>Triangle Wave</option>
                  <option>Square Wave</option>
                </select>
              </div>
              <div>
                <label className="label">Speed (BPM)</label>
                <input type="number" className="input w-full" defaultValue={120} />
              </div>
              <div>
                <label className="label">Amplitude</label>
                <input type="range" className="input w-full" />
              </div>
            </div>
          </div>
          <div className="panel-footer">
            <button className="btn btn-secondary">Cancel</button>
            <button className="btn btn-primary">Apply</button>
          </div>
        </div>
      </section>

      {/* Badge Components */}
      <section className="card-elevated">
        <h2 className="text-2xl font-semibold mb-6">Badge Components</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="badge badge-primary">Active</div>
          <div className="badge badge-success">Success</div>
          <div className="badge badge-danger">Error</div>
          <div className="badge badge-primary">New Feature</div>
          <div className="badge badge-warning">deprecated</div>
        </div>
      </section>

      {/* Typography */}
      <section className="card-elevated">
        <h2 className="text-2xl font-semibold mb-6">Typography</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold mb-2">Heading 1 (32px)</h3>
            <h1 className="text-4xl font-bold">The quick brown fox jumps over the lazy dog</h1>
          </div>
          <div>
            <h3 className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold mb-2">Heading 2 (24px)</h3>
            <h2 className="text-2xl font-semibold">The quick brown fox jumps over the lazy dog</h2>
          </div>
          <div>
            <h3 className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold mb-2">Body Text (15px)</h3>
            <p className="text-base">
              The quick brown fox jumps over the lazy dog. This is standard body text used throughout the interface.
            </p>
          </div>
          <div>
            <h3 className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold mb-2">Small Text (12px)</h3>
            <p className="text-sm">The quick brown fox jumps over the lazy dog. This is small text for labels and secondary information.</p>
          </div>
          <div>
            <h3 className="text-xs text-[var(--color-text-secondary)] uppercase font-semibold mb-2">Monospace Code</h3>
            <code className="font-mono text-sm bg-[var(--color-bg-input)] px-3 py-2 rounded inline-block">const scene = createScene()</code>
          </div>
        </div>
      </section>

      {/* Spacing Scale */}
      <section className="card-elevated">
        <h2 className="text-2xl font-semibold mb-6">Spacing Scale</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm font-semibold">XS (4px)</span>
            <div className="bg-[var(--color-accent)] h-8" style={{ width: '4px' }}></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm font-semibold">SM (8px)</span>
            <div className="bg-[var(--color-accent)] h-8" style={{ width: '8px' }}></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm font-semibold">MD (16px)</span>
            <div className="bg-[var(--color-accent)] h-8" style={{ width: '16px' }}></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm font-semibold">LG (24px)</span>
            <div className="bg-[var(--color-accent)] h-8" style={{ width: '24px' }}></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm font-semibold">XL (32px)</span>
            <div className="bg-[var(--color-accent)] h-8" style={{ width: '32px' }}></div>
          </div>
        </div>
      </section>

      {/* Border Radius */}
      <section className="card-elevated mb-12">
        <h2 className="text-2xl font-semibold mb-6">Border Radius</h2>
        <div className="grid grid-cols-5 gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-[var(--color-accent)]" style={{ borderRadius: '0px' }}></div>
            <span className="text-xs text-[var(--color-text-secondary)]">None (0px)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-[var(--color-accent)]" style={{ borderRadius: '2px' }}></div>
            <span className="text-xs text-[var(--color-text-secondary)]">XS (2px)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-[var(--color-accent)]" style={{ borderRadius: '4px' }}></div>
            <span className="text-xs text-[var(--color-text-secondary)]">SM (4px)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-[var(--color-accent)]" style={{ borderRadius: '8px' }}></div>
            <span className="text-xs text-[var(--color-text-secondary)]">MD (8px)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-[var(--color-accent)]" style={{ borderRadius: '50%' }}></div>
            <span className="text-xs text-[var(--color-text-secondary)]">Full (50%)</span>
          </div>
        </div>
      </section>
    </div>
  )
}
