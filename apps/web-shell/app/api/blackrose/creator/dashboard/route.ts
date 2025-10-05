import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID required' }, { status: 400 });
    }

    // Mock creator dashboard data - replace with database queries
    const dashboardData = {
      creatorId,
      stats: {
        totalEarnings: 2847.5,
        monthlyEarnings: 456.2,
        subscribers: 1247,
        totalContent: 23,
        avgRating: 4.7,
        payoutPending: 234.15,
        totalViews: 15420,
        conversionRate: 3.2, // percentage of views that result in purchases
      },
      content: [
        {
          id: 'content_001',
          title: 'Behind the Scenes Collection',
          type: 'photo_set',
          studio: 'scarlet',
          price: 15.99,
          purchases: 67,
          earnings: 887.49, // After platform fee
          grossEarnings: 1071.33, // Before platform fee
          rating: 4.8,
          views: 2340,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-03T15:30:00Z',
          status: 'published',
          nsfwLevel: 1,
          tags: ['backstage', 'photography', 'exclusive'],
        },
        {
          id: 'content_002',
          title: 'Intimate Moments',
          type: 'photo_set',
          studio: 'scarlet',
          price: 34.99,
          purchases: 23,
          earnings: 612.14,
          grossEarnings: 804.77,
          rating: 4.9,
          views: 890,
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z',
          status: 'published',
          nsfwLevel: 3,
          tags: ['intimate', 'artistic', 'exclusive', 'nsfw'],
        },
        {
          id: 'content_003',
          title: 'New Character Reveal',
          type: 'video',
          studio: 'expression',
          price: 19.99,
          purchases: 0,
          earnings: 0,
          grossEarnings: 0,
          rating: 0,
          views: 156,
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
          status: 'draft',
          nsfwLevel: 0,
          tags: ['cosplay', 'character', 'preview'],
        },
      ],
      revenue: [
        {
          month: '2024-11',
          earnings: 289.76,
          grossEarnings: 329.27,
          purchases: 28,
          platformFee: 39.51,
        },
        {
          month: '2024-12',
          earnings: 372.94,
          grossEarnings: 423.8,
          purchases: 34,
          platformFee: 50.86,
        },
        {
          month: '2025-01',
          earnings: 456.2,
          grossEarnings: 518.41,
          purchases: 42,
          platformFee: 62.21,
        },
      ],
      payouts: [
        {
          id: 'payout_001',
          amount: 289.76,
          requestDate: '2024-12-01T00:00:00Z',
          processedDate: '2024-12-03T00:00:00Z',
          status: 'completed',
          method: 'bank_transfer',
        },
        {
          id: 'payout_002',
          amount: 372.94,
          requestDate: '2025-01-01T00:00:00Z',
          processedDate: '2025-01-03T00:00:00Z',
          status: 'completed',
          method: 'bank_transfer',
        },
      ],
      subscribers: {
        total: 1247,
        recent: [
          {
            id: 'sub_001',
            username: 'fan_user_001',
            displayName: 'Sarah M.',
            subscribedAt: '2025-01-14T10:30:00Z',
            totalSpent: 89.97,
          },
          {
            id: 'sub_002',
            username: 'fan_user_002',
            displayName: 'Alex K.',
            subscribedAt: '2025-01-13T15:45:00Z',
            totalSpent: 45.98,
          },
        ],
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
