import { cn } from "../../lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-xl bg-[var(--line)]", className)}
            {...props}
        />
    )
}

export { Skeleton }
