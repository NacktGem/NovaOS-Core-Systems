# Web-Shell Deprecation & Migration Plan

## Current State

- Web-Shell runs on port 3002 as standalone Next.js app
- Provides unlock/password gate functionality via /api/unlock
- Has 404-style landing page with unlock modal
- Routes users to /login after successful unlock

## Migration Strategy

1. ✅ Migrate /api/unlock route to gypsy-cove (Black Rose Collective)
2. 🔄 Create unlock gate middleware in Black Rose instead of separate app
3. 🔄 Remove web-shell from docker-compose.yml
4. 🔄 Archive web-shell directory
5. 🔄 Update any references/routing

## Implementation Steps

### Step 1: Unlock API Migration ✅

- [x] Copied unlock route to gypsy-cove/app/api/unlock/route.ts
- [x] Rate limiting and security measures preserved

### Step 2: Create Unlock Gate Component

- [ ] Create unlock gate middleware/component in Black Rose
- [ ] Implement same 404-style UI within main app
- [ ] Test unlock flow integration

### Step 3: Infrastructure Cleanup

- [ ] Remove web-shell from docker-compose.yml
- [ ] Update port mappings and routing
- [ ] Archive web-shell directory

### Step 4: Testing & Validation

- [ ] Test unlock flow works through Black Rose
- [ ] Verify no broken links or references
- [ ] Validate security and rate limiting still works

## Benefits After Migration

- ✅ Cleaner architecture (3 apps instead of 4)
- ✅ Reduced infrastructure complexity
- ✅ Better user experience (no app switching)
- ✅ Easier maintenance and updates
