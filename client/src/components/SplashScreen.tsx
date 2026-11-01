import { useEffect, useState } from 'react';

export function SplashScreen() {
    const [visible, setVisible] = useState(true);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const showForMs = 2400;
        const fadeMs = 500;

        const leavingTimer = setTimeout(() => setLeaving(true), showForMs);
        const visibleTimer = setTimeout(() => setVisible(false), showForMs + fadeMs);

        return () => {
            clearTimeout(leavingTimer);
            clearTimeout(visibleTimer);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label="Loading GeoAttend"
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-black transition-opacity duration-500 ease-out ${leaving ? 'pointer-events-none opacity-0' : ''
                }`}
        >
            <div className="relative h-40 w-40">
                {/* ripple */}
                <div className="absolute inset-[30%] animate-[ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border-2 border-white"></div>

                {/* outer dashed ring */}
                <div className="absolute inset-[11%] animate-[spin_6s_linear_infinite] rounded-full border-[7px] border-dashed border-white"></div>

                {/* inner ring */}
                <div className="absolute inset-[30%] rounded-full border-[7px] border-white"></div>

                {/* center dot */}
                <div className="absolute inset-[42%] animate-[pulse_1.6s_ease-in-out_infinite] rounded-full bg-white"></div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <h1 className="text-2xl font-medium tracking-wide text-white">GeoAttend</h1>
                <p className="text-sm text-neutral-400">Getting things ready...</p>
            </div>
        </div>
    );
}
