import { useState, useCallback } from "react";

export interface ToggleProps {
    checked: boolean;
    onCheckedChange: (_checked: boolean) => void;
    variant?: "blackRose" | "novaOS" | "status";
    size?: "sm" | "md" | "lg";
    label?: string;
    disabled?: boolean;
}

const toggleVariants = {
    blackRose: {
        track: "bg-blackRose-midnightNavy data-[state=checked]:bg-blackRose-roseMauve",
        thumb: "bg-blackRose-fg data-[state=checked]:bg-white"
    },
    novaOS: {
        track: "bg-studios-inkSteel-silver data-[state=checked]:bg-novaOS-blueDark",
        thumb: "bg-white data-[state=checked]:bg-novaOS-blueLight"
    },
    status: {
        track: "bg-studios-inkSteel-iron data-[state=checked]:bg-status-success-main",
        thumb: "bg-white data-[state=checked]:bg-white"
    }
};

const toggleSizes = {
    sm: { track: "w-8 h-5 p-0.5", thumb: "w-4 h-4" },
    md: { track: "w-11 h-6 p-0.5", thumb: "w-5 h-5" },
    lg: { track: "w-14 h-8 p-1", thumb: "w-6 h-6" }
};

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
    ({
        checked,
        onCheckedChange,
        variant = "novaOS",
        size = "md",
        label,
        disabled = false,
        ...props
    }, ref) => {
        const variantStyles = toggleVariants[variant];
        const sizeStyles = toggleSizes[size];

        return (
            <div className="flex items-center space-x-2">
                <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    data-state={checked ? "checked" : "unchecked"}
                    disabled={disabled}
                    className={cn(
                        "relative inline-flex items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-current/20",
                        sizeStyles.track,
                        variantStyles.track,
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !disabled && onCheckedChange(!checked)}
                    ref={ref}
                    {...props}
                >
                    <span
                        className={cn(
                            "inline-block rounded-full transition-transform duration-200",
                            sizeStyles.thumb,
                            variantStyles.thumb,
                            checked ? "translate-x-full" : "translate-x-0"
                        )}
                    />
                </button>
                {label && (
                    <label
                        className={cn(
                            "text-sm font-medium select-none",
                            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        )}
                        onClick={() => !disabled && onCheckedChange(!checked)}
                    >
                        {label}
                    </label>
                )}
            </div>
        );
    }
);

Toggle.displayName = "Toggle";

// Inline cn utility to avoid dependency issues
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}
