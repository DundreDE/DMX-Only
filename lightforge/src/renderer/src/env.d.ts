/// <reference types="vite/client" />

// Allow Electron-specific drag region CSS property in React style props
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
  }
}
