# ⚡ CVNSS4.0 Actions — Instant CQN ↔ CVNSS4.0 API

Repo này là backend **deterministic codec** cho Custom GPT CVNSS4.0. Mọi thao tác chuyển đổi bình thường đi thẳng qua converter v5.0 audit-safe; LLM không cần tự suy luận bảng luật trước khi dịch.

## Bilabot CVNSS4.0 — cấu hình production

Hai file chuẩn để cấu hình Custom GPT:

- `BILABOT_GPT_INSTRUCTIONS.md` — Instructions production, bắt buộc Action-first cho mọi chuyển đổi CQN ↔ CVNSS4.0.
- `BILABOT_GPT_SETUP_CHECKLIST.md` — checklist Name/Description/Knowledge/Capabilities/Actions/Privacy/Conversation starters/Preview tests/Update.

Không dùng các Instructions cũ yêu cầu search Knowledge hoặc audit trước mọi conversion.

## Kiến trúc

`Custom GPT → POST /convert → CVNSS4.0 v5.0 codec → JSON result`

Chỉ dùng `/inspect` khi người dùng yêu cầu audit hoặc khi cần xem ambiguity/candidate.

## Endpoint

- `POST /convert` — hot path CQN/CVN/CVNSS4.0.
- `POST /inspect` — audit một từ.
- `GET /health` — self-test + audit metadata.
- `GET /openapi.yaml` — OpenAPI **động**, tự chèn domain HTTPS của Worker đang chạy.
- `GET /privacy` — privacy policy tối thiểu cho GPT Action công khai.

## Vì sao không dùng GitHub Pages làm API?

GitHub Pages là static hosting; nó không chạy `POST /convert`. GitHub repo này quản lý mã nguồn và GitHub Actions, còn runtime được deploy thành Cloudflare Worker để có HTTPS API thực sự.

## Deploy một lần

Trong GitHub repo → **Settings → Secrets and variables → Actions**, tạo:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Sau đó chạy workflow **Deploy CVNSS4 Actions API** hoặc push thay đổi runtime lên `main`.

Workflow sẽ in ra:

- Worker URL
- GPT schema URL: `<Worker URL>/openapi.yaml`
- Health URL: `<Worker URL>/health`

## GPT Editor

Vào **Actions → Create new action → Import from URL** và dùng:

`https://<worker-domain>/openapi.yaml`

Không cần sửa thủ công `YOUR-PUBLIC-HTTPS-DOMAIN` nữa: endpoint `/openapi.yaml` tự sinh `servers[0].url` đúng bằng origin đang deploy.

Sau khi import, GPT Editor phải nhận ra:

- `convertInstant`
- `inspectCvnssWord`
- `cvnssHealth`

Privacy Policy URL:

`https://<worker-domain>/privacy`

## Kiểm tra local

```bash
node scripts/assemble-converter.mjs
node test.mjs
```

Converter phải trả `selfTest.ok = true` trước khi deploy.

## Fast policy cho GPT

- Chuyển/giải mã bình thường → gọi `convertInstant` ngay.
- Không search Knowledge trước.
- Không chạy `audit()` trước.
- Không hiện bảng round-trip trừ khi được hỏi.
- `#audit` → gọi `inspectCvnssWord`.

## Source

- `assets/cvnss_converter.js.gz.b64` — bản nén lossless của CVNSS4.0 Converter 5.0.0 audit-safe.
- `scripts/assemble-converter.mjs` — dựng lại `src/cvnss_converter.js` trước test/deploy.
- `src/worker.mjs` — serverless API wrapper.
- `01_CVNSS4_ACTION_OPENAPI.yaml` — schema nguồn; bản deploy động ở `/openapi.yaml`.
