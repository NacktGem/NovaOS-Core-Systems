Glitch Service

The Glitch service provides defensive forensics and honeypot functionality. It processes moderation tasks, logs suspicious activity, and exposes admin controls for operational teams.

Deployment
- Configure INTERNAL_TOKEN in environment for admin endpoints.
- Expose /metrics to your Prometheus server or scrape endpoint.

Security
- Admin endpoints require the `INTERNAL_TOKEN` header.
- All event logs are stored in secure, access-controlled storage.
