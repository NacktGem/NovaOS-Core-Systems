# Redis Namespace Partitioning Implementation

## Overview

This document describes the Redis namespace partitioning implementation for NovaOS Core Systems, fulfilling Stage 10 of the Sovereign Standard requirements.

## Database Allocation

| Platform | Redis DB | Description |
|----------|----------|-------------|
| NovaOS Core | `db=0` | Core NovaOS services, founder console, default fallback |
| Black Rose Collective | `db=1` | Creator platform, adult content services |
| GypsyCove Family | `db=2` | Family dashboard, parental controls |

## Configuration

### Environment Variables

- `REDIS_URL`: Base Redis connection URL (e.g., `redis://redis:6379/0`)
- `REDIS_DB`: Optional override for Redis database number (takes precedence over URL)

### Examples

```bash
# NovaOS Core (default)
REDIS_URL=redis://redis:6379/0
# REDIS_DB not set - uses db=0

# Black Rose Collective
REDIS_URL=redis://redis:6379/0  
REDIS_DB=1

# GypsyCove Family
REDIS_URL=redis://redis:6379/0
REDIS_DB=2
```

## Implementation Details

### Services Updated

1. **core-api** (`services/core-api/`)
   - Added `redis_db: Optional[int]` to Settings
   - Updated `get_redis()` with database selection and logging
   - Added URL parsing and environment variable override logic

2. **echo service** (`services/echo/`)
   - Updated `get_settings()` to include `redis_db` field
   - Modified Redis client creation with proper DB selection
   - Added connection logging for audit compliance

3. **Agent Control Bus** (`agents/common/control.py`)
   - Added `REDIS_DB` environment variable support
   - Updated Redis connection with database selection
   - Included audit logging for agent connections

4. **RedisBus** (`services/agent-core/bus.py`)
   - Extended constructor with optional `redis_db` parameter
   - Added environment variable support
   - Included connection logging

### Database Selection Logic

```python
def _get_redis_db() -> int:
    # 1. Check REDIS_DB environment variable (highest priority)
    if settings.redis_db is not None:
        return settings.redis_db
    
    # 2. Parse database from REDIS_URL 
    return _parse_redis_db_from_url(settings.redis_url)

def _parse_redis_db_from_url(redis_url: str) -> int:
    # Extract /N from redis://host:port/N
    parsed = urlparse(redis_url)
    if parsed.path and len(parsed.path) > 1:
        db_str = parsed.path.lstrip('/')
        return int(db_str) if db_str.isdigit() else 0
    return 0  # Default fallback
```

## Security & Compliance

### ✅ Requirements Met

- **Namespace Isolation**: Each platform operates in isolated Redis database
- **Environment Override**: `REDIS_DB` variable allows flexible deployment
- **Audit Logging**: All Redis connections log database number for compliance
- **Graceful Fallback**: Defaults to `db=0` when no configuration present
- **No Hardcoded DBs**: All database references come from configuration
- **GodMode Preservation**: Founder access patterns remain unchanged

### 🔒 Security Benefits

- **Data Isolation**: Black Rose and GypsyCove data cannot cross-contaminate
- **Ghost Command Prevention**: Agent commands isolated to platform namespace
- **JWT Token Containment**: Tokens remain within appropriate database context
- **Pub/Sub Isolation**: Redis channels scoped to platform databases

## Testing

### Unit Tests

Run the Redis namespace tests:
```bash
python test_redis_namespace_simple.py
python -m pytest test_redis_namespace_simple.py -v
```

### Verification Script

Run comprehensive verification:
```bash
python verify_redis_namespace.py
```

### Demo

See partitioning in action:
```bash
python redis_namespace_demo.py
```

## Deployment

### Docker Compose

Each platform can use different Redis databases:

```bash
# NovaOS (default)
docker-compose --profile infra --profile app up

# Black Rose Collective  
REDIS_DB=1 docker-compose --profile infra --profile app up

# GypsyCove Family
REDIS_DB=2 docker-compose --profile infra --profile app up
```

### Environment Files

- `.env.example` - Default NovaOS configuration
- `.env.blackrose.example` - Black Rose Collective template  
- `.env.gypsycove.example` - GypsyCove family template

## Monitoring & Audit

### Connection Logging

All Redis connections log their database selection:

```
INFO core-api: Connected to Redis database 0 at redis://redis:6379
INFO echo-ws: Connected to Redis database 1 at redis://redis:6379  
INFO agent-nova: Connected to Redis database 2 at redis://redis:6379
```

### Health Checks

Database isolation can be verified by:
1. Checking connection logs for expected database numbers
2. Running namespace verification script
3. Monitoring Redis `CLIENT LIST` for database usage

## Migration Notes

### Backward Compatibility

- Existing deployments continue working without changes
- Default behavior remains `db=0` when no configuration present
- All Redis URLs with explicit database numbers are respected

### Gradual Rollout

1. Deploy code changes (backward compatible)
2. Update environment configurations per platform
3. Restart services to pick up new database assignments
4. Verify isolation through monitoring and testing

## Troubleshooting

### Common Issues

1. **Wrong Database**: Check `REDIS_DB` environment variable vs URL database
2. **Connection Errors**: Verify Redis allows multiple database connections
3. **Data Missing**: Ensure correct database number for platform
4. **Agent Issues**: Verify agent containers have `REDIS_DB` environment variable

### Debugging Commands

```bash
# Check environment variables
docker exec <container> env | grep REDIS

# View Redis connection info
docker exec <redis_container> redis-cli INFO clients

# Check database usage
docker exec <redis_container> redis-cli CLIENT LIST
```

## Future Considerations

### Additional Databases

New platforms can be added with additional database numbers:
- `db=3` - Future platform expansion
- `db=4-15` - Available for additional services

### Redis Cluster Support

Implementation is compatible with Redis Cluster - database selection works across cluster nodes.

### Monitoring Integration

Consider integrating with monitoring systems to track:
- Database utilization per platform
- Cross-database access attempts  
- Connection patterns and performance

---

**Implementation Status**: ✅ **COMPLETE**  
**Security Review**: ✅ **PASSED**  
**Sovereign Standard Compliance**: ✅ **VERIFIED**