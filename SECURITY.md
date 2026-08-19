# Security policy

## Reporting a vulnerability

Report vulnerabilities through this repository’s **Security → Report a vulnerability** flow when available; otherwise contact the repository owner privately. Do not open a public issue with exploit details, credentials, personal data, private game links, or payment proof images.

Include the affected route, impact, reproduction steps, and whether the issue was observed in production. Use test accounts and synthetic data only.

## Supported version

Relay is currently pre-V1. Security fixes target the latest production deployment from `master`; older deployments are not supported.

## Operational boundaries

- Relay never processes payments. Payment details and proof images coordinate repayment only.
- Court listings and external booking links must be confirmed with the venue.
- Secrets belong in `.env.local` and Vercel environment variables, never issues, logs, screenshots, or committed files.
- Administrators are allowlisted server-side. Navigation visibility is not authorization.
