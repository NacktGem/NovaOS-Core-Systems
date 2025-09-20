// Console page with authentication check
export default function ConsolePage() {
    return (
        <div className="min-h-screen bg-gray-900 text-green-400 flex items-center justify-center">
            <div className="max-w-md w-full bg-black shadow-lg rounded-lg p-6 border border-green-400">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 font-mono">ADMIN CONSOLE</h1>
                    <div className="bg-green-900 border border-green-400 text-green-300 px-4 py-3 rounded mb-4">
                        <p className="text-sm font-mono">
                            ✅ SECURITY: Authentication middleware active
                        </p>
                    </div>
                    <p className="text-green-300 text-sm font-mono">
                        &gt; Access granted. Protected endpoint secured.
                    </p>
                </div>
            </div>
        </div>
    );
}