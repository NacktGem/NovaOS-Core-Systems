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

    // Get authorization token from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Forward to core-api
    const response = await fetch(`${process.env.CORE_API_URL}/api/vault/purchase`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content_id: itemId,
        payment_method: 'balance',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Failed to purchase content' },
        { status: response.status }
      );
    }

    const purchaseData = await response.json();

    return NextResponse.json({
      success: true,
      transaction: purchaseData.purchase,
      content: purchaseData.content,
      message: purchaseData.message || 'Content unlocked successfully',
    });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
