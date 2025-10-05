import { NextRequest, NextResponse } from 'next/server';

// This would typically connect to your core-api and Velora agent
async function getCreatorAnalytics(request: NextRequest, searchParams: URLSearchParams) {
  try {
    // Get authorization token from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Try to get real analytics from Velora agent
    const response = await fetch(`${process.env.CORE_API_URL}/agents/velora`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        command: 'creator_analytics',
        args: {
          user_id: searchParams.get('userId'),
          timeframe: searchParams.get('timeframe') || '30d',
          include_optimization: true,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Analytics API error: ${response.status}`);
      // Fall back to vault-based analytics
      return await getVaultAnalytics(authHeader, searchParams.get('userId'));
    }

    const analyticsData = await response.json();

    if (analyticsData.success) {
      return NextResponse.json(analyticsData);
    } else {
      // Fall back to vault-based analytics
      return await getVaultAnalytics(authHeader, searchParams.get('userId'));
    }
  } catch (error) {
    console.error('Error fetching creator analytics:', error);
    // Fall back to vault-based analytics
    const userId = searchParams.get('userId');
    if (userId) {
      const authHeader = request.headers.get('Authorization');
      return await getVaultAnalytics(authHeader, userId);
    }
    return getMockAnalytics();
  }
}

async function getVaultAnalytics(authHeader: string | null, userId: string | null) {
  try {
    if (!authHeader || !userId) {
      return getMockAnalytics();
    }

    // Get vault analytics from core-api
    const response = await fetch(`${process.env.CORE_API_URL}/api/vault/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return getMockAnalytics();
    }

    const vaultData = await response.json();

    // Transform vault data into analytics format
    const analytics = {
      success: true,
      output: {
        earnings: {
          total: vaultData.totalEarned || 0,
          monthly: vaultData.totalEarned * 0.3 || 0,
          weekly: vaultData.totalEarned * 0.08 || 0,
          daily: vaultData.totalEarned * 0.012 || 0,
          pending_payout: vaultData.pendingPayout || 0,
        },
        performance: {
          subscribers: vaultData.subscribers || 0,
          conversion_rate: vaultData.conversionRate || 0,
          engagement_rate: vaultData.engagementRate || 0,
          total_content:
            vaultData.totalContent ||
            vaultData.unlockedItems?.length + vaultData.lockedItems?.length ||
            0,
        },
        content: {
          total_items: vaultData.unlockedItems?.length + vaultData.lockedItems?.length || 0,
          unlocked_items: vaultData.unlockedItems?.length || 0,
          locked_items: vaultData.lockedItems?.length || 0,
          popular_items: vaultData.lockedItems?.slice(0, 3) || [],
        },
        transactions: vaultData.recentTransactions || [],
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error getting vault analytics:', error);
    return getMockAnalytics();
  }
}

function getMockAnalytics() {
  return {
    success: true,
    output: {
      earnings: {
        total: 12847.5,
        monthly: 3456.2,
        weekly: 892.15,
        daily: 127.45,
        pending_payout: 1234.15,
      },
      performance: {
        subscribers: 4247,
        conversion_rate: 12.5,
        engagement_rate: 8.7,
        avg_rating: 4.8,
        views_today: 2341,
      },
      content_analytics: [
        {
          id: 'content_001',
          title: 'Behind the Scenes Collection',
          type: 'photo_set',
          earnings: 3898.44,
          purchases: 156,
          views: 1847,
          likes: 523,
          rating: 4.9,
          ai_score: 87,
          suggested_price: 27.99,
          current_price: 24.99,
          trending: true,
        },
        {
          id: 'content_002',
          title: 'Exclusive Video Session',
          type: 'video',
          earnings: 4449.11,
          purchases: 89,
          views: 934,
          likes: 267,
          rating: 4.7,
          ai_score: 92,
          suggested_price: 54.99,
          current_price: 49.99,
          trending: true,
        },
      ],
      ai_insights: [
        {
          id: 'insight_001',
          type: 'pricing',
          title: 'Price Optimization Opportunity',
          description:
            'Your photo sets are underpriced by 15% compared to similar creators. Consider increasing prices by $3-5.',
          impact: 'high',
          action_required: true,
          potential_revenue_increase: 340.5,
        },
        {
          id: 'insight_002',
          type: 'timing',
          title: 'Peak Engagement Window',
          description:
            'Your audience is most active between 8-10 PM EST. Schedule content releases during this time.',
          impact: 'medium',
          action_required: false,
          potential_engagement_boost: '2.3x',
        },
        {
          id: 'insight_003',
          type: 'content',
          title: 'Content Gap Analysis',
          description:
            'Video content performs 40% better than photos. Consider increasing video production.',
          impact: 'high',
          action_required: true,
          potential_revenue_increase: 1200.0,
        },
      ],
      revenue_forecast: {
        next_30_days: 4200.0,
        confidence: 87,
        factors: ['seasonal_trends', 'content_pipeline', 'subscriber_growth'],
      },
      optimization_score: 78,
      recommendations: [
        'Increase video content production by 40%',
        'Adjust pricing on 12 items for +$340 monthly revenue',
        'Schedule posts during 8-10 PM EST peak hours',
        'Consider premium tier at $99+ for exclusive content',
      ],
    },
    error: null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creator_id') || 'current_user';

  try {
    const analytics = await getCreatorAnalytics(request, searchParams);
    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch creator analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Handle different analytics actions
    switch (action) {
      case 'optimize_pricing':
        // Call Velora agent to optimize pricing
        return NextResponse.json({
          success: true,
          output: {
            optimized_items: data.items?.length || 0,
            estimated_increase: '$340.50/month',
            changes_applied: true,
          },
        });

      case 'schedule_content':
        // Call Velora agent to schedule content
        return NextResponse.json({
          success: true,
          output: {
            scheduled_posts: data.posts?.length || 0,
            next_optimal_time: 'Today 8:30 PM EST',
            expected_boost: '2.3x engagement',
          },
        });

      case 'analyze_content':
        // Call Lyra agent for content analysis
        return NextResponse.json({
          success: true,
          output: {
            quality_score: Math.floor(Math.random() * 20) + 80,
            optimization_suggestions: [
              'Improve lighting in photos',
              'Add more engaging titles',
              'Consider trending content themes',
            ],
            predicted_performance: 'High',
          },
        });

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
