import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'NovaOS Web Shell',
    description: 'Multi-platform access portal for NovaOS ecosystem',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a1a] to-[#1a1a2a] text-[#e2e8f0]`}>
                {children}
            </body>
        </html>
    );
}