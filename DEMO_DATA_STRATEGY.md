# Mock Creator Data Strategy for Pre-Launch

## Approach: Realistic Demo Data Generator

Since the platform isn't live yet, create **realistic but clearly demo** data that:

1. Shows the platform's capabilities
2. Doesn't mislead about real creators
3. Can be easily replaced when real creators join

## Implementation Strategy

### 1. Demo Data Service

```python
# services/core-api/app/services/demo_data_service.py

from typing import List, Dict
import random
from datetime import datetime, timedelta
from decimal import Decimal

class DemoDataService:
    """Generate realistic demo data for platform preview"""

    # Clearly demo creator names
    DEMO_CREATORS = [
        "Demo_Luna_Star", "Demo_Aurora_Rose", "Demo_Violet_Moon",
        "Demo_Scarlett_Fire", "Demo_Raven_Dark", "Demo_Jade_Green",
        "Demo_Crystal_Blue", "Demo_Phoenix_Gold", "Demo_Storm_Silver"
    ]

    DEMO_CONTENT_TYPES = [
        "Photo Set (18+ Preview)", "Video Preview (Demo)",
        "Audio Message (Sample)", "Text Story (Demo)",
        "Live Stream Highlight (Demo)"
    ]

    def generate_demo_creators(self, count: int = 9) -> List[Dict]:
        """Generate demo creator profiles"""
        creators = []

        for i, name in enumerate(self.DEMO_CREATORS[:count]):
            creator = {
                "id": f"demo_creator_{i+1}",
                "username": name,
                "displayName": name.replace("Demo_", "").replace("_", " "),
                "bio": f"✨ DEMO CREATOR ✨ Showcasing platform features. Real creators coming soon!",
                "followerCount": random.randint(100, 5000),
                "contentCount": random.randint(10, 100),
                "isVerified": True,
                "isDemoAccount": True,  # Important flag
                "avatar": f"/demo-avatars/creator_{i+1}.jpg",
                "coverImage": f"/demo-covers/creator_{i+1}.jpg",
                "totalEarnings": round(random.uniform(500, 5000), 2),
                "monthlyEarnings": round(random.uniform(100, 1000), 2),
                "subscriptionPrice": round(random.uniform(9.99, 29.99), 2),
                "createdAt": (datetime.now() - timedelta(days=random.randint(30, 365))).isoformat()
            }
            creators.append(creator)

        return creators

    def generate_demo_vault_content(self, creator_id: str, count: int = 20) -> List[Dict]:
        """Generate demo vault content for a creator"""
        content = []

        for i in range(count):
            item = {
                "id": f"demo_content_{creator_id}_{i+1}",
                "creatorId": creator_id,
                "title": f"Demo Content #{i+1} - Platform Preview",
                "description": "🎭 DEMO CONTENT - Showcasing platform features",
                "contentType": random.choice(self.DEMO_CONTENT_TYPES),
                "price": round(random.uniform(5.00, 50.00), 2),
                "nsfwLevel": random.randint(0, 3),  # Keep demo content moderate
                "thumbnail": f"/demo-content/thumb_{i+1}.jpg",
                "itemCount": random.randint(1, 10),
                "tags": ["demo", "preview", "sample"],
                "createdAt": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
                "isDemoContent": True,  # Important flag
                "views": random.randint(10, 500),
                "likes": random.randint(1, 50),
                "purchaseCount": random.randint(0, 25)
            }
            content.append(item)

        return content

    def generate_demo_analytics(self, creator_id: str) -> Dict:
        """Generate realistic analytics for demo creators"""
        base_date = datetime.now()

        # Generate 30 days of demo data
        daily_data = []
        for days_ago in range(30):
            date = (base_date - timedelta(days=days_ago))
            daily_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "revenue": round(random.uniform(10, 200), 2),
                "views": random.randint(50, 500),
                "newFollowers": random.randint(0, 10),
                "contentSales": random.randint(0, 15)
            })

        return {
            "creatorId": creator_id,
            "isDemoData": True,
            "totalRevenue": sum(d["revenue"] for d in daily_data),
            "totalViews": sum(d["views"] for d in daily_data),
            "totalFollowers": random.randint(100, 5000),
            "conversionRate": round(random.uniform(2.5, 8.5), 2),
            "dailyData": daily_data,
            "topPerformingContent": [
                {
                    "contentId": f"demo_content_{creator_id}_1",
                    "title": "Top Demo Content #1",
                    "revenue": round(random.uniform(100, 500), 2),
                    "views": random.randint(200, 1000)
                }
            ]
        }
```

### 2. Demo Mode API Endpoints

```python
# services/core-api/app/routes/demo.py

from fastapi import APIRouter, Depends, HTTPException
from app.services.demo_data_service import DemoDataService

router = APIRouter(prefix="/demo", tags=["demo"])
demo_service = DemoDataService()

@router.get("/creators")
async def get_demo_creators():
    """Get demo creator profiles for platform preview"""
    return {
        "creators": demo_service.generate_demo_creators(),
        "isDemo": True,
        "message": "Demo data - Real creators coming soon!"
    }

@router.get("/creators/{creator_id}/content")
async def get_demo_creator_content(creator_id: str):
    """Get demo content for a creator"""
    if not creator_id.startswith("demo_creator_"):
        raise HTTPException(status_code=404, detail="Demo creator not found")

    return {
        "content": demo_service.generate_demo_vault_content(creator_id),
        "isDemo": True,
        "creatorId": creator_id
    }

@router.get("/creators/{creator_id}/analytics")
async def get_demo_analytics(creator_id: str):
    """Get demo analytics for a creator"""
    if not creator_id.startswith("demo_creator_"):
        raise HTTPException(status_code=404, detail="Demo creator not found")

    return demo_service.generate_demo_analytics(creator_id)
```

### 3. Frontend Demo Mode Integration

```typescript
// apps/web-shell/lib/demo-mode.ts

export const isDemoMode = () => {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    (typeof window !== 'undefined' && window.location.hostname.includes('demo'))
  );
};

export const getDemoCreators = async () => {
  if (!isDemoMode()) return null;

  const response = await fetch('/api/demo/creators');
  return response.json();
};

export const getDemoCreatorContent = async (creatorId: string) => {
  if (!isDemoMode()) return null;

  const response = await fetch(`/api/demo/creators/${creatorId}/content`);
  return response.json();
};

// Replace existing MOCK_CREATOR_DATA usage
export const getCreatorData = async () => {
  if (isDemoMode()) {
    return await getDemoCreators();
  }

  // Real API call for live mode
  const response = await fetch('/api/creators');
  return response.json();
};
```

### 4. Demo Mode UI Components

```typescript
// apps/web-shell/components/demo/DemoModeIndicator.tsx

export function DemoModeIndicator() {
  if (!isDemoMode()) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 text-center">
      <div className="flex items-center justify-center gap-2">
        <span className="animate-pulse">🎭</span>
        <span className="font-medium">DEMO MODE</span>
        <span className="animate-pulse">🎭</span>
      </div>
      <p className="text-sm opacity-90">
        Showcasing platform features - Real creators launching soon!
      </p>
    </div>
  );
}

// Add to main layout
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DemoModeIndicator />
      {children}
    </div>
  );
}
```

### 5. Environment Configuration

```bash
# .env.local for demo mode
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_CREATOR_SIGNUPS_ENABLED=false

# .env.production for live mode
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_CREATOR_SIGNUPS_ENABLED=true
```

### 6. Demo Content Assets

Create demo content in `apps/web-shell/public/demo-assets/`:

- `/demo-avatars/` - AI-generated creator avatars
- `/demo-covers/` - Cover images for profiles
- `/demo-content/` - Sample content thumbnails
- Mark all files clearly as "DEMO" or "SAMPLE"

### 7. Easy Switch to Live Mode

```typescript
// When ready to go live, just flip the environment variable
// All demo data automatically disappears
// Real creator registration opens
// Demo API endpoints become inactive

// Migration script to seed with first real creators
const migrateToLiveMode = async () => {
  // Disable demo mode
  process.env.NEXT_PUBLIC_DEMO_MODE = 'false';

  // Clear demo data from frontend state
  localStorage.removeItem('demo_creator_data');

  // Enable real creator features
  enableCreatorSignups();
  enablePaymentProcessing();

  console.log('Platform switched to LIVE MODE! 🚀');
};
```

## Benefits of This Approach:

✅ **Professional Demo**: Shows platform capabilities without fake data
✅ **Clear Labeling**: Everything marked as "DEMO" - no confusion
✅ **Easy Transition**: Flip environment variable to go live
✅ **Realistic Data**: Proper statistics and content types
✅ **No Misleading**: Users know it's preview content
✅ **SEO Safe**: Demo content not indexed as real creator content

## Current Frontend Files to Update:

Replace `MOCK_CREATOR_DATA` and `MOCK_VAULT_DATA` in these files with demo service calls:

- Dashboard components in `/apps/web-shell/app/blackrose/dashboard/`
- Vault pages in `/apps/web-shell/app/blackrose/vault/`
- Creator profile components
- Analytics displays
