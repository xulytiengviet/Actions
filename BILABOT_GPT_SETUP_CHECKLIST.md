# Bilabot CVNSS4.0 — Production Setup Checklist

## A. GPT identity
**Name:** Bilabot CVNSS4.0

**Description:**
Trợ lý chuyên gia CVNSS4.0: chuyển đổi CQN↔CVNSS4.0 bằng codec v5.0 audit-safe, chat CVNSS4.0, audit ambiguity/collision, giải thích quy tắc, thiết kế schema/IR và pipeline NLP/corpus.

## B. Instructions
Use the full contents of `BILABOT_GPT_INSTRUCTIONS.md`.

Remove or override any older instruction that says:
- always search Knowledge before conversion;
- always audit or round-trip before replying;
- always show CQN | CVNSS | decode-back tables;
- manually infer conversion before calling the Action.

## C. Knowledge
Recommended canonical set:
1. `01_CVNSS4_Source_of_Truth.md`
2. `02_CVNSS4_Canonical_Rules.md`
3. `03_CVNSS4_Golden_Tests.csv`
4. `CVNSS4_FAST_LOOKUP.csv`
5. CVNSS4.0 textbook/reference PDF
6. v5.0 audit-safe converter source, if desired for reference

Knowledge is for reference/audit, not the conversion hot path.

## D. Capabilities
Recommended:
- Web Search: ON for external research, but Instructions forbid it for ordinary conversion.
- Code Interpreter / Data Analysis: ON if converter/corpus/file audits are needed.
- Image Generation: optional.
- Apps: OFF when Actions are enabled. GPTs can use Apps or Actions, not both simultaneously.
- Use a non-Pro model that supports Actions; custom Actions are not available in Pro mode.

## E. Actions
### Runtime
Use the deployed Cloudflare Worker from repository `xulytiengviet/Actions`.

Do NOT paste the static GitHub source schema with a relative server URL into production if a deployed dynamic schema is available.

Preferred import URL:
`https://<your-worker-domain>/openapi.yaml`

The Worker dynamically injects its own absolute HTTPS origin.

### Authentication
For initial validation: `None` is acceptable if `CVNSS_API_KEY` is not configured.

For production/private use: configure `CVNSS_API_KEY` in the Worker and choose matching API-key authentication in GPT Actions.

### Expected operations
- `convertInstant`
- `inspectCvnssWord`
- `cvnssHealth`

### Privacy policy
Use:
`https://<your-worker-domain>/privacy`

A public GPT with Actions needs a valid privacy policy URL.

## F. Conversation starters
Add exactly:
- ⚡ Bật chat CVNSS4.0
- ↔ CQN + CVNSS4.0
- 🔤 Chuyển nhanh sang CVNSS4.0
- 🔍 Audit một từ CVNSS4.0

## G. Preview acceptance tests
### G1. Health
Prompt: `Kiểm tra bộ chuyển đổi CVNSS4.0.`
Expected: `cvnssHealth` is called and reports healthy/self-test OK.

### G2. Decode hot path
Prompt:
`Giải mã: Banr cikj vaol zaub X goc faiz ov bagz naol cugs dush deq xoaj bail hat vij zur, ses conl lair 3 bagz trogb.`
Expected:
- `convertInstant`
- from=`cvss`
- to=`cqn`
- no web
- no Knowledge retrieval first
- no audit first
- direct decoded text

### G3. Encode hot path
Prompt: `#cv1 Tôi yêu tiếng Việt.`
Expected:
- `convertInstant`
- from=`cqn`
- to=`cvss`
- output only

### G4. FAST chat
Starter: `⚡ Bật chat CVNSS4.0`
Then send a normal Vietnamese question.
Expected: final answer displayed in CVNSS4.0 via Action.

### G5. DUAL mode
Starter: `↔ CQN + CVNSS4.0`
Expected exactly two representations: CQN and CVNSS4.0.

### G6. Audit isolation
Prompt: `#audit ed`
Expected: `inspectCvnssWord`, not normal Knowledge-based guessing.

### G7. Action failure behavior
Temporarily use an invalid endpoint in a test copy only.
Expected: GPT states Action unavailable before using fallback; it must not silently pretend deterministic conversion succeeded.

## H. Publish/update
Use Preview for all acceptance tests before selecting Update.
After changing an existing GPT, select **Update** to apply the draft.
Use Version history before major changes so rollback is possible.

## I. Production pass criteria
Bilabot is ready only when all are true:
- Worker `/health` returns self-test OK.
- `/openapi.yaml` opens over public HTTPS.
- GPT Editor detects all 3 operations.
- decode test uses Action first.
- encode test uses Action first.
- audit test is isolated from normal conversion.
- Apps are not simultaneously enabled with Actions.
- privacy policy URL is valid if GPT is shared/public.
- final Preview tests pass before Update.
