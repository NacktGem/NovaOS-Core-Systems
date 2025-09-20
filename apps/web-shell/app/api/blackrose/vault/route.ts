import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Mock vault data - replace with database query
    const vaultData = {
      userId,
      balance: 125.5,
      totalSpent: 347.8,
      verified: false,
      unlockedItems: [
        {
          id: 'vault_001',
          creatorId: 'creator_velora',
          creatorName: 'Velora',
          studio: 'scarlet',
          title: 'Behind the Scenes Collection',
          description: 'Exclusive backstage moments from my latest photoshoot',
          contentType: 'photo_set',
          price: 15.99,
          nsfwLevel: 1,
          unlocked: true,
          thumbnail: '/api/placeholder/thumb/velora_bts',
          itemCount: 12,
          createdAt: '2025-01-02T00:00:00Z',
          tags: ['backstage', 'photography', 'exclusive'],
          unlockedAt: '2025-01-03T10:30:00Z',
        },
      ],
      lockedItems: [
        {
          id: 'vault_003',
          creatorId: 'creator_velora',
          creatorName: 'Velora',
          studio: 'scarlet',
          title: 'Intimate Moments',
          description: 'Personal and sensual photography collection',
          contentType: 'photo_set',
          price: 34.99,
          nsfwLevel: 3,
          unlocked: false,
          thumbnail: '/api/placeholder/thumb/velora_intimate',
          itemCount: 24,
          createdAt: '2025-01-10T00:00:00Z',
          tags: ['intimate', 'artistic', 'exclusive', 'nsfw'],
        },
      ],
      recentTransactions: [
        {
          id: 'txn_20250103_001',
          itemId: 'vault_001',
          itemTitle: 'Behind the Scenes Collection',
          creatorName: 'Velora',
          amount: 15.99,
          timestamp: '2025-01-03T10:30:00Z',
          status: 'completed',
        },
      ],
    };

    return NextResponse.json(vaultData);
  } catch (error) {
    console.error('Get vault error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
