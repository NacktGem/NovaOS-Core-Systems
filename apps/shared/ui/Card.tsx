import React from "react";
import { Frame, FrameProps } from "./Frame";

export interface CardProps extends FrameProps {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ header, footer, children, interactive = false, className, ...props }, ref) => {
        return (
            <Frame
                className={cn(
                    "space-y-4",
                    interactive && "hover:scale-[1.01] cursor-pointer",
                    className
                )}
                ref={ref}
                {...props}
            >
                {header && (
                    <div className="border-b border-current/10 pb-3 font-semibold">
                        {header}
                    </div>
                )}
                <div className="flex-1">
                    {children}
                </div>
                {footer && (
                    <div className="border-t border-current/10 pt-3 text-sm opacity-75">
                        {footer}
                    </div>
                )}
            </Frame>
        );
    }
);

Card.displayName = "Card";

// Import cn from utils - for now inline it to avoid dependency issues
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}
