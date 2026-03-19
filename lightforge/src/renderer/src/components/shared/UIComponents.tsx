import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const variantClass = {
      primary: 'btn btn-primary',
      secondary: 'btn btn-secondary',
      danger: 'btn btn-danger'
    }[variant]

    return (
      <button ref={ref} className={`${variantClass}`} disabled={loading || props.disabled} {...props}>
        {loading ? '...' : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="label">{label}</label>}
        <input ref={ref} className="input" {...props} />
        {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ elevated, className, ...props }, ref) => {
    return (
      <div ref={ref} className={`${elevated ? 'card-elevated' : 'card'} ${className || ''}`} {...props} />
    )
  }
)

Card.displayName = 'Card'

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  footer?: React.ReactNode
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ header, footer, children, ...props }, ref) => {
    return (
      <div ref={ref} className="panel" {...props}>
        {header && <div className="panel-header">{header}</div>}
        <div className="panel-content">{children}</div>
        {footer && <div className="panel-footer">{footer}</div>}
      </div>
    )
  }
)

Panel.displayName = 'Panel'

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  value?: number
  onChange?: (value: number) => void
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ label, value, onChange, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && <label className="label">{label}</label>}
        <input
          ref={ref}
          type="range"
          className="input"
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = 'Slider'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'success' | 'danger' | 'warning'
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = 'primary', className, ...props }, ref) => {
    const variantClass = {
      primary: 'badge badge-primary',
      success: 'badge badge-success',
      danger: 'badge badge-danger',
      warning: 'badge badge-warning'
    }[variant]

    return <div ref={ref} className={`${variantClass} ${className || ''}`} {...props} />
  }
)

Badge.displayName = 'Badge'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="label">{label}</label>}
        <select ref={ref} className="input" {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)

Select.displayName = 'Select'

export const Divider = () => {
  return <div className="border-t border-[var(--color-border)]"></div>
}

interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  direction?: 'horizontal' | 'vertical'
}

export const Spacer: React.FC<SpacerProps> = ({ size = 'md', direction = 'vertical' }) => {
  const sizeMap = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }

  return direction === 'vertical' ? (
    <div style={{ height: sizeMap[size] }} />
  ) : (
    <div style={{ width: sizeMap[size] }} />
  )
}
