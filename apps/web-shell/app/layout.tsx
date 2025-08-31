import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>NovaOS</title>
        {/* favicon temporarily removed to avoid binary in PR; will upload later */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-black text-white">{children}</body>
    </html>
  );
}
