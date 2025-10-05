import { FC, ReactNode } from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export const Modal: FC<Props> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-[var(--c-bg)] text-[var(--c-fg)] rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative">
                <button
                    className="absolute top-3 right-3 text-[var(--c-fg)] hover:text-[var(--c-primary)]"
                    onClick={onClose}
                >
                    ✕
                </button>
                {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
                {children}
            </div>
        </div>
    );
};
