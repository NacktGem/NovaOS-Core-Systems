# NovaOS Supply Chain Verification Guide

This document describes how to verify the security and integrity of NovaOS platform containers.

## Stage 11 Sovereign Standard Implementation

All NovaOS platform containers include:

### 📋 SBOM (Software Bill of Materials)
- Generated using `syft` (anchore/syft)
- Format: `syft-json` (preferred format)
- Available as GitHub Actions artifacts
- Embedded in image metadata

### 🔐 SLSA Provenance (Supply Chain Signing)
- Images signed using `cosign` with GitHub OIDC
- Signed with digest + build metadata
- No private keys required - uses GitHub's identity token

### 🧪 Manual Verification Commands

#### Verify SBOM Generation
```bash
# Check packages and hashes in a published image
syft ghcr.io/nacktgem/novaos-agent-nova:latest

# View SBOM in syft-json format
syft ghcr.io/nacktgem/novaos-agent-nova:latest -o syft-json
```

#### Verify Cosign Signatures
```bash
# Verify signature with GitHub OIDC (no public key needed)
cosign verify ghcr.io/nacktgem/novaos-agent-nova:latest \
  --certificate-identity-regexp="https://github.com/NacktGem/NovaOS-Core-Systems/.*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"

# Alternative: verify with rekor transparency log
cosign verify ghcr.io/nacktgem/novaos-agent-nova:latest --certificate-chain bundle.crt
```

#### Download SBOM Artifacts
SBOM files are available as GitHub Actions artifacts in the publish workflow runs.

### 🏭 CI/CD Pipeline

The complete supply chain verification is integrated into:
- `ci.yml`: Project-level SBOM generation and artifact upload
- `publish-agents.yml`: Per-agent SBOM generation and image signing

### 🛡️ Security Features

- **No private dependency leaks**: All dependencies are catalogued and verified
- **No placeholder SBOMs**: Build fails if SBOM generation fails
- **Early error detection**: SBOM generation errors cause immediate build failure
- **Full traceability**: Every layer auditable from PR to deploy

### 📦 Signed Images

All agent images are published to GHCR with:
- Format: `ghcr.io/nacktgem/novaos-agent-{name}:latest`
- With digest, SBOM link, and provenance
- Cryptographic verification available

Available agents:
- nova (orchestrator)
- lyra, velora, glitch, echo, riven, audita