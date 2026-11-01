# Developer Guide: Using Shadcn/ui in GeoAttend

A practical guide for developers working with the Shadcn/ui components in GeoAttend.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Component Usage](#component-usage)
3. [Design Patterns](#design-patterns)
4. [Best Practices](#best-practices)
5. [Migration Guide](#migration-guide)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites
All dependencies are already installed. Just run:
```bash
npm install
npm run dev
```

### View Component Demo
The `ShadcnExamples.tsx` component showcases all available components. To view it:

1. Add to your router (temporarily):
```tsx
// In App.tsx
import { ShadcnExamples } from './components/ShadcnExamples';

<Route path="/ui-demo" element={<ShadcnExamples />} />
```

2. Visit `http://localhost:3000/ui-demo`

### Basic Import Pattern
```tsx
// Import individual components
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle } from './components/ui/card';
```

---

## Component Usage

### 1. Buttons

#### Primary Action (Ink-filled)
```tsx
<Button onClick={handleSubmit}>Create Session</Button>
```

#### Secondary Action (Outlined)
```tsx
<Button variant="outline" onClick={handleCancel}>Cancel</Button>
```

#### Destructive Action
```tsx
<Button variant="destructive" onClick={handleDelete}>Delete</Button>
```

#### With Icon
```tsx
<Button>
  <i className="ti ti-check mr-2 text-[18px]" />
  Check In
</Button>
```

#### Size Variants
```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><i className="ti ti-settings" /></Button>
```

#### Full Width
```tsx
<Button className="w-full">Full Width Button</Button>
```

### 2. Form Fields

#### Text Input
```tsx
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';

<div className="space-y-2">
  <Label htmlFor="session-title">Session title</Label>
  <Input 
    id="session-title"
    type="text"
    placeholder="Team meeting"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
  />
</div>
```

#### Email Input
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email address</Label>
  <Input 
    id="email"
    type="email"
    placeholder="you@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

#### Password Input
```tsx
<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input 
    id="password"
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
</div>
```

### 3. Select Dropdown

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

<div className="space-y-2">
  <Label htmlFor="category">Category</Label>
  <Select value={category} onValueChange={setCategory}>
    <SelectTrigger id="category">
      <SelectValue placeholder="Select a category" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="event">Event</SelectItem>
      <SelectItem value="school">School</SelectItem>
      <SelectItem value="employee">Employee</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 4. Cards

#### Basic Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Session Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

#### Card with Description
```tsx
<Card>
  <CardHeader>
    <CardTitle>Location Settings</CardTitle>
    <CardDescription>Configure check-in radius and venue</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### Card with Footer
```tsx
<Card>
  <CardHeader>
    <CardTitle>Confirm Action</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Are you sure you want to proceed?</p>
  </CardContent>
  <CardFooter className="flex gap-2">
    <Button variant="outline" className="flex-1">Cancel</Button>
    <Button className="flex-1">Confirm</Button>
  </CardFooter>
</Card>
```

#### Tinted Cards (Callouts)

**Info/Success (Pine Tint)**
```tsx
<Card tone="tint">
  <CardHeader>
    <CardTitle>Location permission granted</CardTitle>
  </CardHeader>
  <CardContent>
    <p>You can now see nearby sessions.</p>
  </CardContent>
</Card>
```

**Warning (Signal Tint)**
```tsx
<Card tone="sig">
  <CardHeader>
    <CardTitle>Check-in ends soon</CardTitle>
  </CardHeader>
  <CardContent>
    <p>You have 10 minutes remaining to check in.</p>
  </CardContent>
</Card>
```

**Error (Error Tint)**
```tsx
<Card tone="err">
  <CardHeader>
    <CardTitle>Outside check-in radius</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Move closer to the venue to check in.</p>
  </CardContent>
</Card>
```

### 5. Badges (Status Chips)

```tsx
import { Badge } from './components/ui/badge';

<Badge variant="default" showDot>Open</Badge>
<Badge variant="success" showDot>Upcoming</Badge>
<Badge variant="secondary" showDot>Closed</Badge>
<Badge variant="destructive" showDot>Cancelled</Badge>
<Badge variant="outline" showDot={false}>No Dot</Badge>
```

### 6. Dialog Modal

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete Session</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete session permanently?</DialogTitle>
      <DialogDescription>
        This will remove the session and all check-in records. This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="flex-col gap-2 sm:flex-row">
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete permanently
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 7. Separator

```tsx
import { Separator } from './components/ui/separator';

<div className="space-y-4">
  <p>Section 1</p>
  <Separator />
  <p>Section 2</p>
</div>
```

---

## Design Patterns

### Full Form Layout
```tsx
<Card>
  <CardHeader>
    <CardTitle>Create New Session</CardTitle>
    <CardDescription>Fill in the details below</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="title">Title</Label>
      <Input id="title" placeholder="Team meeting" />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="venue">Venue</Label>
      <Input id="venue" placeholder="Conference Room A" />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger id="category">
          <SelectValue placeholder="Choose category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="event">Event</SelectItem>
          <SelectItem value="school">School</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </CardContent>
  <CardFooter className="flex-col gap-2">
    <Button className="w-full">Create Session</Button>
    <Button variant="outline" className="w-full">Cancel</Button>
  </CardFooter>
</Card>
```

### Session Dashboard
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Team Meeting</CardTitle>
        <CardDescription>Event · Conference Room A · 50 m</CardDescription>
      </div>
      <Badge variant="default" showDot>Open</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[56px] font-semibold leading-none tracking-[-0.02em] font-serif"
             style={{ fontFamily: 'Fraunces, Georgia, serif', color: 'var(--ink)' }}>
          24
        </div>
        <p className="text-[13px] text-[var(--mut)]">checked in</p>
      </div>
      <Badge showDot>Live</Badge>
    </div>
    
    {/* Progress bar */}
    <div className="mt-4 h-2 overflow-hidden rounded-[4px] bg-[var(--line)]">
      <div className="h-full bg-[var(--sig)] transition-all" style={{ width: '80%' }} />
    </div>
    <p className="mt-2 text-[13px] text-[var(--mut)]">24 of 30 expected</p>
  </CardContent>
  <CardFooter className="flex-col gap-2">
    <Button className="w-full">
      <i className="ti ti-lock mr-2" />
      Close Attendance
    </Button>
  </CardFooter>
</Card>
```

### Button Groups

**Stacked (Mobile)**
```tsx
<div className="space-y-2">
  <Button className="w-full">Primary</Button>
  <Button variant="outline" className="w-full">Secondary</Button>
  <Button variant="destructive" className="w-full">Delete</Button>
</div>
```

**Side by Side**
```tsx
<div className="flex gap-2">
  <Button variant="outline" className="flex-1">Cancel</Button>
  <Button className="flex-1">Confirm</Button>
</div>
```

**Icon Grid**
```tsx
<div className="grid grid-cols-4 gap-2">
  <button className="flex flex-col items-center gap-2 rounded-[6px] border-[1.5px] border-[var(--ink)] p-3">
    <i className="ti ti-edit text-[20px]" />
    <span className="text-[11px] font-semibold uppercase">Edit</span>
  </button>
  {/* More icon buttons */}
</div>
```

---

## Best Practices

### 1. Use Semantic HTML
```tsx
// Good: proper label association
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// Bad: no label association
<div>
  <span>Email</span>
  <Input type="email" />
</div>
```

### 2. Responsive Design
```tsx
// Stack on mobile, side-by-side on desktop
<div className="flex flex-col gap-2 sm:flex-row">
  <Button className="flex-1">Option 1</Button>
  <Button variant="outline" className="flex-1">Option 2</Button>
</div>
```

### 3. Loading States
```tsx
<Button disabled={isLoading}>
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

### 4. Error Handling
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className={error ? 'border-[var(--err)]' : ''}
  />
  {error && (
    <p className="text-sm text-[var(--err)]">{error}</p>
  )}
</div>
```

### 5. Conditional Classes with cn()
```tsx
import { cn } from '../lib/utils';

<Button className={cn(
  "w-full",
  isActive && "bg-[var(--sig)]",
  isDisabled && "opacity-50"
)}>
  Action
</Button>
```

---

## Migration Guide

### From Custom Components to Shadcn

#### Button Migration
```tsx
// OLD
import { Btn } from '../components/ui';
<Btn variant="primary" onClick={handleClick}>Save</Btn>
<Btn variant="secondary">Cancel</Btn>
<Btn variant="danger">Delete</Btn>

// NEW
import { Button } from '../components/ui/button';
<Button onClick={handleClick}>Save</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete</Button>
```

#### Input Field Migration
```tsx
// OLD
import { Field, TextInput } from '../components/ui';
<Field label="Title">
  <TextInput value={title} onChange={e => setTitle(e.target.value)} />
</Field>

// NEW
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
<div className="space-y-2">
  <Label htmlFor="title">Title</Label>
  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
</div>
```

#### Card Migration
```tsx
// OLD
import { Card, Panel } from '../components/ui';
<Panel title="Details">
  <p>Content</p>
</Panel>

// NEW
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
<Card>
  <CardHeader>
    <CardTitle>Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
</Card>
```

---

## Troubleshooting

### Issue: Components not importing
**Solution**: Make sure you're using the correct path:
```tsx
// Correct
import { Button } from './components/ui/button';

// Also works (using index)
import { Button } from './components/ui';
```

### Issue: Styles not applying
**Solution**: Verify Tailwind is processing the ui folder:
```js
// tailwind.config.js
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",  // Should include ui folder
],
```

### Issue: Dark mode not working
**Solution**: Ensure data-theme attribute is set on root:
```tsx
<html data-theme="dark">  // or "light" or omit for system
```

### Issue: TypeScript errors
**Solution**: Run type check to see specific errors:
```bash
npm run typecheck
```

### Issue: Button size not changing
**Solution**: Use the size prop, not className for standard sizes:
```tsx
// Correct
<Button size="sm">Small</Button>

// For custom sizing, use className
<Button className="h-12 px-6">Custom Size</Button>
```

---

## Quick Reference

### Common Class Utilities

**Spacing**
- `space-y-2` - Vertical spacing (8px)
- `space-y-4` - Vertical spacing (16px)
- `gap-2` - Gap between flex/grid items (8px)

**Layout**
- `flex` - Flexbox
- `flex-col` - Column direction
- `grid grid-cols-2` - 2 column grid
- `space-between` - Justify content space between

**Responsive**
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

**Width**
- `w-full` - 100% width
- `w-auto` - Auto width
- `flex-1` - Flex grow

---

## Resources

- **SHADCN-UI.md** - Comprehensive integration guide
- **SHADCN-QUICKREF.md** - Quick copy-paste patterns
- **ShadcnExamples.tsx** - Live component examples
- [Shadcn/ui Docs](https://ui.shadcn.com)
- [Radix UI Docs](https://www.radix-ui.com/primitives)
- [Tailwind CSS Docs](https://tailwindcss.com)

---

**Last Updated**: October 28, 2026
