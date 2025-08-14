# Contributing to NovaOS

Thank you for your interest in contributing to NovaOS.

## Code of Conduct
NovaOS is built on respect, privacy, and the Sovereign Standard.  
All contributions must align with:
- Privacy-first principles
- No cloud dependence for core features
- Role-based, auditable permissions (except Founder bypass)

## How to Contribute
1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes.
4. Ensure all tests pass locally:
   ```bash
   pnpm -r test
   5.	Submit a pull request with:
	•	A clear description of the change
	•	Any related issue numbers

Code Style
	•	TypeScript: ESLint (strict), Prettier
	•	Python: Ruff + Black
	•	Commit messages follow Conventional Commits

Prohibited Contributions

We do not accept:
	•	Code that introduces non-consensual monitoring
	•	Code that transmits sensitive data to external servers
	•	Dependencies on non-self-hosted, proprietary services for core features
