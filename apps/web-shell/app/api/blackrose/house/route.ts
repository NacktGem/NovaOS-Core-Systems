import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');
    // const userId = searchParams.get('userId'); // For future user-specific filtering

    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID required' }, { status: 400 });
    }

    // Mock user verification status - replace with database query
    const userVerified = false; // This would come from user record

    // Mock studio feed data - replace with database queries
    const studioFeed = {
      studioId,
      studioName: getStudioName(studioId),
      posts: [
        {
          id: 'post_001',
          studioId,
          creatorId: 'creator_001',
          creatorName: 'Velora',
          creatorAvatar: '/api/placeholder/avatar/velora',
          content:
            'Just finished a new photoshoot! Behind-the-scenes content available in my vault 📸✨',
          timestamp: '2025-01-15T14:30:00Z',
          likes: 156,
          comments: 23,
          isLocked: false,
          nsfwLevel: 0,
          tags: ['photography', 'backstage'],
          media: {
            type: 'image',
            url: '/api/placeholder/post/velora_preview',
            thumbnail: '/api/placeholder/thumb/velora_preview',
          },
        },
        {
          id: 'post_002',
          studioId,
          creatorId: 'creator_002',
          creatorName: 'Nova Cosplay',
          creatorAvatar: '/api/placeholder/avatar/nova',
          content:
            'Working on a new character design. What do you think? 💭 Full reveal coming soon!',
          timestamp: '2025-01-15T10:15:00Z',
          likes: 89,
          comments: 12,
          isLocked: true,
          nsfwLevel: 1,
          tags: ['cosplay', 'character', 'preview'],
          media: {
            type: 'image',
            url: '/api/placeholder/post/nova_character',
            thumbnail: '/api/placeholder/thumb/nova_character',
          },
        },
        {
          id: 'post_003',
          studioId,
          creatorId: 'creator_003',
          creatorName: 'Echo Dev',
          creatorAvatar: '/api/placeholder/avatar/echo',
          content:
            'Live coding session tonight at 8PM! Building something special for the community 🖥️',
          timestamp: '2025-01-15T06:45:00Z',
          likes: 67,
          comments: 8,
          isLocked: false,
          nsfwLevel: 0,
          tags: ['coding', 'live', 'community'],
          media: {
            type: 'image',
            url: '/api/placeholder/post/echo_coding',
            thumbnail: '/api/placeholder/thumb/echo_coding',
          },
        },
      ].map((post) => ({
        ...post,
        // Apply content filtering based on user verification and NSFW level
        contentHidden: post.nsfwLevel > 0 && !userVerified,
        contentBlurred: post.isLocked,
      })),
      meta: {
        totalPosts: 247,
        activePosts: 23,
        membersOnline: 89,
        totalMembers: getStudioMemberCount(studioId),
      },
    };

    return NextResponse.json(studioFeed);
  } catch (error) {
    console.error('Get studio feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getStudioName(studioId: string): string {
  const studioNames: Record<string, string> = {
    scarlet: 'Scarlet Desires',
    lightbox: 'Lightbox',
    ink_steel: 'Ink & Steel',
    expression: 'Expression',
    cipher_core: 'Cipher Core',
  };
  return studioNames[studioId] || 'Unknown Studio';
}

function getStudioMemberCount(studioId: string): number {
  const memberCounts: Record<string, number> = {
    scarlet: 1247,
    lightbox: 892,
    ink_steel: 643,
    expression: 1089,
    cipher_core: 456,
  };
  return memberCounts[studioId] || 0;
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
