import { FC } from "react";

type Size = "sm" | "md" | "lg";
type Variant = "blackRose" | "novaOS" | "status";

interface Props {
    checked: boolean;
    onChange: (_v: boolean) => void;
    size?: Size;
    variant?: Variant;
}

export const Toggle: FC<Props> = ({
    checked,
    onChange,
    size = "md",
    variant = "blackRose",
}) => {
    const sizeClasses = {
        sm: "w-10 h-5 after:w-4 after:h-4",
        md: "w-12 h-6 after:w-5 after:h-5",
        lg: "w-14 h-7 after:w-6 after:h-6",
    };

    const bgVar = {
        blackRose: "bg-[var(--c-primary)]",
        novaOS: "bg-[var(--c-primary)]",
        status: "bg-status-success-main",
    };

    return (
        <label className={`relative inline-flex items-center cursor-pointer ${sizeClasses[size]}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <span
                className={`
          absolute inset-0 rounded-full
          ${bgVar[variant]} peer-checked:${bgVar[variant]}
          transition-colors
        `}
            />
            <span
                className={`
          after:absolute after:left-0.5 after:top-0.5 after:bg-white after:rounded-full
          after:transition-transform
          peer-checked:after:translate-x-full
          ${sizeClasses[size]}
        `}
            />
        </label>
    );
};
