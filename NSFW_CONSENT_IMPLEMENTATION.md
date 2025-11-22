# NSFW Consent Verification System Implementation

## Overview

The NSFW consent system ensures legal compliance for adult content by tracking explicit user consent for different content types and interactions.

## Database Schema

```sql
-- User Consent Records
CREATE TABLE user_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    agent_id VARCHAR(50) NOT NULL,  -- Which agent they consented to
    consent_type VARCHAR(50) NOT NULL,  -- Type of consent given
    content_scope TEXT[] NOT NULL,  -- Array of content types covered
    explicit_consent BOOLEAN DEFAULT FALSE,  -- Explicit "I agree" checkbox
    age_verified BOOLEAN DEFAULT FALSE,  -- Age verification completed
    consent_text TEXT NOT NULL,  -- Exact consent text shown
    ip_address INET,  -- IP for legal records
    user_agent TEXT,  -- Browser info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,  -- Optional expiration
    revoked_at TIMESTAMP WITH TIME ZONE,  -- If user revoked consent

    UNIQUE(user_id, agent_id, consent_type)
);

-- NSFW Content Flagging
CREATE TABLE nsfw_flagged_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,  -- 'image', 'video', 'message', 'bundle'
    flagged_by VARCHAR(50),  -- 'ai_detection', 'user_report', 'manual_review'
    nsfw_level INTEGER NOT NULL,  -- 1-5 scale
    nsfw_tags TEXT[],  -- Specific NSFW categories
    requires_consent_type VARCHAR(50) NOT NULL,  -- What consent is needed
    creator_id UUID REFERENCES users(id),
    flagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_status VARCHAR(20) DEFAULT 'pending'  -- 'pending', 'approved', 'rejected'
);

-- Consent Verification Log
CREATE TABLE consent_verification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    agent_id VARCHAR(50) NOT NULL,
    verification_result VARCHAR(20) NOT NULL,  -- 'verified', 'violated', 'pending'
    consent_record_id UUID REFERENCES user_consent_records(id),
    violation_reason TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation

### 1. Consent Types Definition

```python
# services/core-api/app/models/consent.py

from enum import Enum

class ConsentType(str, Enum):
    BASIC_INTERACTION = "basic_interaction"
    EXPLICIT_CONTENT = "explicit_content"
    IMAGE_SHARING = "image_sharing"
    VIDEO_CONTENT = "video_content"
    PRIVATE_MESSAGING = "private_messaging"
    ROLE_PLAY = "role_play"
    FINANCIAL_DOMINATION = "financial_domination"

class ContentScope(str, Enum):
    TEXT_ONLY = "text_only"
    IMAGES = "images"
    VIDEOS = "videos"
    AUDIO = "audio"
    LIVE_STREAMS = "live_streams"
    ALL_MEDIA = "all_media"

class NSFWLevel(int, Enum):
    SAFE = 0
    SUGGESTIVE = 1
    PARTIAL_NUDITY = 2
    NUDITY = 3
    EXPLICIT = 4
    EXTREME = 5
```

### 2. Consent Service Implementation

```python
# services/core-api/app/services/consent_service.py

from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.db.models.consent import UserConsentRecord, NSFWFlaggedContent, ConsentVerificationLog
from app.db.models.users import User
from datetime import datetime, timezone, timedelta

class ConsentService:
    def __init__(self, session: Session):
        self.session = session

    async def record_user_consent(
        self,
        user_id: str,
        agent_id: str,
        consent_type: str,
        content_scope: List[str],
        consent_text: str,
        ip_address: str,
        user_agent: str,
        explicit_consent: bool = True,
        age_verified: bool = True
    ) -> Dict:
        """Record user consent for NSFW content interactions"""

        try:
            # Check if consent already exists
            existing = self.session.query(UserConsentRecord).filter(
                UserConsentRecord.user_id == user_id,
                UserConsentRecord.agent_id == agent_id,
                UserConsentRecord.consent_type == consent_type,
                UserConsentRecord.revoked_at.is_(None)
            ).first()

            if existing:
                return {
                    "success": True,
                    "consent_id": str(existing.id),
                    "message": "Consent already recorded"
                }

            # Create new consent record
            consent = UserConsentRecord(
                user_id=user_id,
                agent_id=agent_id,
                consent_type=consent_type,
                content_scope=content_scope,
                explicit_consent=explicit_consent,
                age_verified=age_verified,
                consent_text=consent_text,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=datetime.now(timezone.utc) + timedelta(days=365)  # 1 year expiry
            )

            self.session.add(consent)
            self.session.commit()

            return {
                "success": True,
                "consent_id": str(consent.id),
                "message": "Consent recorded successfully"
            }

        except Exception as e:
            self.session.rollback()
            return {"success": False, "error": str(e)}

    async def verify_consent_for_content(
        self,
        user_id: str,
        agent_id: str,
        content_id: str,
        content_type: str
    ) -> Dict:
        """Verify if user has given consent for specific content"""

        try:
            # Get NSFW flagging for this content
            flagged_content = self.session.query(NSFWFlaggedContent).filter(
                NSFWFlaggedContent.content_id == content_id
            ).first()

            if not flagged_content:
                # Content not flagged as NSFW
                return {
                    "consent_status": "not_required",
                    "content_id": content_id,
                    "message": "Content not flagged as NSFW"
                }

            # Check if user has appropriate consent
            consent_record = self.session.query(UserConsentRecord).filter(
                UserConsentRecord.user_id == user_id,
                UserConsentRecord.agent_id == agent_id,
                UserConsentRecord.consent_type == flagged_content.requires_consent_type,
                UserConsentRecord.explicit_consent == True,
                UserConsentRecord.age_verified == True,
                UserConsentRecord.revoked_at.is_(None),
                UserConsentRecord.expires_at > datetime.now(timezone.utc)
            ).first()

            # Log verification attempt
            verification_result = "verified" if consent_record else "violated"
            violation_reason = None if consent_record else f"No consent for {flagged_content.requires_consent_type}"

            log_entry = ConsentVerificationLog(
                content_id=content_id,
                user_id=user_id,
                agent_id=agent_id,
                verification_result=verification_result,
                consent_record_id=str(consent_record.id) if consent_record else None,
                violation_reason=violation_reason
            )

            self.session.add(log_entry)
            self.session.commit()

            if consent_record:
                return {
                    "consent_status": "verified",
                    "content_id": content_id,
                    "consent_record_id": str(consent_record.id),
                    "consent_date": consent_record.created_at.isoformat(),
                    "consent_scope": consent_record.content_scope,
                    "user_age_verified": consent_record.age_verified
                }
            else:
                return {
                    "consent_status": "violated",
                    "content_id": content_id,
                    "violation_reason": violation_reason,
                    "requires_action": True,
                    "required_consent_type": flagged_content.requires_consent_type
                }

        except Exception as e:
            return {"consent_status": "error", "error": str(e)}

    async def flag_content_as_nsfw(
        self,
        content_id: str,
        content_type: str,
        nsfw_level: int,
        nsfw_tags: List[str],
        requires_consent_type: str,
        flagged_by: str = "ai_detection",
        creator_id: Optional[str] = None
    ) -> Dict:
        """Flag content as NSFW requiring consent"""

        try:
            # Check if already flagged
            existing = self.session.query(NSFWFlaggedContent).filter(
                NSFWFlaggedContent.content_id == content_id
            ).first()

            if existing:
                return {
                    "success": True,
                    "message": "Content already flagged",
                    "flag_id": str(existing.id)
                }

            flagged = NSFWFlaggedContent(
                content_id=content_id,
                content_type=content_type,
                flagged_by=flagged_by,
                nsfw_level=nsfw_level,
                nsfw_tags=nsfw_tags,
                requires_consent_type=requires_consent_type,
                creator_id=creator_id
            )

            self.session.add(flagged)
            self.session.commit()

            return {
                "success": True,
                "flag_id": str(flagged.id),
                "message": "Content flagged as NSFW"
            }

        except Exception as e:
            self.session.rollback()
            return {"success": False, "error": str(e)}
```

### 3. Replace Mock Analytics Implementation

```python
# Fix the mock consent verification in analytics.py

@router.post("/nsfw/verify-consent")
def verify_consent_for_nsfw_content(
    content_ids: List[str],
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Verify consent records for multiple NSFW flagged content items"""
    if user.role not in ["godmode", "jules", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    from app.services.consent_service import ConsentService
    consent_service = ConsentService(session)

    consent_results = []

    for content_id in content_ids:
        # Verify consent using actual service
        result = await consent_service.verify_consent_for_content(
            user_id=str(user.id),
            agent_id="glitch",  # Security agent doing the check
            content_id=content_id,
            content_type="unknown"  # You may want to pass this in
        )

        consent_results.append(result)

    return {
        "results": consent_results,
        "summary": {
            "total_checked": len(content_ids),
            "verified": len([r for r in consent_results if r.get("consent_status") == "verified"]),
            "violated": len([r for r in consent_results if r.get("consent_status") == "violated"]),
            "pending": len([r for r in consent_results if r.get("consent_status") == "pending"]),
        },
        "checked_at": datetime.utcnow().isoformat(),
    }
```

### 4. Frontend Consent Collection

```typescript
// apps/web-shell/components/consent/ConsentModal.tsx

interface ConsentModalProps {
  agentId: string;
  consentType: string;
  onConsent: (granted: boolean) => void;
}

export function ConsentModal({ agentId, consentType, onConsent }: ConsentModalProps) {
  const [ageVerified, setAgeVerified] = useState(false);
  const [explicitConsent, setExplicitConsent] = useState(false);

  const handleSubmitConsent = async () => {
    if (!ageVerified || !explicitConsent) return;

    const response = await fetch('/api/consent/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      },
      body: JSON.stringify({
        agent_id: agentId,
        consent_type: consentType,
        content_scope: ['images', 'videos', 'text'],
        explicit_consent: true,
        age_verified: true,
        consent_text: `I consent to ${consentType} interactions with ${agentId}`
      })
    });

    const result = await response.json();
    onConsent(result.success);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md">
        <h2>Content Consent Required</h2>
        <p>This interaction contains adult content. Please confirm:</p>

        <label className="flex items-center mt-4">
          <input
            type="checkbox"
            checked={ageVerified}
            onChange={(e) => setAgeVerified(e.target.checked)}
          />
          <span className="ml-2">I am 18+ years old</span>
        </label>

        <label className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={explicitConsent}
            onChange={(e) => setExplicitConsent(e.target.checked)}
          />
          <span className="ml-2">I consent to viewing explicit content</span>
        </label>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onConsent(false)}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Decline
          </button>
          <button
            onClick={handleSubmitConsent}
            disabled={!ageVerified || !explicitConsent}
            className="px-4 py-2 bg-rose-600 text-white rounded disabled:opacity-50"
          >
            I Consent
          </button>
        </div>
      </div>
    </div>
  );
}
```

## What You Need To Do:

1. **Create database migration** for the consent tables
2. **Replace the mock analytics.py logic** with the real service
3. **Add consent collection to frontend** before NSFW content
4. **Configure AI content detection** to auto-flag NSFW content
5. **Set up consent verification middleware** for agent interactions

This ensures full legal compliance for adult content platforms.
