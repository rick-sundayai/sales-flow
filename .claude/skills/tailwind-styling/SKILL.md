---
name: tailwind-styling
description: Ensures consistent TailwindCSS styling, dark mode support, responsive design, and CSS variable usage. Use when styling components, creating layouts, implementing responsive design, or when the user mentions TailwindCSS, styling, CSS, dark mode, or responsive design.
allowed-tools: Read, Glob
---

# TailwindCSS & Styling Standards

Enforces consistent styling patterns and TailwindCSS usage for the SalesFlow CRM application.

## Instructions

Follow these styling patterns when working with TailwindCSS and component styles.

### Color System

The application uses CSS variables for theming defined in `src/app/globals.css`:

#### Base Colors

```css
/* Dark theme colors */
--background: #191D24        /* Main background */
--surface: #2D3748           /* Cards, elevated surfaces */
--primary: #34D399           /* Mint green accent */
--border: #4A5568            /* Borders and dividers */
--text: #F5F5F5              /* Primary text */
--text-muted: #9CA3AF        /* Secondary text */
```

#### Using Colors in Components

```typescript
// ✅ Correct - use Tailwind color classes
<div className="bg-slate-900 text-white border border-slate-700">
  <h1 className="text-emerald-400">Title</h1>
  <p className="text-gray-400">Description</p>
</div>

// ✅ Correct - use CSS variables for custom colors
<div className="bg-[var(--surface)] text-[var(--text)]">
  Content
</div>

// ❌ Wrong - hardcoded hex colors
<div style={{ backgroundColor: '#2D3748', color: '#F5F5F5' }}>
  Content
</div>
```

### Tailwind Color Palette

Use these Tailwind colors consistently:

```typescript
// Backgrounds
bg-slate-900        // Dark background (#0f172a)
bg-slate-800        // Card background (#1e293b)
bg-slate-700        // Hover states (#334155)

// Text
text-white          // Primary text
text-gray-400       // Secondary text
text-gray-500       // Muted text
text-emerald-400    // Accent text (#34d399)

// Borders
border-slate-700    // Default borders (#334155)
border-slate-600    // Hover borders

// Status colors
bg-emerald-500      // Success (#10b981)
bg-red-500          // Error/Danger (#ef4444)
bg-yellow-500       // Warning (#eab308)
bg-blue-500         // Info (#3b82f6)
```

### Dark Mode Support

The application supports dark mode using `next-themes`. Styles automatically adapt:

```typescript
// ✅ Correct - dark mode variant
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  Content adapts to theme
</div>

// ✅ Correct - using opacity for dark mode
<div className="bg-slate-900/95 backdrop-blur-sm">
  Translucent dark surface
</div>

// ❌ Wrong - no dark mode support
<div className="bg-white text-black">
  Only works in light mode
</div>
```

### Spacing Scale

Use consistent Tailwind spacing:

```typescript
// Padding (p-*)
p-2      // 0.5rem (8px)   - Tight spacing
p-4      // 1rem (16px)    - Default spacing
p-6      // 1.5rem (24px)  - Card padding
p-8      // 2rem (32px)    - Page padding

// Margin (m-*)
m-2      // Small margin
m-4      // Default margin
m-6      // Large margin

// Gap (gap-*)
gap-2    // Tight grid/flex gap
gap-4    // Default gap
gap-6    // Spacious gap

// Space between (space-y-*, space-x-*)
space-y-2   // Vertical spacing between children
space-x-4   // Horizontal spacing between children
```

### Common Spacing Patterns

```typescript
// ✅ Page container
<div className="container mx-auto p-6">
  {/* Page content */}
</div>

// ✅ Card spacing
<div className="p-6 space-y-4">
  <h2>Card Title</h2>
  <p>Card content</p>
</div>

// ✅ Form spacing
<form className="space-y-4">
  <div>
    <label>Field 1</label>
    <input />
  </div>
  <div>
    <label>Field 2</label>
    <input />
  </div>
</form>

// ✅ Grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>
```

### Typography

Use consistent text sizing and weights:

```typescript
// Headings
text-3xl font-bold      // Page titles (h1)
text-2xl font-semibold  // Section titles (h2)
text-xl font-semibold   // Subsection titles (h3)
text-lg font-medium     // Card titles (h4)

// Body text
text-base               // Default text (16px)
text-sm                 // Small text (14px)
text-xs                 // Extra small (12px)

// Text colors
text-white              // Primary text
text-gray-400           // Secondary text
text-gray-500           // Muted text
text-emerald-400        // Accent/link text

// Font weights
font-normal             // 400
font-medium             // 500
font-semibold           // 600
font-bold               // 700
```

### Typography Examples

```typescript
// ✅ Page header
<h1 className="text-3xl font-bold text-white mb-6">
  Dashboard
</h1>

// ✅ Card title
<h3 className="text-lg font-semibold text-white mb-2">
  Active Clients
</h3>

// ✅ Body text
<p className="text-sm text-gray-400">
  This is a description or secondary text.
</p>

// ✅ Muted text
<span className="text-xs text-gray-500">
  Last updated 2 hours ago
</span>
```

### Responsive Design

Use mobile-first responsive breakpoints:

```typescript
// Breakpoints
sm:   // 640px and up   (tablet)
md:   // 768px and up   (small desktop)
lg:   // 1024px and up  (desktop)
xl:   // 1280px and up  (large desktop)
2xl:  // 1536px and up  (extra large)
```

#### Responsive Patterns

```typescript
// ✅ Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Automatically adjusts columns based on screen size */}
</div>

// ✅ Responsive padding
<div className="p-4 md:p-6 lg:p-8">
  {/* More padding on larger screens */}
</div>

// ✅ Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  {/* Larger text on bigger screens */}
</h1>

// ✅ Hide/show based on screen size
<div className="hidden md:block">
  {/* Only visible on medium screens and up */}
</div>

<div className="block md:hidden">
  {/* Only visible on small screens */}
</div>

// ✅ Responsive flex direction
<div className="flex flex-col md:flex-row gap-4">
  {/* Stacks vertically on mobile, horizontal on desktop */}
</div>
```

### Layout Patterns

#### Container

```typescript
// ✅ Page container
<div className="container mx-auto px-4 py-6">
  {/* Content */}
</div>

// ✅ Max-width container
<div className="max-w-7xl mx-auto px-4">
  {/* Constrained width */}
</div>
```

#### Flexbox

```typescript
// ✅ Centered content
<div className="flex items-center justify-center min-h-screen">
  {/* Vertically and horizontally centered */}
</div>

// ✅ Space between
<div className="flex items-center justify-between">
  <div>Left</div>
  <div>Right</div>
</div>

// ✅ Centered with gap
<div className="flex items-center gap-4">
  <Icon />
  <span>Text</span>
</div>
```

#### Grid

```typescript
// ✅ Responsive metrics grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard />
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>

// ✅ Auto-fit grid
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
  {/* Automatically fits columns based on available space */}
</div>
```

### Card Styling

Standard card pattern used throughout the app:

```typescript
// ✅ Default card
<div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
  {/* Card content */}
</div>

// ✅ Card with hover effect
<div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors cursor-pointer">
  {/* Interactive card */}
</div>

// ✅ Card with shadow (elevated)
<div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
  {/* Elevated card */}
</div>
```

### Button Styling

Buttons use shadcn/ui variants:

```typescript
import { Button } from '@/components/ui/button'

// Default variants
<Button variant="default">Primary</Button>       // Emerald accent
<Button variant="secondary">Secondary</Button>   // Slate gray
<Button variant="outline">Outline</Button>       // Transparent with border
<Button variant="ghost">Ghost</Button>           // Transparent
<Button variant="destructive">Delete</Button>    // Red

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>            // Square icon button
```

### Form Input Styling

Consistent input styling:

```typescript
import { Input } from '@/components/ui/input'

// ✅ Correct - using shadcn Input
<Input
  type="email"
  placeholder="email@example.com"
  className="w-full"
/>

// ✅ Custom styling on Input
<Input
  className="bg-slate-900 border-slate-700 text-white placeholder:text-gray-500"
/>
```

### Border Radius

Use consistent border radius:

```typescript
rounded-none    // 0px
rounded-sm      // 0.125rem (2px)
rounded         // 0.25rem (4px)   - Default
rounded-md      // 0.375rem (6px)
rounded-lg      // 0.5rem (8px)    - Cards
rounded-xl      // 0.75rem (12px)
rounded-full    // 9999px          - Circles, pills
```

### Shadows

Use shadows sparingly for elevation:

```typescript
shadow-sm       // Subtle shadow
shadow          // Default shadow
shadow-md       // Medium shadow
shadow-lg       // Large shadow - for modals, elevated cards
shadow-xl       // Extra large
shadow-none     // No shadow
```

### Transitions and Animations

Add smooth transitions for interactive elements:

```typescript
// ✅ Hover transitions
<button className="bg-slate-800 hover:bg-slate-700 transition-colors duration-200">
  Hover me
</button>

// ✅ All properties transition
<div className="transition-all duration-300 ease-in-out">
  {/* Smooth transitions on all changes */}
</div>

// ✅ Transform on hover
<div className="transform hover:scale-105 transition-transform duration-200">
  {/* Scales up on hover */}
</div>
```

### Common Component Patterns

#### Metric Card

```typescript
<div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-medium text-gray-400">Total Clients</h3>
    <Users className="h-5 w-5 text-emerald-400" />
  </div>
  <p className="text-3xl font-bold text-white">1,234</p>
  <p className="text-sm text-gray-500 mt-2">
    +12% from last month
  </p>
</div>
```

#### Modal/Dialog

```typescript
<DialogContent className="bg-slate-800 border-slate-700 text-white">
  <DialogHeader>
    <DialogTitle className="text-xl font-semibold">
      Add New Client
    </DialogTitle>
  </DialogHeader>
  <div className="space-y-4 mt-4">
    {/* Form content */}
  </div>
</DialogContent>
```

#### List Item

```typescript
<div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-semibold text-white">Client Name</h4>
      <p className="text-sm text-gray-400">client@example.com</p>
    </div>
    <Button variant="ghost" size="sm">
      Edit
    </Button>
  </div>
</div>
```

### Utility Class Composition with cn()

Use the `cn()` utility to compose classes:

```typescript
import { cn } from '@/lib/utils'

// ✅ Correct - conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "primary-class",
  className
)}>
  Content
</div>

// ✅ Correct - merging props
interface ButtonProps {
  className?: string
  variant?: "default" | "outline"
}

function CustomButton({ className, variant = "default" }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium",
        variant === "default" && "bg-emerald-500 text-white",
        variant === "outline" && "border border-emerald-500 text-emerald-500",
        className
      )}
    >
      Click me
    </button>
  )
}
```

### Common Pitfalls to Avoid

```typescript
// ❌ Wrong - inline styles instead of Tailwind
<div style={{ padding: '16px', backgroundColor: '#2D3748' }}>
  Content
</div>

// ✅ Correct - Tailwind classes
<div className="p-4 bg-slate-800">
  Content
</div>

// ❌ Wrong - arbitrary values when Tailwind class exists
<div className="p-[16px]">
  Content
</div>

// ✅ Correct - use Tailwind scale
<div className="p-4">
  Content
</div>

// ❌ Wrong - mixing Tailwind with custom CSS
<div className="p-4" style={{ marginTop: '20px' }}>
  Content
</div>

// ✅ Correct - all Tailwind
<div className="p-4 mt-5">
  Content
</div>
```

### Accessibility Considerations

```typescript
// ✅ Good - focus states
<button className="focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900">
  Accessible button
</button>

// ✅ Good - visible focus indicators
<a href="#" className="underline hover:text-emerald-400 focus:text-emerald-400 focus:outline-none">
  Accessible link
</a>

// ✅ Good - sufficient contrast
<div className="bg-slate-900 text-white">
  {/* High contrast for readability */}
</div>
```

## Resources

- TailwindCSS documentation: https://tailwindcss.com/docs
- shadcn/ui components: https://ui.shadcn.com
- next-themes (dark mode): https://github.com/pacocoursey/next-themes

## When to Apply This Skill

Use this Skill when:
- Styling new components
- Creating responsive layouts
- Implementing dark mode support
- Refactoring component styles
- Ensuring consistent design system usage
- Reviewing styling in pull requests
- Setting up new UI patterns
