import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

// Avatar images stored in public/avatar/
const AVATARS = [
    '/avatar/avatar-01-fox.png',
    '/avatar/avatar-02-bear.png',
    '/avatar/avatar-03-cat.png',
    '/avatar/avatar-04-bunny.png',
    '/avatar/avatar-05-owl.png',
    '/avatar/avatar-06-penguin.png',
    '/avatar/avatar-07-frog.png',
    '/avatar/avatar-08-panda.png',
    '/avatar/avatar-09-dino.png',
    '/avatar/avatar-10-chick.png',
    '/avatar/avatar-11-pig.png',
    '/avatar/avatar-12-koala.png',
    '/avatar/avatar-13-lion.png',
    '/avatar/avatar-14-monkey.png',
    '/avatar/avatar-15-sheep.png',
    '/avatar/avatar-16-duck.png',
    '/avatar/avatar-17-whale.png',
    '/avatar/avatar-18-octopus.png',
    '/avatar/avatar-19-hedgehog.png',
    '/avatar/avatar-20-robot.png',
];

interface AvatarPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (avatarUrl: string) => void;
    currentAvatar?: string | null;
}

export function AvatarPicker({ open, onClose, onSelect, currentAvatar }: AvatarPickerProps) {
    const [selected, setSelected] = useState<string | null>(currentAvatar || null);

    const handleSelect = () => {
        if (selected) {
            onSelect(selected);
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Choose an avatar</DialogTitle>
                    <DialogDescription>Select one of our cute animal avatars for your profile</DialogDescription>
                </DialogHeader>

                <div className="grid max-h-[400px] grid-cols-5 gap-3 overflow-y-auto p-1">
                    {AVATARS.map((url) => (
                        <button
                            key={url}
                            type="button"
                            onClick={() => setSelected(url)}
                            className={`relative aspect-square overflow-hidden rounded-xl border-2 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_30%,transparent)] ${selected === url
                                ? 'border-[var(--pine)] ring-4 ring-[color-mix(in_srgb,var(--pine)_20%,transparent)]'
                                : 'border-[var(--line)]'
                                }`}
                            aria-label="Select this avatar"
                        >
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            {selected === url && (
                                <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--pine)_30%,transparent)]">
                                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--pine)] text-lg text-[var(--onp)]">
                                        <i className="ti ti-check" aria-hidden="true" />
                                    </span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSelect} disabled={!selected}>
                        Set avatar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
