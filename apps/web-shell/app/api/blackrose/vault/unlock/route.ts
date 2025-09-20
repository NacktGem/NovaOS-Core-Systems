import { NextRequest, NextResponse } from 'next/server';

interface UnlockRequest {
  itemId: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UnlockRequest = await request.json();
    const { itemId, userId } = body;

    // Validation
    if (!itemId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mock user balance check - replace with database query
    const userBalance = 125.5; // This would come from database
    const itemPrice = 34.99; // This would come from database

    if (userBalance < itemPrice) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 402 } // Payment Required
      );
    }

    // Calculate platform fee (12%)
    const platformFee = itemPrice * 0.12;
    const creatorEarnings = itemPrice * 0.88;

    // In production, you would:
    // 1. Start database transaction
    // 2. Deduct from user balance
    // 3. Add to creator pending earnings
    // 4. Record platform fee
    // 5. Mark content as unlocked for user
    // 6. Create transaction record
    // 7. Commit transaction

    // Mock successful unlock
    const transaction = {
      id: `txn_${Date.now()}`,
      userId,
      itemId,
      amount: itemPrice,
      platformFee,
      creatorEarnings,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };

    return NextResponse.json({
      success: true,
      transaction,
      newBalance: userBalance - itemPrice,
      message: 'Content unlocked successfully',
    });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
