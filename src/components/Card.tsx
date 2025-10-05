import { FC, ReactNode } from "react";

interface Props {
    header?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
}

export const Card: FC<Props> = ({ header, footer, children }) => (
    <div className="bg-[var(--c-primary)] text-[var(--c-fg)] rounded-lg shadow-md p-4 flex flex-col gap-3">
        {header && <div className="font-semibold text-lg">{header}</div>}
        <div>{children}</div>
        {footer && <div className="mt-auto pt-2 border-t border-[var(--c-secondary)]">{footer}</div>}
    </div>
);
