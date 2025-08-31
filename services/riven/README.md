Riven Service

The Riven service provides role-based dashboards for parental, medical, and off-grid monitoring.

Key features
- Role-restricted dashboards (parental, medical, off-grid)
- Audit logs and activity reporting
- Integration surface with Nova Console for permissions

Deployment
- Configure environment from `.env.core.example`.
- Ensure `nova-console` is available and user roles defined.

Security
- Use TLS in production and rotate keys regularly.
- Audit access via centralized logging.
