# Pattern Library & Design System

## 1. Style Guide

### Colors
- **Brand**: `brand-primary`, `brand-secondary`
- **Status**: `status-success`, `status-warning`, `status-error`, `status-info`
- **Surface**: `surface-main`, `surface-alt`, `surface-overlay`
- **Border**: `border-subtle`, `border-default`, `border-strong`, `border-error`
- **Text**: `text-primary`, `text-secondary`, `text-tertiary`, `text-on-brand`

### Spacing & Radius
- **Spacing**: `mx-xs` to `mx-4xl`
- **Radius**: `mx-sm` to `mx-full`

## 2. Component API Reference

### Button
- `variant`: `primary` | `secondary` | `outline` | `ghost` | `danger`
- `size`: `sm` | `md` | `lg` | `icon`
- `isLoading`: boolean
- `leftIcon`, `rightIcon`: ReactNode

### Typography
- `variant`: `display` | `h1` - `h6` | `body` | `caption` | `tiny`
- `tone`: `default` | `muted` | `brand` | `critical` | `success`
- `align`: `left` | `center` | `right`

### Badge
- `variant`: `default` | `success` | `warning` | `error` | `info`
- `outline`: boolean

### Input & Textarea
- `error`: string
- `leftIcon`, `rightIcon`: ReactNode

### Select
- `options`: Array<{ label: string, value: string }>
- `error`: string

### Skeleton
- `variant`: `text` | `circular` | `rectangular`
- `className`: string

## 3. Usage Examples
```tsx
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'

function Example() {
  return (
    <div className="p-mx-md space-y-mx-sm bg-surface-main rounded-mx-md">
      <Typography variant="h2" tone="brand">Title</Typography>
      <Button variant="primary" size="lg">Click Me</Button>
    </div>
  )
}
```

## Changelog
- **v1.0.0**: Initial documentation of atomic components following MX Gestão Preditiva tokens.
