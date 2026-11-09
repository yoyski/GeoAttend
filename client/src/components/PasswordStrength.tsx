import { useMemo } from 'react';

interface PasswordStrengthProps {
    password: string;
}

interface Requirement {
    met: boolean;
    label: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
    const requirements = useMemo((): Requirement[] => {
        return [
            {
                met: password.length >= 8,
                label: 'At least 8 characters',
            },
            {
                met: /[a-z]/.test(password),
                label: 'One lowercase letter',
            },
            {
                met: /[A-Z]/.test(password),
                label: 'One uppercase letter',
            },
            {
                met: /[0-9]/.test(password),
                label: 'One number',
            },
            {
                met: /[^a-zA-Z0-9]/.test(password),
                label: 'One special character (!@#$%...)',
            },
        ];
    }, [password]);

    const metCount = requirements.filter((r) => r.met).length;
    const allMet = metCount === requirements.length;

    // Don't show anything if password is empty
    if (!password) return null;

    return (
        <div className="space-y-2 rounded-lg border border-[var(--line)] bg-[var(--card)] p-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink)]">Password strength</span>
                <span
                    className={`text-xs font-bold ${allMet
                            ? 'text-green-600'
                            : metCount >= 3
                                ? 'text-yellow-600'
                                : 'text-red-600'
                        }`}
                >
                    {allMet ? 'Strong' : metCount >= 3 ? 'Fair' : 'Weak'}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                    className={`h-full transition-all duration-300 ${allMet
                            ? 'bg-green-600'
                            : metCount >= 3
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                        }`}
                    style={{ width: `${(metCount / requirements.length) * 100}%` }}
                />
            </div>

            {/* Requirements list */}
            <ul className="space-y-1.5">
                {requirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                        <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${req.met
                                    ? 'bg-green-600 text-white'
                                    : 'border border-gray-300 text-gray-400'
                                }`}
                        >
                            {req.met ? '✓' : '○'}
                        </span>
                        <span className={req.met ? 'text-green-700 font-medium' : 'text-[var(--mut)]'}>
                            {req.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
