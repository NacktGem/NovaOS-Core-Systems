import clsx from "clsx";

type Variant = "primary" | "secondary" | "outline" | "success";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    loading?: boolean;
}

export const Button: React.FC<Props> = ({
    variant = "primary",
    loading = false,
    className,
    children,
    ...rest
}) => {
    const base = "rounded px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-[var(--c-primary)] text-[var(--c-fg)] hover:bg-[var(--c-primary)]/90",
        secondary: "bg-[var(--c-secondary)] text-[var(--c-fg)] hover:bg-[var(--c-secondary)]/90",
        outline: "border border-[var(--c-primary)] text-[var(--c-primary)] hover:bg-[var(--c-primary)]/10",
        success: "bg-status-success-main text-white hover:bg-status-success-dark",
    };
    const loadingStyle = loading
        ? "relative after:absolute after:inset-0 after:flex after:items-center after:justify-center after:content-[''] after:border-2 after:border-white after:border-t-transparent after:rounded-full after:animate-spin"
        : "";

    return (
        <button
            className={clsx(base, variants[variant], loadingStyle, className)}
            disabled={loading || rest.disabled}
            {...rest}
        >
            {loading ? null : children}
        </button>
    );
};
