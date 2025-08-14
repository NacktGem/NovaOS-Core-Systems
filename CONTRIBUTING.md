# Contributing to NovaOS

NovaOS is a **private, invite-only project**.  
Only vetted and authorized developers may contribute. All contributions must adhere to the **Sovereign Standard**.

---

## Code of Conduct
By contributing, you agree to:
- Uphold **privacy-first principles** at all times.
- Maintain **zero cloud dependence** for core features.
- Respect **role-based, auditable permissions** (Founder bypass is absolute and unlogged).
- Protect system security, sovereignty, and user anonymity.

Any violation may result in permanent removal of access.

---

## Contribution Workflow (Invite-Only)

1. **Clone the repository**  
   You will be given access directly to the private repo.
   
2. **Create a feature branch**  
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes** following the code style rules below.

4. **Run tests locally** before committing:
   ```bash
   pnpm -r test   # for JS/TS packages
   pytest         # for Python modules
   ```

5. **Submit a Pull Request** (PR) to the `dev` branch.  
   PRs must include:
   - A clear description of the change
   - Related issue/ticket numbers
   - Confirmation that all tests pass

---

## Code Style & Tooling

**TypeScript / JavaScript**
- ESLint (**strict mode**)
- Prettier formatting rules

**Python**
- Ruff for linting
- Black for formatting

**Commits**
- Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

---

## Prohibited Contributions

The following will be **immediately rejected**:
- Code introducing **non-consensual monitoring** or surveillance
- Code transmitting **sensitive data** to any external server
- Dependencies on **non-self-hosted** or **proprietary services** for any core feature
- Placeholder code for production modules — all contributions must be **production-ready**

---

## Security & Privacy Rules

- All sensitive files must be excluded via `.gitignore` and never pushed to remote.
- Keys, credentials, and secrets must be stored in **local, encrypted configs** only.
- All code changes are subject to **security review** before merge.

---

## Final Notes

NovaOS is not just code — it’s a **sovereign system**.  
Every line you write is part of a security-critical, founder-controlled environment. Treat it accordingly.