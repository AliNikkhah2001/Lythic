# Security Review Skill

## OWASP Top 10 (2021) Checklist

### A01: Broken Access Control
- [ ] Authorization checks on every endpoint
- [ ] Resource ownership validation (`user.can_access(resource)`)
- [ ] No IDOR (Insecure Direct Object References)
- [ ] Default deny, explicit allow
- [ ] CORS configured restrictively

### A02: Cryptographic Failures
- [ ] TLS 1.3 everywhere (HSTS, secure cookies)
- [ ] Encryption at rest (AES-256-GCM)
- [ ] Keys in vault/HSM, not code/config
- [ ] Password hashing: Argon2id/bcrypt/scrypt
- [ ] No deprecated crypto (MD5, SHA1, RSA < 2048)

### A03: Injection
- [ ] Parameterized queries (never string concat)
- [ ] ORM used correctly (no raw SQL with user input)
- [ ] Input validation at boundary (Zod/Pydantic)
- [ ] Output encoding (HTML, JS, SQL, LDAP)
- [ ] Command injection: no `shell=True`, `eval`, `exec`

### A04: Insecure Design
- [ ] Threat modeling (STRIDE) for new features
- [ ] Security requirements in specs
- [ ] Secure defaults (fail closed)
- [ ] Rate limiting on auth endpoints
- [ ] Business logic validation

### A05: Security Misconfiguration
- [ ] Debug disabled in production
- [ ] Default credentials changed
- [ ] Unnecessary features/services disabled
- [ ] Security headers (CSP, HSTS, X-Frame-Options)
- [ ] Container hardening (non-root, read-only FS)

### A06: Vulnerable Components
- [ ] `npm audit` / `pip-audit` / `cargo audit` in CI
- [ ] Dependabot/Renovate enabled
- [ ] SBOM generated (Syft/CycloneDX)
- [ ] SLSA provenance for builds
- [ ] Block CVSS >= 7.0 from merging

### A07: Authentication Failures
- [ ] MFA for admin/sensitive operations
- [ ] Brute force protection (rate limit, lockout)
- [ ] Secure password reset (tokens, expiry)
- [ ] Session management (secure, httpOnly, SameSite)
- [ ] JWT: short expiry, RS256, validation

### A08: Software Integrity Failures
- [ ] Signed artifacts (cosign/sigstore)
- [ ] CI/CD pipeline integrity (SLSA)
- [ ] Dependency verification (npm audit signatures)
- [ ] No unsigned/unverified deploys
- [ ] Rollback capability tested

### A09: Logging/Monitoring Failures
- [ ] Structured logs (JSON, correlation IDs)
- [ ] Security events logged (auth failures, access denied)
- [ ] No PII/secrets in logs
- [ ] Alerting on anomalies
- [ ] Log integrity (immutable, tamper-evident)

### A10: SSRF
- [ ] Allowlist for outbound requests
- [ ] No user-controlled URLs in fetch
- [ ] Network segmentation (egress controls)
- [ ] Metadata service blocked (169.254.169.254)

## Code Review Security Patterns

### Input Validation
```python
# Good: Schema at boundary
class CreateUserRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=12, max_length=128)
    role: Literal["user", "admin"] = "user"

@app.post("/users")
async def create_user(req: CreateUserRequest, current_user: User = Depends(require_admin)):
    ...
```

### Authorization
```python
# Good: Explicit policy
class OrderPolicy:
    @staticmethod
    def can_view(user: User, order: Order) -> bool:
        return user.id == order.user_id or user.is_admin
    
    @staticmethod
    def can_refund(user: User, order: Order) -> bool:
        return user.is_admin and order.status == "delivered"

# Usage
if not OrderPolicy.can_view(current_user, order):
    raise ForbiddenError("Cannot view this order")
```

### Secrets Detection
```bash
# Pre-commit
- repo: https://github.com/Yelp/detect-secrets
  rev: v1.5.0
  hooks:
    - id: detect-secrets
      args: ['--baseline', '.secrets.baseline']
```

### SAST Integration
```yaml
# GitHub Actions
- name: CodeQL
  uses: github/codeql-action/analyze@v3
  with:
    languages: python, javascript
    queries: security-extended,security-and-quality
```

## ML-Specific Security

### Model Artifacts
- [ ] Scan with Model Safety MCP (pickle, malicious weights)
- [ ] Sign models (cosign)
- [ ] Verify provenance (SLSA)
- [ ] Sandbox inference (gVisor, Firecracker)

### Data Poisoning
- [ ] Input validation on training data
- [ ] Anomaly detection on data drift
- [ ] Signed datasets with checksums

### Adversarial Robustness
- [ ] Adversarial testing in CI
- [ ] Certified defenses where critical
- [ ] Monitoring for distribution shift

## Tools (MCP Servers)

| Server | Purpose |
|--------|---------|
| `sonarqube` | SAST, quality gates, security hotspots |
| `mcp-server-analyzer` | Ruff, Vulture, Biome, ty |
| `model-safety-mcp` | Scan .pt/.pth for malicious pickles |
| `semgrep-mcp` | Custom security rules |
| `ingero` | GPU/cuda security observability |

## Skill Invocation

Auto-invoked when:
- `@security-auditor` agent activated
- `/careful-review` includes security focus
- New auth/authorization code
- Dependency updates
- Pre-release security gate

**Output**: Severity-rated findings with exploit scenarios and fixes