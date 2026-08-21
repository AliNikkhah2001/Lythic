# Security Rules

## Mandatory Security Checks

### Authentication & Authorization
- All external calls behind interfaces with proper auth
- JWT tokens validated with RS256, short expiry (15min access, 7d refresh)
- Role-based access control (RBAC) on all API endpoints
- API keys rotated every 90 days, stored in vault/environment variables

### Input Validation
- Validate all inputs at API boundary using Zod/Pydantic schemas
- Sanitize user inputs for SQL, NoSQL, command injection
- Content Security Policy (CSP) headers on all responses
- Rate limiting: 100 req/min per IP, 1000 req/min per user

### Secrets Management
- No secrets in code, config files, or logs
- Use environment variables or secret managers (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets automatically via CI/CD pipeline
- Audit secret access quarterly

### Data Protection
- Encrypt PII at rest (AES-256) and in transit (TLS 1.3)
- Implement data retention policies with automated cleanup
- GDPR/CCPA compliance: right to deletion, data portability
- Audit logs for all data access (immutable, 7-year retention)

### Dependency Security
- Scan dependencies weekly with `npm audit` / `pip-audit` / `cargo audit`
- Pin dependencies to exact versions in lockfiles
- Use dependabot/renovate for automated updates
- Block critical CVEs (CVSS >= 7.0) from merging

### Code Security
- Static analysis: SonarQube, Semgrep, CodeQL in CI
- No `eval()`, `exec()`, `Function()` with user input
- Path traversal protection: validate file paths with `path.resolve()`
- XSS prevention: auto-escape in templates, CSP headers