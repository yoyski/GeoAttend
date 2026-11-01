/**
 * GeoAttend + Shadcn/ui Integration Examples
 * 
 * This file shows how to use Shadcn/ui components styled with the GeoAttend design system.
 * Use these patterns when building new features or refactoring existing pages.
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Separator } from './ui/separator';

export function ShadcnExamples() {
    const [category, setCategory] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            {/* Page Header */}
            <div>
                <h1
                    className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] font-serif text-[var(--ink)]"
                    style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                >
                    Shadcn/ui Components
                </h1>
                <p className="mt-2 text-[13px] text-[var(--mut)]">
                    GeoAttend design system with Shadcn/ui components
                </p>
            </div>

            <Separator />

            {/* Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle>Buttons</CardTitle>
                    <CardDescription>Different button variants matching the GeoAttend style</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button className="w-full">Primary Button (Ink filled)</Button>
                    <Button variant="outline" className="w-full">
                        Secondary Button (Outlined)
                    </Button>
                    <Button variant="destructive" className="w-full">
                        Destructive Button
                    </Button>
                    <Button variant="ghost" className="w-full">
                        Ghost Button
                    </Button>
                    <Button variant="link" className="w-full">
                        Link Button
                    </Button>
                    <div className="flex gap-2">
                        <Button size="sm">Small</Button>
                        <Button size="default">Default</Button>
                        <Button size="lg">Large</Button>
                        <Button size="icon">
                            <i className="ti ti-check" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Form Fields */}
            <Card>
                <CardHeader>
                    <CardTitle>Form Fields</CardTitle>
                    <CardDescription>Underlined inputs with mono labels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="session-title">Session title</Label>
                        <Input id="session-title" placeholder="Team meeting" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="venue">Venue</Label>
                        <Input id="venue" placeholder="Conference Room A" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="event">Event</SelectItem>
                                <SelectItem value="school">School</SelectItem>
                                <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Badges/Chips */}
            <Card>
                <CardHeader>
                    <CardTitle>Badges & Status Chips</CardTitle>
                    <CardDescription>Mono uppercase tags with dots</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="default" showDot>Open</Badge>
                        <Badge variant="success" showDot>Upcoming</Badge>
                        <Badge variant="secondary" showDot>Closed</Badge>
                        <Badge variant="destructive" showDot>Cancelled</Badge>
                        <Badge variant="outline" showDot={false}>No dot</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Toned Cards */}
            <Card tone="tint">
                <CardHeader>
                    <CardTitle>Tinted Card (Pine)</CardTitle>
                    <CardDescription>Used for permission prompts and location checks</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[var(--ink)]">
                        This card has the pine tint background, perfect for info messages and success states.
                    </p>
                </CardContent>
            </Card>

            <Card tone="sig">
                <CardHeader>
                    <CardTitle>Signal Card (Accent)</CardTitle>
                    <CardDescription>For important notices and warnings</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[var(--ink)]">
                        The accent/signal tint draws attention to time-sensitive or important information.
                    </p>
                </CardContent>
            </Card>

            <Card tone="err">
                <CardHeader>
                    <CardTitle>Error Card</CardTitle>
                    <CardDescription>For error messages and destructive actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[var(--ink)]">
                        Error tint for validation failures, warnings, and permission denials.
                    </p>
                </CardContent>
            </Card>

            {/* Dialog */}
            <Card>
                <CardHeader>
                    <CardTitle>Dialog Modal</CardTitle>
                    <CardDescription>For confirmations and forms</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                Open Dialog
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete session?</DialogTitle>
                                <DialogDescription>
                                    This will permanently delete the session and all check-in records. This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex-col gap-2 sm:flex-row">
                                <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                                    Delete permanently
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {/* Session Dashboard Example */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Team Meeting</CardTitle>
                            <CardDescription>Event at Conference Room A · 50 m</CardDescription>
                        </div>
                        <Badge variant="default" showDot>Open</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div
                                className="text-[56px] font-semibold leading-none tracking-[-0.02em] font-serif text-[var(--ink)]"
                                style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                            >
                                24
                            </div>
                            <p className="text-[13px] text-[var(--mut)]">checked in</p>
                        </div>
                        <Badge showDot>Live</Badge>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-[4px] bg-[var(--line)]">
                        <div
                            className="h-full bg-[var(--sig)] transition-all duration-500"
                            style={{ width: '80%' }}
                        />
                    </div>
                    <p className="mt-2 text-[13px] text-[var(--mut)]">24 of 30 expected</p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button className="w-full">
                        <i className="ti ti-lock mr-2 text-[18px]" />
                        Close attendance
                    </Button>
                    <Button variant="outline" className="w-full">
                        <i className="ti ti-file-text mr-2 text-[18px]" />
                        Preview attendance sheet
                    </Button>
                </CardFooter>
            </Card>

            {/* Integration Tips */}
            <Card>
                <CardHeader>
                    <CardTitle>Integration Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-[var(--ink)]">
                    <div>
                        <h3 className="font-semibold mb-1">1. Import from ui/index.ts</h3>
                        <code className="block bg-[var(--line)] p-2 rounded font-mono text-xs">
                            {`import { Button, Card, Input, Label } from './components/ui';`}
                        </code>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">2. Use your existing color tokens</h3>
                        <p className="text-[var(--mut)]">
                            All components use CSS variables like var(--ink), var(--pine), var(--sig) from your design system.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">3. Maintain the field survey aesthetic</h3>
                        <p className="text-[var(--mut)]">
                            Components match your: ruled sections, underlined inputs, mono labels, ink-filled buttons, and serif headings.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">4. Mix with existing components</h3>
                        <p className="text-[var(--mut)]">
                            You can use Shadcn components alongside your custom ui.tsx components. Gradually migrate as needed.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
