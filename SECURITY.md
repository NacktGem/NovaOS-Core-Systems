# Security Policy — NovaOS

NovaOS is built to the Sovereign Standard, prioritizing local-first execution, zero-trust principles, and role-based permissions.

## Supported Versions
Security patches are provided for the latest release branch only.

## Reporting a Vulnerability
If you discover a security issue:
1. Do NOT create a public GitHub issue.
2. Email [Founder Contact Placeholder] with:
   - Detailed description of the issue
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. You will receive a response within 72 hours.

## Security Design
- **Encryption:** AES-256-GCM & XChaCha20-Poly1305 for symmetric, Kyber hybrid key exchange.
- **Local-first:** No sensitive keys, vaults, or AI models leave the local environment.
- **Role Enforcement:** Founder GodMode bypasses all logging; all other roles fully logged.
- **Modules:** All modules are signed and verified before load.
- **No External CDNs:** All assets are self-hosted to prevent tracking.

## Prohibited Practices
- No covert surveillance
- No non-consensual monitoring
- No third-party analytics without explicit consent
