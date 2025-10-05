import * as React from "react"
import { cn } from "../lib/utils"

interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

const Frame = React.forwardRef<HTMLDivElement, FrameProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden rounded-lg border bg-background",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
Frame.displayName = "Frame"

export { Frame }
