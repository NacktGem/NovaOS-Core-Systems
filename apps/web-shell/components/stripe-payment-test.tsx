import React, { useState } from 'react';

/**
 * Stripe Payment Test Component
 *
 * This component tests the NovaOS Stripe payment integration by:
 * 1. Calculating fees for different amounts
 * 2. Showing transparent pricing to customers
 * 3. Demonstrating the creator/platform split
 */

interface PaymentCalculation {
    base_amount: number;
    stripe_percentage_fee: number;
    stripe_fixed_fee: number;
    total_stripe_fees: number;
    customer_total: number;
    platform_fee: number;
    creator_earnings: number;
    fee_explanation: string;
}

export default function StripePaymentTest() {
    const [amount, setAmount] = useState('25.00');
    const [calculation, setCalculation] = useState<PaymentCalculation | null>(null);
    const [loading, setLoading] = useState(false);

    const calculateFees = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/payments/calculate-total', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    base_amount: parseFloat(amount)
                }),
            });

            if (response.ok) {
                const data: PaymentCalculation = await response.json();
                setCalculation(data);
            } else {
                console.error('Failed to calculate fees');
            }
        } catch (error) {
            console.error('Error calculating fees:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="bg-white border rounded-lg shadow-sm">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">🚀 NovaOS Stripe Payment Test</h2>
                    <p className="text-gray-600 mt-1">
                        Test the transparent fee structure where customers pay Stripe processing fees
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                            placeholder="Enter amount (e.g., 25.00)"
                            step="0.01"
                            min="0.50"
                            max="10000"
                            className="flex-1 px-3 py-2 border rounded-md"
                        />
                        <button
                            onClick={calculateFees}
                            disabled={loading || !amount}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                        >
                            {loading ? 'Calculating...' : 'Calculate Fees'}
                        </button>
                    </div>

                    {calculation && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <h3 className="font-semibold text-lg">Payment Breakdown</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-blue-600">Customer Pays:</h4>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                            <span>Base Price:</span>
                                            <span>${calculation.base_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Stripe Fees:</span>
                                            <span>+${calculation.total_stripe_fees.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold border-t pt-1">
                                            <span>Total:</span>
                                            <span>${calculation.customer_total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-green-600">Money Distribution:</h4>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                            <span>Creator (88%):</span>
                                            <span>${calculation.creator_earnings.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Platform (12%):</span>
                                            <span>${calculation.platform_fee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Stripe Fees:</span>
                                            <span>${calculation.total_stripe_fees.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded text-sm">
                                <p className="font-medium">How it works:</p>
                                <p>{calculation.fee_explanation}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    className="px-3 py-1 text-xs bg-gray-200 rounded"
                                    onClick={() => setAmount('5.00')}
                                >
                                    Test $5
                                </button>
                                <button
                                    className="px-3 py-1 text-xs bg-gray-200 rounded"
                                    onClick={() => setAmount('25.00')}
                                >
                                    Test $25
                                </button>
                                <button
                                    className="px-3 py-1 text-xs bg-gray-200 rounded"
                                    onClick={() => setAmount('100.00')}
                                >
                                    Test $100
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Key Features:</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>✅ Customers pay base price + transparent Stripe fees</li>
                            <li>✅ Creators receive 88% of base price (before Stripe fees)</li>
                            <li>✅ Platform takes 12% of base price</li>
                            <li>✅ No hidden fees - full transparency</li>
                            <li>✅ Stripe fees (2.9% + $0.30) passed to customer</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
