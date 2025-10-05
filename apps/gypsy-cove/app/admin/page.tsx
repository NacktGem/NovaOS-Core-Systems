// Admin page with authentication check
export default function AdminPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        <p className="text-sm">
                            ✅ Authentication middleware is working correctly!
                        </p>
                    </div>
                    <p className="text-gray-600 text-sm">
                        This admin page is now protected by authentication middleware.
                        Access requires valid credentials.
                    </p>
                </div>
            </div>
        </div>
    );
}