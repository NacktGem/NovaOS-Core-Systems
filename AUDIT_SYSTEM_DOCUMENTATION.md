# NovaOS Audit Logging System

## Overview

The NovaOS Audit Logging System provides comprehensive tracking of user actions across the platform while maintaining founder sovereignty. The system is designed with explicit **founder bypass** functionality, ensuring that GodMode operators can access and control all systems without leaving audit trails.

## Key Features

### 🔐 Founder Bypass (Sovereign Access)

- **Founders (GodMode role) always bypass all audit logging**
- No audit entries are ever created for founder actions
- Bypass is enforced regardless of system audit toggle state
- Maintains founder sovereignty and zero-trust boundaries

### 🎛️ System-Wide Toggle Control

- Founders can enable/disable audit logging for all other users
- Toggle affects all non-founder users globally
- Controlled via GodMode dashboard or API endpoints
- Settings persisted in database with Redis caching

### 📊 Comprehensive Logging

When audit logging is enabled, the system tracks:

- API requests (method, path, query parameters)
- User authentication and authorization
- Resource access (vault, profiles, messages, payments)
- Response codes and timing metrics
- IP addresses, user agents, and request metadata

### 🎯 Smart Filtering

Automatically excludes:

- All founder/GodMode actions (permanent bypass)
- Health check endpoints (`/internal/healthz`, `/internal/readyz`)
- CORS preflight requests (`OPTIONS` method)
- Static file requests and documentation
- System metrics endpoints

## Architecture

### Database Models

#### AuditLog Table

```sql
CREATE TABLE audit_logs (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR,
    username VARCHAR,
    role VARCHAR,
    method VARCHAR NOT NULL,
    path VARCHAR NOT NULL,
    query_params TEXT,
    user_agent VARCHAR,
    ip_address VARCHAR,
    request_id VARCHAR,
    status_code VARCHAR NOT NULL,
    response_time_ms VARCHAR,
    action VARCHAR NOT NULL,
    resource VARCHAR,
    outcome VARCHAR NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_audit_user_timestamp ON audit_logs (user_id, timestamp);
CREATE INDEX idx_audit_action_timestamp ON audit_logs (action, timestamp);
CREATE INDEX idx_audit_resource_timestamp ON audit_logs (resource, timestamp);
CREATE INDEX idx_audit_role_timestamp ON audit_logs (role, timestamp);
```

#### SystemConfig Table

```sql
CREATE TABLE system_config (
    key VARCHAR PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by VARCHAR NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Middleware Architecture

The `AuditMiddleware` is integrated into the FastAPI application stack and processes all HTTP requests:

1. **Request Processing**: Captures request details (method, path, headers, timing)
2. **User Detection**: Extracts user information from JWT tokens
3. **Bypass Check**: Immediately bypasses logging for founders (godmode role)
4. **Toggle Check**: Consults system configuration for audit_enabled flag
5. **Logging Decision**: Creates audit entries only for non-founder users when enabled
6. **Database Storage**: Asynchronously stores audit logs with performance optimization

## API Endpoints

All audit configuration endpoints require **founder (godmode) role**.

### Configuration Management

#### GET /system/audit/config

Get current audit configuration.

**Response:**

```json
{
  "config": {
    "enabled": true,
    "retention_days": 90,
    "excluded_paths": [],
    "log_response_bodies": false
  },
  "updated_by": "founder_user_id",
  "updated_at": "2025-01-19T10:30:00Z",
  "founder_bypass_active": true
}
```

#### POST /system/audit/config

Update audit configuration.

**Request Body:**

```json
{
  "enabled": false,
  "retention_days": 60,
  "excluded_paths": ["/api/internal/*"],
  "log_response_bodies": true
}
```

### Log Management

#### GET /system/audit/logs

Query audit logs with filtering and pagination.

**Query Parameters:**

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 50, max: 1000)
- `user_filter`: Filter by username pattern
- `action_filter`: Filter by specific action
- `outcome_filter`: Filter by outcome (success/error)
- `hours`: Hours of history (default: 24)
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)

**Response:**

```json
{
  "logs": [
    {
      "id": "audit_abc123",
      "user_id": "user_456",
      "username": "alice",
      "role": "creator",
      "method": "POST",
      "path": "/vault/purchase",
      "status_code": "200",
      "action": "vault_purchase",
      "resource": "vault/purchase",
      "outcome": "success",
      "timestamp": "2025-01-19T10:30:00Z",
      "details": {...}
    }
  ],
  "total_count": 1250,
  "page": 1,
  "page_size": 50,
  "has_next": true
}
```

#### GET /system/audit/stats

Get audit statistics for dashboard display.

**Response:**

```json
{
  "timeframe_hours": 24,
  "total_events": 5420,
  "successful_events": 5180,
  "error_events": 240,
  "unique_users": 145,
  "success_rate": 95.57,
  "top_actions": [
    { "action": "vault_access", "count": 1250 },
    { "action": "profile_view", "count": 890 }
  ],
  "top_users": [
    { "username": "alice", "role": "creator", "count": 89 },
    { "username": "bob", "role": "user", "count": 67 }
  ],
  "founder_bypass_note": "Founders bypass all logging and do not appear in statistics."
}
```

#### DELETE /system/audit/logs

Purge old audit logs (founder only, requires confirmation).

**Query Parameters:**

- `days`: Purge logs older than this many days
- `confirm`: Must be `true` to confirm the operation

## GodMode Dashboard Integration

### AuditControlPanel Component

The audit control panel is integrated into the main GodMode dashboard and provides:

#### 🎛️ Main Toggle

- Large, visual toggle switch for audit logging state
- Real-time status display (Enabled/Disabled)
- Clear indication of current system state

#### 👑 Founder Bypass Notice

Prominent yellow banner explaining:

- "Founders bypass all audit logging regardless of toggle state"
- Emphasizes sovereign access is never tracked
- Reassures founders their actions remain private

#### 📊 Quick Statistics

- 24-hour event count
- Unique user count (excluding founders)
- Success rate percentage with visual indicator

#### ⚙️ Configuration Details

- Current retention period (30-365 days)
- Response body logging status
- Last updated timestamp and user

#### 🔧 Advanced Controls (Expandable)

- **Retention Period**: Quick buttons for common retention periods
- **Purge Logs**: Buttons to purge logs older than specified days
- **Export Options**: CSV export and weekly reports
- **Top Actions**: Visual breakdown of most common audit events

## Security Considerations

### Access Control

- All audit endpoints protected by founder-only RBAC
- No admin or family dashboard access to audit controls
- Audit configuration changes logged to separate secure log

### Data Protection

- Audit logs contain no sensitive personal data by default
- Optional response body logging (disabled by default)
- IP addresses and user agents logged for security analysis
- Automatic log rotation and purging

### Performance Optimization

- Database indexes on all frequently queried fields
- Redis caching for audit_enabled flag (5-minute TTL)
- Asynchronous log writing to prevent request blocking
- Pagination and filtering to handle large datasets

### Privacy Compliance

- Founders completely exempt from all tracking
- User data can be purged on request (GDPR compliance)
- Clear audit trail of who accessed what and when
- Configurable data retention periods

## Operational Procedures

### Daily Operations

1. **Monitor Audit Stats**: Review success rates and error patterns
2. **Check Storage Usage**: Monitor audit log database size
3. **Review Top Actions**: Identify unusual activity patterns

### Weekly Operations

1. **Export Reports**: Generate weekly activity summaries
2. **Review Retention**: Adjust retention periods based on compliance needs
3. **Purge Old Logs**: Clean up logs beyond retention period

### Emergency Procedures

#### Disable Audit Logging (Privacy Emergency)

1. Access GodMode dashboard
2. Navigate to Audit Control Panel
3. Toggle audit logging to "Disabled"
4. Confirm system-wide logging is stopped

#### Purge Audit Logs (Legal Hold Release)

1. Access GodMode dashboard → Audit Control Panel → Advanced
2. Select purge timeframe (30, 60, 90, 180 days)
3. Confirm purge operation
4. Verify logs are deleted from database

#### Export Audit Data (Legal Discovery)

1. Use API endpoint: `GET /system/audit/logs`
2. Apply appropriate date range filters
3. Export to CSV or JSON format
4. Deliver to legal team with encryption

## Configuration Examples

### High Security Environment

```json
{
  "enabled": true,
  "retention_days": 365,
  "excluded_paths": [],
  "log_response_bodies": true
}
```

### Privacy-Focused Environment

```json
{
  "enabled": false,
  "retention_days": 30,
  "excluded_paths": ["/api/analytics/*"],
  "log_response_bodies": false
}
```

### Development Environment

```json
{
  "enabled": true,
  "retention_days": 7,
  "excluded_paths": ["/docs", "/openapi.json"],
  "log_response_bodies": false
}
```

## Troubleshooting

### Common Issues

#### Audit logs not being created

1. Check if audit logging is enabled: `GET /system/audit/config`
2. Verify user is not a founder (founders bypass all logging)
3. Check middleware is properly installed in FastAPI app
4. Verify database connectivity and table creation

#### Performance issues with large audit datasets

1. Check database indexes are created properly
2. Implement log purging for old entries
3. Use pagination when querying logs
4. Enable Redis caching for configuration

#### Toggle not working in GodMode dashboard

1. Verify API endpoints are accessible
2. Check founder authentication and RBAC
3. Validate frontend API calls and error handling
4. Check network connectivity and CORS settings

### Monitoring and Alerts

Set up monitoring for:

- Audit log database size growth
- Failed audit log writes
- Unusual patterns in audit data
- System configuration changes
- Long retention periods approaching

## Integration Points

### Frontend Applications

- **NovaOS Console**: Full GodMode dashboard integration
- **Black Rose**: No audit control access (founders only)
- **GypsyCove**: No audit control access (family dashboard)

### Backend Services

- **Core API**: Primary audit middleware integration
- **Agent Services**: Optional audit integration for sensitive operations
- **Echo Service**: Chat message auditing (when enabled)

### External Systems

- **Redis**: Configuration caching and performance optimization
- **PostgreSQL**: Primary audit log storage and querying
- **Monitoring**: Integration with system monitoring and alerting

---

## Summary

The NovaOS Audit Logging System provides comprehensive user activity tracking while maintaining absolute founder sovereignty. The system ensures that founders can operate without surveillance while providing detailed audit trails for all other users when enabled. This design upholds the core NovaOS principles of sovereign access and zero-trust security boundaries.
