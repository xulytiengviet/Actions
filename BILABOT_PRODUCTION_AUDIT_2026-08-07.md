# Bilabot CVNSS4.0 — Production Audit

Date: 2026-08-07

## Executive result
The deterministic CVNSS4.0 conversion layer is technically ready at source level. The remaining production gate is the **live Worker deployment + GPT Editor UI configuration**, which cannot be verified solely from the GitHub source repository.

## Audit matrix

| Area | Status | Result |
|---|---|---|
| Converter v5.0 audit-safe | PASS | selfTest 23/23, 0 failures |
| Reverse overwrite safety | PASS | silentReverseOverwrite = 0 |
| Base rows | PASS | 758 |
| Patch entries | PASS | 336 (324 + 12) |
| Ambiguity groups | PASS | 56 |
| Explicit canonical policies | PASS | 56 |
| Critical collision groups | PASS | 5 |
| Sample long CVNSS decode | PASS | Decodes to expected Vietnamese text |
| Local HTTP `/convert` | PASS | Deterministic conversion works |
| Local HTTP `/health` | PASS | Reports selfTest OK |
| Worker wrapper | PASS (source) | `/convert`, `/inspect`, `/health`, `/openapi.yaml`, `/privacy` implemented |
| Dynamic OpenAPI origin | PASS (source) | deployed `/openapi.yaml` injects request origin |
| GitHub CI/CD definition | PASS (source) | assemble → test → Cloudflare deploy |
| Live Worker HTTPS URL | NOT VERIFIED | Requires successful Cloudflare deployment |
| Live `/health` | NOT VERIFIED | Requires Worker URL |
| Live `/openapi.yaml` | NOT VERIFIED | Requires Worker URL |
| GPT Action import | NOT VERIFIED | Requires access to authenticated GPT Editor UI |
| GPT detects 3 operations | NOT VERIFIED | Must verify in GPT Editor after schema import |
| GPT Action authentication | NOT VERIFIED | Must verify chosen None/API-key setting in editor |
| Privacy Policy field | NOT VERIFIED | Must point to deployed `/privacy` for shared/public GPT |
| Apps disabled while Actions enabled | NOT VERIFIED | Must verify in GPT Editor |
| Action-compatible non-Pro model | NOT VERIFIED | Must verify in GPT Editor |
| Knowledge set | NOT VERIFIED | Must verify files currently uploaded to Bilabot |
| Instructions saved in Bilabot | NOT VERIFIED | Must paste/use `BILABOT_GPT_INSTRUCTIONS.md` and Update |
| Conversation starters | NOT VERIFIED | Must verify four production starters |
| Preview acceptance tests | NOT VERIFIED | Must run in Bilabot Preview |

## Canonical GPT configuration
Use:
- `BILABOT_GPT_INSTRUCTIONS.md`
- `BILABOT_GPT_SETUP_CHECKLIST.md`

Do not use older conversion instructions that search Knowledge or run audit before normal conversion.

## Required GPT Action operations
- `convertInstant` — ordinary conversion hot path
- `inspectCvnssWord` — explicit word audit only
- `cvnssHealth` — health/self-test

## Production routing invariant
Normal conversion must follow:

`input → convertInstant → output`

FAST-CVNSS chat must follow:

`CVNSS input → convertInstant(cvss→cqn) → LLM reply in CQN → convertInstant(cqn→cvss) → output`

Knowledge must not be the normal conversion engine.

## Final production gates
Before marking Bilabot production-ready, all of these must pass in the authenticated GPT Editor:
1. Worker `/health` is reachable via HTTPS and selfTest is true.
2. Import `<worker-origin>/openapi.yaml` succeeds.
3. GPT Editor detects `convertInstant`, `inspectCvnssWord`, `cvnssHealth`.
4. Apps are off when Actions are enabled.
5. Privacy Policy uses `<worker-origin>/privacy` when sharing/public publishing.
6. Decode prompt calls `convertInstant` before Knowledge/web/audit.
7. Encode prompt calls `convertInstant` and returns output only.
8. `#audit ed` routes to `inspectCvnssWord`.
9. FAST-CVNSS mode performs decode → reasoning → encode via Action.
10. Select **Update** after all Preview tests pass.
