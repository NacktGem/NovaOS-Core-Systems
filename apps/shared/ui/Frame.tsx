import React from "react";

// Inline cn utility to avoid dependency issues
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

export interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "blackRose" | "novaOS" | "ghost";
    size?: "sm" | "md" | "lg" | "xl";
    glow?: boolean;
}

const frameVariants = {
    blackRose: "bg-blackRose-bg border-blackRose-roseMauve text-blackRose-fg shadow-lg",
    novaOS: "bg-novaOS-blueLight border-novaOS-blueDark text-slate-900 shadow-md",
    ghost: "bg-transparent border-studios-inkSteel-silver text-studios-inkSteel-graphite"
};

const frameSizes = {
    sm: "p-3 rounded-lg border",
    md: "p-4 rounded-xl border-2",
    lg: "p-6 rounded-2xl border-2",
    xl: "p-8 rounded-3xl border-2"
};

export const Frame = React.forwardRef<HTMLDivElement, FrameProps>(
    ({ className, variant = "novaOS", size = "md", glow = false, ...props }, ref) => {
        return (
            <div
                className={cn(
                    "transition-all duration-200",
                    frameVariants[variant],
                    frameSizes[size],
                    glow && variant === "blackRose" && "shadow-blackRose-roseMauve/20 shadow-2xl",
                    glow && variant === "novaOS" && "shadow-novaOS-blueDark/20 shadow-xl",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);

Frame.displayName = "Frame";
